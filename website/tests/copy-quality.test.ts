// Guards the words owners read: no lowercase sentence starts, no contradictions between a
// summary and its details, no "strong fit" for tools that don't solve the #1 problem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPlan } from '../lib/pipeline';
import type { Answers } from '../lib/intake/brief';

const scenarios: Record<string, Answers> = {
  landscaper: { industry: 'home', teamSize: '2-10', software: ['QuickBooks', 'Google Calendar', 'Jobber'], mustKeep: ['Jobber'], techComfort: 'steps', setupBy: 'me', areas: ['service', 'marketing'], struggles: ['C1', 'C2', 'M1'], focus: 'C1', followups: { X2: 'request', X4: 'google', X8: ['facebook', 'instagram'], X9: 'schedule' }, budget: '50-149', annual: 'no', dataHandled: ['contacts'], autonomy: 'send' },
  cafe: { industry: 'food', teamSize: '2-10', software: ['Square', 'Canva', 'QuickBooks'], techComfort: 'avoid', setupBy: 'nobody', areas: ['stock', 'money', 'marketing'], struggles: ['S1', 'F2', 'M1'], focus: 'S1', followups: { X8: ['instagram'], X9: 'schedule' }, budget: 'under-50', dataHandled: ['financial'], autonomy: 'organise' },
  agency: { industry: 'professional', teamSize: '2-10', software: ['QuickBooks', 'Microsoft 365 / Outlook', 'HubSpot'], techComfort: 'comfortable', setupBy: 'me', areas: ['marketing', 'admin'], struggles: ['M6', 'M5', 'A1'], focus: 'M6', followups: { X14: ['zoom'] }, budget: '150-499', dataHandled: ['contacts'], autonomy: 'draft' },
  clinic: { industry: 'health', teamSize: '11-50', software: ['Google Calendar'], techComfort: 'steps', setupBy: 'team', areas: ['service', 'admin'], struggles: ['C1', 'C4', 'A1'], focus: 'C4', followups: { X5: ['emergencies'] }, budget: '500+', dataHandled: ['health'], autonomy: 'send' },
};
const startsUpper = (t: string) => /^[A-Z0-9“"$✋]/.test(t.trim());
const clean = (t: string) => !/\s{2,}|\s[.,;]|\.\.|\(\s|\s\)|(?<![.\w-])(ai|seo|crm|sms)(?![-.\w])/.test(t);

for (const [name, answers] of Object.entries(scenarios)) test(`owner-facing text is clean and consistent: ${name}`, () => {
  const p = runPlan(answers);
  const texts: [string, string][] = [];
  for (const r of p.review.reviews) {
    for (const pl of r.pillars) texts.push([`${r.name} › ${pl.label}`, pl.reason]);
    for (const c of r.checkBeforeBuying) texts.push([`${r.name} › check`, c]);
    for (const m of r.missingLinks) texts.push([`${r.name} › link`, m]);
    for (const g of r.gates) texts.push([`${r.name} › gate`, g]);
    texts.push([`${r.name} › summary`, r.compatibility.summary], [`${r.name} › basis`, r.fitBasis.label], [`${r.name} › confidence`, r.confidenceReason]);
    // Labels must agree with the facts they summarise.
    if (r.quadrant.startsWith('Strong fit')) assert.ok(r.coversFocus, `${r.name}: "strong fit" but does not solve the #1 problem`);
    const viaZ = r.compatibility.items.some(i => i.grade === 'via-zapier');
    if (viaZ) assert.match(r.compatibility.summary, /Zapier/, `${r.name}: Zapier route missing from summary`);
    if (/not yet verified/.test(r.compatibility.summary)) assert.ok(r.compatibility.items.every(i => i.grade === 'unknown'));
    const known = r.pillars.filter(x => x.id !== 'owners' && x.score !== null).length;
    assert.equal(r.fitBasis.known, Math.min(known, r.fitBasis.total), `${r.name}: basis count`);
    if (r.status === 'top-pick') assert.notEqual(r.confidence, 'Low');
  }
  for (const n of [...p.review.notes, ...p.review.weightReasons, ...p.integration.notes]) texts.push(['note', n]);
  for (const x of p.integration.recipes) texts.push([`recipe ${x.title}`, x.plain]);
  for (const w of p.integration.recommended?.why ?? []) texts.push(['why', w]);
  for (const [where, t] of texts) {
    assert.ok(startsUpper(t), `${name} · ${where}: starts lowercase → "${t}"`);
    assert.ok(clean(t), `${name} · ${where}: messy text → "${t}"`);
  }
});
