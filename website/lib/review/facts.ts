// Cited trust, privacy and setup facts per tool, extracted offline from each vendor's own domain
// (scripts/enrich-tool-facts.mts) and validated here. The Review Engine reads them as data, so
// rating stays deterministic and free. A fact counts only with an exact quote from a URL on the
// vendor's own domain; otherwise it is "not-found". Missing evidence is never a red flag.
import { z } from 'zod';
import factsFile from '../../data/reviewed/tool-facts.json';
import reviewsFile from '../../data/reviewed/fact-reviews.json';

export const FACTS_VERSION = '1.0.0';
const cite = { quote: z.string().max(400).nullable().optional(), url: z.string().max(500).nullable().optional() };
const factSchema = z.object({
  soc2: z.object({ status: z.enum(['type2', 'stated', 'not-found']), ...cite }),
  iso27001: z.object({ status: z.enum(['stated', 'not-found']), ...cite }),
  trustCenter: z.object({ url: z.string().max(500).nullable().optional() }).optional(),
  trainsOnData: z.object({ status: z.enum(['no', 'opt-out', 'yes', 'not-found']), ...cite }),
  retention: z.object({ status: z.enum(['stated', 'not-found']), summary: z.string().max(200).nullable().optional(), ...cite }),
  hipaaBaa: z.object({ status: z.enum(['available', 'not-available', 'not-found']), note: z.string().max(200).nullable().optional(), ...cite }),
  setup: z.object({
    selfServe: z.boolean().nullable().optional(), browserExtension: z.boolean().nullable().optional(), phoneForwarding: z.boolean().nullable().optional(),
    websiteSnippet: z.boolean().nullable().optional(), apiKeyRequired: z.boolean().nullable().optional(), codeRequired: z.boolean().nullable().optional(),
    salesCallRequired: z.boolean().nullable().optional(),
    evidence: z.array(z.object({ fact: z.string().max(80), quote: z.string().max(400), url: z.string().max(500) })).max(8).default([]),
  }),
  integrations: z.array(z.object({ app: z.string().max(60), quote: z.string().max(300), url: z.string().max(500) })).max(25).default([]),
  pricing: z.object({ summary: z.string().max(200).nullable().optional(), ...cite }).optional(),
});
export type RawFacts = z.infer<typeof factSchema>;
export type ToolFacts = RawFacts & { toolId: string; domain: string; checkedAt: string; sourcesSeen: number };
type FactsFile = { version: string; generatedAt: string | null; tools: Record<string, ToolFacts> };

export const hostOf = (u?: string | null) => { try { return new URL(u ?? '').hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } };
export const rootDomain = (host: string) => host.split('.').slice(-2).join('.');
const onDomain = (url: string | null | undefined, domain: string) => { const h = hostOf(url); return !!h && (h === domain || h.endsWith(`.${domain}`)); };
// Blog/news articles are marketing about the topic, not commitments by the vendor.
const isPolicyPage = (url: string | null | undefined) => { try { return !/\/(blog|news|articles?\/(?!\d)|resources\/blog)/i.test(new URL(url ?? '').pathname) || /^(help|support|docs)\./.test(hostOf(url)); } catch { return false; } };

/** Make model output schema-shaped: missing sections → not-found, unknown statuses → not-found, bad entries dropped. */
function normalise(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {});
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);
  const fact = (v: unknown, allowed: string[], extra: Record<string, unknown> = {}) => {
    const o = obj(v); const status = typeof o.status === 'string' && allowed.includes(o.status) ? o.status : 'not-found';
    return { status, quote: str(o.quote), url: str(o.url), ...extra };
  };
  const s = obj(r.setup);
  const list = (v: unknown, keys: string[]) => (Array.isArray(v) ? v : []).map(obj).filter(e => keys.every(k => str(e[k]))).map(e => Object.fromEntries(keys.map(k => [k, str(e[k])!.slice(0, k === 'quote' ? 400 : 500)])));
  return {
    soc2: fact(r.soc2, ['type2', 'stated', 'not-found']), iso27001: fact(r.iso27001, ['stated', 'not-found']),
    trustCenter: { url: str(obj(r.trustCenter).url) },
    trainsOnData: fact(r.trainsOnData, ['no', 'opt-out', 'yes', 'not-found']),
    retention: fact(r.retention, ['stated', 'not-found'], { summary: str(obj(r.retention).summary)?.slice(0, 200) ?? null }),
    hipaaBaa: fact(r.hipaaBaa, ['available', 'not-available', 'not-found'], { note: str(obj(r.hipaaBaa).note)?.slice(0, 200) ?? null }),
    setup: {
      selfServe: bool(s.selfServe), browserExtension: bool(s.browserExtension), phoneForwarding: bool(s.phoneForwarding), websiteSnippet: bool(s.websiteSnippet),
      apiKeyRequired: bool(s.apiKeyRequired), codeRequired: bool(s.codeRequired), salesCallRequired: bool(s.salesCallRequired),
      evidence: list(s.evidence, ['fact', 'quote', 'url']).map(e => ({ ...e, fact: e.fact.slice(0, 80) })).slice(0, 8),
    },
    integrations: list(r.integrations, ['app', 'quote', 'url']).map(e => ({ ...e, app: e.app.slice(0, 60), quote: e.quote.slice(0, 300) })).slice(0, 25),
    pricing: r.pricing ? { summary: str(obj(r.pricing).summary)?.slice(0, 200) ?? null, quote: str(obj(r.pricing).quote), url: str(obj(r.pricing).url) } : undefined,
  };
}

/** Downgrade every claim that lacks a quote from the vendor's own domain. Exported for the script and tests. */
export function validateFacts(raw: unknown, domain: string): RawFacts | null {
  const p = factSchema.safeParse(normalise(raw));
  if (!p.success) return null;
  const f = p.data;
  const ok = (c: { quote?: string | null; url?: string | null }) => !!c.quote && c.quote.trim().length >= 8 && onDomain(c.url, domain) && isPolicyPage(c.url);
  if (f.soc2.status !== 'not-found' && !ok(f.soc2)) f.soc2 = { status: 'not-found' };
  if (f.iso27001.status !== 'not-found' && !ok(f.iso27001)) f.iso27001 = { status: 'not-found' };
  if (f.trainsOnData.status !== 'not-found' && !ok(f.trainsOnData)) f.trainsOnData = { status: 'not-found' };
  if (f.retention.status !== 'not-found' && !ok(f.retention)) f.retention = { status: 'not-found' };
  if (f.hipaaBaa.status !== 'not-found' && !ok(f.hipaaBaa)) f.hipaaBaa = { status: 'not-found' };
  if (f.trustCenter?.url && !onDomain(f.trustCenter.url, domain)) f.trustCenter = { url: null };
  if (f.pricing && !ok(f.pricing)) f.pricing = undefined;
  f.setup.evidence = f.setup.evidence.filter(e => e.quote.trim().length >= 8 && onDomain(e.url, domain));
  // Setup booleans only stand if some on-domain evidence exists.
  if (!f.setup.evidence.length) f.setup = { evidence: [] };
  f.integrations = f.integrations.filter(i => i.quote.trim().length >= 4 && onDomain(i.url, domain));
  return f;
}

const FILE = factsFile as unknown as FactsFile;
type Review = { status: string; reviewedAt: string; note: string };
export const FACT_REVIEWS = (reviewsFile as { reviews: Record<string, { trainsOnData?: Review }> }).reviews;
// Re-validate stored facts on load (rules apply even to older files), then apply human reviews.
export const TOOL_FACTS: Record<string, ToolFacts & { trainsReview?: Review }> = Object.fromEntries(Object.entries(FILE.tools ?? {}).flatMap(([id, t]) => {
  const v = validateFacts(t, t.domain);
  if (!v) return [];
  const review = FACT_REVIEWS[id]?.trainsOnData;
  if (review) v.trainsOnData = { ...v.trainsOnData, status: review.status as RawFacts['trainsOnData']['status'], ...(review.status === 'not-found' ? { quote: null, url: null } : {}) };
  return [[id, { ...v, toolId: id, domain: t.domain, checkedAt: t.checkedAt, sourcesSeen: t.sourcesSeen, trainsReview: review }]];
}));
export const FACTS_GENERATED_AT = FILE.generatedAt;
export function factsFor(toolId: string) { return TOOL_FACTS[toolId] ?? null; }

// ── Security & privacy badge ──────────────────────────────────────────
export type Badge = { level: 'green' | 'yellow' | 'grey' | 'red'; label: string; points: string[]; citations: { label: string; url: string }[] };
export function securityBadge(f: (ToolFacts & { trainsReview?: Review }) | null): Badge {
  if (!f) return { level: 'grey', label: 'Not enough public information', points: ['We have not checked this vendor’s security and privacy pages yet.'], citations: [] };
  const points: string[] = []; const citations: Badge['citations'] = [];
  const add = (text: string, c?: { url?: string | null }, label = 'Vendor page') => { points.push(text); if (c?.url) citations.push({ label, url: c.url }); };
  if (f.soc2.status !== 'not-found') add(f.soc2.status === 'type2' ? 'States SOC 2 Type II' : 'States SOC 2', f.soc2, 'SOC 2 statement');
  if (f.iso27001.status === 'stated') add('States ISO 27001', f.iso27001, 'ISO 27001 statement');
  if (f.trustCenter?.url) add('Has a public trust/security page', f.trustCenter, 'Trust page');
  if (f.trainsOnData.status === 'no') add('Says it does not train AI on your data', f.trainsOnData, 'AI training policy');
  if (f.trainsOnData.status === 'opt-out') add('Uses data to improve AI unless you opt out', f.trainsOnData, 'AI training policy');
  if (f.trainsOnData.status === 'yes') add(f.trainsReview ? 'Uses customer data to train its AI (quote reviewed by our team)' : 'Its policy mentions using customer data for AI training: read the quote', f.trainsOnData, 'AI training policy');
  if (f.retention.status === 'stated') add(`Data retention: ${f.retention.summary ?? 'stated'}`, f.retention, 'Retention');
  if (f.hipaaBaa.status === 'available') add(`HIPAA BAA available${f.hipaaBaa.note ? ` (${f.hipaaBaa.note})` : ''}`, f.hipaaBaa, 'HIPAA');
  const cert = f.soc2.status !== 'not-found' || f.iso27001.status === 'stated';
  const level: Badge['level'] = f.trainsOnData.status === 'yes' && f.trainsReview ? 'red' : f.trainsOnData.status === 'yes' ? 'yellow'
    : cert && (f.trainsOnData.status === 'no' || f.trainsOnData.status === 'opt-out') ? 'green'
    : cert || f.trainsOnData.status !== 'not-found' || f.retention.status === 'stated' || f.trustCenter?.url ? 'yellow' : 'grey';
  const label = { green: 'Strong security signals', yellow: 'Some security commitments', grey: 'Not enough public information', red: 'Uses your data to train its AI' }[level];
  if (!points.length) points.push('No security, privacy or AI-training statements found on the vendor’s site.');
  return { level, label, points, citations };
}

// ── Integration Complexity Index (ICI) ───────────────────────────────
export type IciTier = 1 | 2 | 3 | 4;
export const ICI_LABEL: Record<IciTier, string> = { 1: 'Instant: sign up and use', 2: 'No-code setup', 3: 'Assisted setup', 4: 'Developer required' };
/** Fill setup flags from the cited evidence text when the extractor left them empty.
 *  Optional or enterprise-only requirements do not count against a small business. */
export function deriveSetup(setup: RawFacts['setup']): RawFacts['setup'] {
  const ev = setup.evidence.map(e => e.fact.toLowerCase());
  const any = (re: RegExp, not?: RegExp) => ev.some(t => re.test(t) && !(not && not.test(t)));
  const notSmb = /optional|enterprise|sso|hipaa|baa|for developers who|large team|custom quote/;
  return {
    ...setup,
    phoneForwarding: setup.phoneForwarding ?? any(/forward/),
    browserExtension: setup.browserExtension ?? any(/chrome extension|browser extension|extension for/),
    websiteSnippet: setup.websiteSnippet ?? any(/embed|snippet|script tag|widget|copy.{0,20}code/),
    selfServe: setup.selfServe ?? any(/self-serve|self serve|sign ?up|free plan|free trial|no credit card|start free/),
    // API keys for a vendor's developer API are not part of normal use.
    apiKeyRequired: setup.apiKeyRequired ?? any(/api key.*(required|need)|requires? .*api key/, /optional|enterprise|api access|api trial|api integration|developer|header|http|connections that need|sdk/),
    codeRequired: setup.codeRequired ?? any(/(requires?|needs?) (custom )?(code|coding|developer)|developer required|sdk required/, /no[- ]code/),
    salesCallRequired: setup.salesCallRequired ?? any(/contact sales|book a demo|demo required|onboarding call|talk to sales/, notSmb),
  };
}

export function iciTier(f: ToolFacts | null, fallback: { audience: string; category: string; existingOnly: boolean }): { tier: IciTier; reasons: string[]; cited: boolean } {
  const s = f ? deriveSetup(f.setup) : undefined;
  const reasons: string[] = [];
  const has = !!s && s.evidence.length > 0;
  if (has && s!.codeRequired) { reasons.push('Requires code or a developer'); return { tier: 4, reasons, cited: true }; }
  if (!has && fallback.audience === 'developer') return { tier: 4, reasons: ['Described as a developer platform'], cited: false };
  if (has && (s!.apiKeyRequired || s!.phoneForwarding || s!.salesCallRequired)) {
    if (s!.phoneForwarding) reasons.push('Needs phone call-forwarding set up with your carrier');
    if (s!.apiKeyRequired) reasons.push('Needs API keys or account linking by hand');
    if (s!.salesCallRequired) reasons.push('Needs a sales or onboarding call');
    return { tier: 3, reasons, cited: true };
  }
  if (!has) {
    if (fallback.category === 'calls') return { tier: 3, reasons: ['Phone agents need call-forwarding setup'], cited: false };
    if (fallback.audience === 'builder') return { tier: 3, reasons: ['You build and configure the assistant yourself'], cited: false };
    if (fallback.existingOnly) return { tier: 3, reasons: ['Add-on that needs vendor onboarding'], cited: false };
    return { tier: 2, reasons: ['Typical web-app setup (not yet verified)'], cited: false };
  }
  if (s!.browserExtension || (s!.selfServe && !s!.websiteSnippet)) { reasons.push(s!.browserExtension ? 'Browser extension or web app, self-serve' : 'Self-serve web app'); return { tier: 1, reasons, cited: true }; }
  if (s!.websiteSnippet) reasons.push('Paste a snippet into your website');
  else reasons.push('Configure inside the app; built-in connections');
  return { tier: 2, reasons, cited: true };
}
