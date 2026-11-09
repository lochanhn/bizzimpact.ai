// Executable hand-offs that keep the owner in control (no stored credentials):
// - calendar file (.ics) for the adoption timeline and 30-day check-in → Google, Outlook, Apple Calendar
// - spreadsheet (.csv) of the plan → Excel / Google Sheets
// - webhook payload for the owner's own Zapier or Make scenario
import type { PlanResult } from '../pipeline';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** RFC 5545 line folding at 75 octets. */
const fold = (line: string) => { const out: string[] = []; let rest = line; while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); } out.push(rest); return out.join('\r\n'); };

export function planToIcs(p: PlanResult, start = new Date()): string {
  const base = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const day = (n: number) => new Date(base.getTime() + n * 864e5);
  const events: { title: string; desc: string; on: Date }[] = [];
  p.integration.adoption.forEach((a, i) => events.push({ title: `Set up and test ${a.name}`, desc: a.steps.map((s, k) => `${k + 1}. ${s.title}: ${s.detail}`).join('\n'), on: day(i * 7) }));
  const golive = p.integration.adoption.length * 7;
  if (p.integration.adoption.length) {
    events.push({ title: 'Go live with your AI plan', desc: p.integration.recipes.map(r => `• ${r.plain}`).join('\n'), on: day(golive) });
    events.push({ title: '30-day check-in: did it fix the problem?', desc: `${p.integration.checkIn}\nShare your result at bizzimpact.ai to help owners like you.`, on: day(golive + 30) });
  }
  const stamp = `${ymd(new Date())}T000000Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//bizzimpact.ai//AI plan//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  events.forEach((e, i) => lines.push('BEGIN:VEVENT', `UID:${p.planToken.slice(0, 16)}-${i}@bizzimpact.ai`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(e.on)}`, `DTEND;VALUE=DATE:${ymd(new Date(e.on.getTime() + 864e5))}`,
    fold(`SUMMARY:${esc(e.title)}`), fold(`DESCRIPTION:${esc(e.desc)}`), 'END:VEVENT'));
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

const csvCell = (v: unknown) => { const s = String(v ?? ''); const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };
export function planToCsv(p: PlanResult): string {
  const rows: unknown[][] = [['Section', 'Tool', 'Detail', 'Monthly cost', 'Fit', 'Confidence', 'Security', 'Setup tier', 'Source']];
  for (const t of p.integration.recommended?.tools ?? []) {
    const r = p.review.reviews.find(x => x.toolId === t.toolId)!;
    rows.push(['Plan', t.name, `Covers: ${t.covers.join('; ')}`, t.cost, r.fit, r.confidence, r.security.label, `Tier ${r.ici.tier}`, r.discovery.sources[0]?.url]);
  }
  for (const x of p.integration.recipes) rows.push(['Workflow', x.trigger.tool, x.plain, '', '', '', '', x.connectionLabel, x.evidence?.url ?? x.zapierUrl ?? '']);
  for (const a of p.integration.adoption) for (const s of a.steps) rows.push(['Setup step', a.name, `${s.title}: ${s.detail}`]);
  for (const r of p.review.reviews.filter(x => x.status !== 'not-suitable').slice(0, 10)) rows.push(['Compared', r.name, r.quadrant, r.cost.label, r.fit, r.confidence, r.security.label, `Tier ${r.ici.tier}`, r.discovery.sources[0]?.url]);
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Flat, Zapier/Make-friendly payload (arrays become line items). Contains no personal data. */
export function planToWebhookPayload(p: PlanResult) {
  return {
    source: 'bizzimpact.ai', schema: 'bizzimpact.plan/1.0', generatedAt: p.generatedAt,
    business: { industry: p.brief.business.industryLabel, teamSize: p.brief.business.teamSize, country: p.brief.business.country, state: p.brief.business.state ?? null },
    focusProblem: p.brief.focus.label,
    plan: { label: p.integration.recommended?.label ?? null, monthlyCost: p.integration.recommended?.costLabel ?? null, tools: p.integration.recommended?.tools.map(t => t.name) ?? [] },
    tasks: p.integration.adoption.flatMap(a => a.steps.map((s, i) => ({ tool: a.name, order: i + 1, title: s.title, detail: s.detail }))),
    workflows: p.integration.recipes.map(r => ({ title: r.title, description: r.plain, connection: r.connectionLabel, humanApproval: r.humanApproval, link: r.evidence?.url ?? r.zapierUrl })),
    successMeasure: p.integration.successMeasure, checkIn: p.integration.checkIn,
  };
}

// Only the owner's own automation endpoints on Zapier or Make, over HTTPS (prevents SSRF).
const ALLOWED = [/^hooks\.zapier\.com$/, /^hook\.(us|eu)\d\.make\.com$/, /^hook\.make\.com$/];
export function allowedWebhook(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
    return ALLOWED.some(re => re.test(u.hostname)) ? u : null;
  } catch { return null; }
}
