// Problem-first discovery over the reviewed catalogue.
// Intent (controlled capability IDs) → candidate retrieval → fit gates (budget, required existing
// software) → relevance ordering with explanations → coverage map for the rating and
// integration modules. Relevance answers "does this tool address the stated need?"; it is NOT a
// quality rating or a recommendation.
import { z } from 'zod';
import { tools, CATALOG_VERSION, CHECKED, CATEGORIES, type Tool } from '../catalog';
import { CAPABILITIES, capabilityById, CHANNELS, TAXONOMY_VERSION, PRIORITY_CAPABILITIES } from './taxonomy';
import { TOOL_TAGS, type Audience, type IndustryKey, type Strength } from './tool-tags';
import { defaultInterpreter, normalise, type Intent, type ProblemInterpreter } from './interpret';

export const ENGINE_VERSION = '1.0.0';

// ── Request contract ──────────────────────────────────────────────────
export const INDUSTRIES = ['food', 'home', 'retail', 'professional', 'health', 'beauty', 'education', 'manufacturing', 'other'] as const;
export const INDUSTRY_LABELS: Record<typeof INDUSTRIES[number], string> = {
  food: 'Food & Beverage', home: 'Home Services', retail: 'Retail & E-commerce', professional: 'Professional Services',
  health: 'Health & Wellness', beauty: 'Beauty & Personal Care', education: 'Education', manufacturing: 'Manufacturing', other: 'Other',
};
export const TEAM_SIZES = ['solo', '2-10', '11-50', '51-249', '250+'] as const;
export const TEAM_LABELS: Record<typeof TEAM_SIZES[number], string> = { solo: 'Just me', '2-10': '2–10', '11-50': '11–50', '51-249': '51–249', '250+': '250+' };
// Same bands as the master questionnaire (non-overlapping, total across tools).
export const BUDGETS = ['free', 'under-50', '50-149', '150-499', '500+', 'unknown'] as const;
export type Budget = typeof BUDGETS[number];
export const BUDGET_LABELS: Record<Budget, string> = {
  free: 'Free tools only', 'under-50': 'Under $50', '50-149': '$50–$149', '150-499': '$150–$499', '500+': '$500 or more', unknown: 'Not sure yet',
};
const BUDGET_CAP: Record<Budget, number | null> = { free: 0, 'under-50': 49.99, '50-149': 149.99, '150-499': 499.99, '500+': null, unknown: null };

export const discoveryRequestSchema = z.object({
  problem: z.string().trim().min(10, 'Please describe the problem in at least 10 characters.').max(2000, 'Please keep the description under 2,000 characters.'),
  profile: z.object({
    industry: z.enum(INDUSTRIES).optional(),
    teamSize: z.enum(TEAM_SIZES).optional(),
    budget: z.enum(BUDGETS).optional(),
    software: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    priorities: z.array(z.enum(Object.keys(PRIORITY_CAPABILITIES) as [string, ...string[]])).max(3).optional(),
    channels: z.array(z.enum(CHANNELS)).max(8).optional(),
  }).strict().default({}),
  clarification: z.union([z.enum(CHANNELS), z.literal('skip')]).optional(),
  limit: z.number().int().min(1).max(50).default(12),
}).strict();
export type DiscoveryRequest = z.input<typeof discoveryRequestSchema>;
type ParsedRequest = z.output<typeof discoveryRequestSchema>;

// ── Result contract (handoff to Rating and Integration) ───────────────
export type StackSignal = { app: string; status: 'in-your-stack' | 'documented' | 'needs-checking' | 'not-on-plan'; detail: string };
export type Candidate = {
  toolId: string; name: string; category: string; description: string;
  relevance: number;                       // 0–100, need coverage only; not a quality score
  relevanceLabel: string;
  matched: { capabilityId: string; label: string; strength: 'primary' | 'secondary' }[];
  missing: { capabilityId: string; label: string }[];
  reasons: string[];
  evidenceLevel: 'plan' | 'product';
  price: { label: string; lowestKnownMonthly: number | null; freePlan: boolean | null; verified: boolean };
  stack: { inStack: boolean; signals: StackSignal[]; integrationNote: string | null };
  audience: Audience;
  warnings: string[];
  sources: { label: string; url: string }[];
  checkedAt: string;
  channel: 'catalog';
};
export type Excluded = { toolId: string; name: string; reasons: string[] };
export type Coverage = { capabilityId: string; label: string; role: 'required' | 'optional'; toolIds: string[] };
export type Gap = { capabilityId: string; label: string; plain: string; message: string };
export type DiscoveryResult = {
  engineVersion: string; taxonomyVersion: string; catalogVersion: string; checkedAt: string; interpreter: string;
  mode: 'catalog'; modeNote: string;
  status: 'completed' | 'needs_clarification' | 'no_match';
  intent: Intent;
  profileSnapshot: Record<string, unknown>;
  candidates: Candidate[];
  totalCandidates: number;
  excluded: Excluded[];
  coverage: Coverage[];
  gaps: Gap[];
  singleToolCovers: boolean;
  multiToolNeeded: boolean;
  notices: string[];
  stats: { catalogSize: number; considered: number; eligible: number };
};

// ── Helpers ───────────────────────────────────────────────────────────
const STRENGTH: Record<Strength, number> = { p: 1, s: 0.6 };
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const APP_ALIASES: Record<'google' | 'outlook' | 'calendly', { app: string; words: string[] }> = {
  google: { app: 'Google Calendar', words: ['google calendar', 'google workspace', 'gmail', 'g suite', 'google'] },
  outlook: { app: 'Outlook / Microsoft 365', words: ['outlook', 'microsoft 365', 'office 365', 'microsoft'] },
  calendly: { app: 'Calendly', words: ['calendly'] },
};
const norm = (s: string) => normalise(s).join(' ');

function priceInfo(tool: Tool) {
  const known = tool.plans.map(p => p.price.monthly).filter((m): m is number => m !== null);
  const lowest = known.length ? Math.min(...known) : null;
  const free = tool.plans.some(p => p.price.freeOngoing === true) ? true
    : tool.plans.every(p => p.price.monthly !== null && p.price.monthly > 0 && p.price.freeOngoing !== true) ? false : null;
  const verified = tool.reviewLevel !== 'product' && lowest !== null;
  const label = !verified ? 'Price not verified' : free ? `Free plan available${lowest && lowest > 0 ? ` · paid from ${money(lowest)}/mo` : ''}` : `From ${money(lowest!)}/mo`;
  return { label, lowestKnownMonthly: verified ? lowest : null, freePlan: verified ? free : null, verified };
}

function stackFor(tool: Tool, software: string[]): Candidate['stack'] {
  const mine = software.map(norm).filter(s => s.length >= 3 && !['none', 'not sure'].includes(s));
  const signals: StackSignal[] = [];
  const anchor = [tool.research?.existingSoftware, tool.existingOnly, tool.name].filter(Boolean).map(s => norm(s!));
  const own = mine.find(s => anchor.some(a => ` ${a} `.includes(` ${s} `) || ` ${s} `.includes(` ${a} `)));
  if (own) signals.push({ app: tool.research?.existingSoftware ?? tool.name, status: 'in-your-stack', detail: 'You already use this product. Check whether its AI feature is included in your current plan before buying something new.' });
  for (const [key, { app, words }] of Object.entries(APP_ALIASES) as [keyof typeof APP_ALIASES, typeof APP_ALIASES['google']][]) {
    if (!mine.some(s => words.some(w => s.includes(w)))) continue;
    const states = tool.plans.map(p => ({ plan: p.name, state: p.capabilities[key] })).filter(x => x.state);
    if (!states.length) continue;
    const yes = states.filter(s => s.state === 'yes');
    if (yes.length) signals.push({ app, status: 'documented', detail: `${app} connection documented on: ${yes.map(s => s.plan).join(', ')}.` });
    else if (states.every(s => s.state === 'no')) signals.push({ app, status: 'not-on-plan', detail: `${app} connection is not listed on the reviewed plans.` });
    else signals.push({ app, status: 'needs-checking', detail: `${app} connection needs checking on the exact plan.` });
  }
  const note = tool.research?.integrationNotes ?? (tool.caveat || null);
  return { inStack: !!own, signals, integrationNote: note };
}

// ── Discovery ─────────────────────────────────────────────────────────
export type DiscoveryContext = { industry?: string | null; teamSize?: string; budget?: Budget; software?: string[]; limit?: number };

/** Free-text entry point: interpret the problem, then retrieve. */
export function discover(raw: DiscoveryRequest, interpreter: ProblemInterpreter = defaultInterpreter): DiscoveryResult {
  const req = discoveryRequestSchema.parse(raw);
  const profile = req.profile;
  const intent = interpreter.interpret({ problem: req.problem, priorities: profile.priorities, profileChannels: profile.channels, clarification: req.clarification });
  return discoverWithIntent(intent, { industry: profile.industry ?? intent.industryHint, teamSize: profile.teamSize, budget: profile.budget, software: profile.software, limit: req.limit }, { interpreter: interpreter.name, profileSnapshot: profile });
}

/** Core retrieval, shared by the free-text path and the questionnaire (Business Brief) path. */
export function discoverWithIntent(intent: Intent, ctx: DiscoveryContext, meta: { interpreter: string; profileSnapshot: Record<string, unknown> }): DiscoveryResult {
  const industry = (ctx.industry ?? null) as IndustryKey | null;
  const small = ctx.teamSize === undefined || ctx.teamSize === 'solo' || ctx.teamSize === '2-10';
  const software = ctx.software ?? [];
  const budget: Budget = ctx.budget ?? 'unknown';
  const limit = ctx.limit ?? 12;
  const notices = [...intent.notes];

  const required = intent.capabilities.filter(c => c.role === 'required');
  const optional = intent.capabilities.filter(c => c.role === 'optional');
  const scoring = required.length ? required : optional; // optional-only intents are scored on optional needs
  const totalWeight = scoring.reduce((n, c) => n + c.confidence, 0);

  const candidates: Candidate[] = [];
  const excluded: Excluded[] = [];
  for (const tool of tools) {
    const tag = TOOL_TAGS[tool.id];
    if (!tag) continue;
    const covered = scoring.filter(c => tag.caps[c.id]);
    if (!covered.length) continue;

    // Hard gates: requirements the owner cannot meet.
    const gates: string[] = [];
    const stack = stackFor(tool, software);
    const unsure = software.some(s => norm(s) === 'not sure');
    if (tool.existingOnly && !stack.inStack && !unsure) gates.push(`Only available to existing ${tool.name.replace(/ CSR AI$/, '')} customers.`);
    const price = priceInfo(tool);
    const cap = BUDGET_CAP[budget];
    if (budget === 'free' && price.verified && price.freePlan === false) gates.push('No ongoing free plan in the reviewed pricing.');
    if (cap !== null && cap > 0 && price.verified && price.lowestKnownMonthly !== null && price.lowestKnownMonthly > cap)
      gates.push(`Lowest reviewed plan (${money(price.lowestKnownMonthly)}/mo) is above your ${BUDGET_LABELS[budget]} budget.`);
    if (gates.length) { excluded.push({ toolId: tool.id, name: tool.name, reasons: gates }); continue; }

    // Relevance: weighted coverage of the stated needs, then small, explained adjustments.
    const coverage = covered.reduce((n, c) => n + c.confidence * STRENGTH[tag.caps[c.id]], 0) / (totalWeight || 1);
    const optCovered = required.length ? optional.filter(c => tag.caps[c.id]) : [];
    let relevance = coverage * 0.85 + (optional.length && required.length ? 0.1 * optCovered.length / optional.length : 0);
    const reasons: string[] = [];
    const warnings: string[] = [];
    for (const c of covered) reasons.push(`${tag.caps[c.id] === 'p' ? 'Main purpose' : 'Also offers'}: ${c.label.toLowerCase()}`);
    for (const c of optCovered) reasons.push(`Also relevant: ${c.label.toLowerCase()}`);
    if (stack.inStack) { relevance += 0.1; reasons.push('Part of software you already use'); }
    if (stack.signals.some(s => s.status === 'documented')) relevance += 0.04;
    if (industry && tag.industries) {
      if (tag.industries.includes(industry)) { relevance += 0.06; reasons.push(`Described for ${INDUSTRY_LABELS[industry].toLowerCase()} businesses`); }
      else { relevance -= 0.05; warnings.push(`Its description targets ${tag.industries.map(i => INDUSTRY_LABELS[i].toLowerCase()).join(', ')} businesses.`); }
    }
    if (tool.reviewLevel !== 'product') relevance += 0.03;
    const audience = tag.audience ?? 'owner';
    if (audience !== 'owner') {
      relevance -= ({ builder: 0.05, developer: 0.15, enterprise: 0.08 } as const)[audience] * (small ? 1 : 0.5);
      warnings.push(audience === 'developer' ? 'Aimed at developers; expect technical setup.' : audience === 'builder' ? 'You build and configure the assistant yourself; allow setup time.' : 'Positioned for larger teams; check small-business plans.');
    }
    if (tool.reviewLevel === 'product') warnings.push('Product page reviewed only; plan, price and limits are not yet verified.');
    if (!price.verified && budget !== 'unknown') warnings.push('Price not verified, so budget fit is unknown.');
    if (tool.existingOnly && !stack.inStack) warnings.push(`Requires an existing ${tool.name.replace(/ CSR AI$/, '')} subscription.`);

    const matched = covered.map(c => ({ capabilityId: c.id, label: c.label, strength: tag.caps[c.id] === 'p' ? 'primary' as const : 'secondary' as const }));
    const missing = scoring.filter(c => !tag.caps[c.id]).map(c => ({ capabilityId: c.id, label: c.label }));
    const relevanceLabel = !missing.length ? (scoring.length > 1 ? `Covers all ${scoring.length} needs` : 'Covers your need') : `Covers ${covered.length} of ${scoring.length} needs`;
    candidates.push({
      toolId: tool.id, name: tool.name, category: CATEGORIES[tool.task], description: tool.description,
      relevance: Math.max(1, Math.min(100, Math.round(relevance * 100))), relevanceLabel, matched, missing, reasons,
      evidenceLevel: tool.reviewLevel === 'product' ? 'product' : 'plan', price, stack, audience, warnings,
      sources: tool.sources, checkedAt: tool.research?.checkedAt ?? CHECKED, channel: 'catalog',
    });
  }
  candidates.sort((a, b) => b.relevance - a.relevance || (a.evidenceLevel === b.evidenceLevel ? 0 : a.evidenceLevel === 'plan' ? -1 : 1) || a.name.localeCompare(b.name));

  // Coverage map and honest gaps (the hand-off for bundle building in the Integration module).
  const coverage: Coverage[] = intent.capabilities.map(c => ({ capabilityId: c.id, label: c.label, role: c.role, toolIds: candidates.filter(t => t.matched.some(m => m.capabilityId === c.id)).map(t => t.toolId) }));
  const gaps: Gap[] = coverage.filter(c => c.role === 'required' && !c.toolIds.length).map(c => {
    const def = capabilityById.get(c.capabilityId)!;
    const anyInCatalog = tools.some(t => TOOL_TAGS[t.id]?.caps[c.capabilityId]);
    return { capabilityId: c.capabilityId, label: c.label, plain: def.plain,
      message: anyInCatalog ? `Catalogue tools for ${c.label.toLowerCase()} exist but none passed your budget or software requirements.` : `Our reviewed catalogue has no ${c.label.toLowerCase()} tool yet. We will not invent one; this need is logged for live discovery.` };
  });
  const req2 = required.map(c => c.id);
  const singleToolCovers = req2.length > 0 && candidates.some(t => req2.every(id => t.matched.some(m => m.capabilityId === id)));
  const multiToolNeeded = req2.length > 1 && !singleToolCovers && req2.every(id => coverage.find(c => c.capabilityId === id)!.toolIds.length > 0);
  if (multiToolNeeded) notices.push('No single catalogue tool covers every need, so a combination of tools may be required.');

  const status: DiscoveryResult['status'] = intent.clarification ? 'needs_clarification' : intent.capabilities.length ? 'completed' : 'no_match';
  if (status === 'no_match') notices.push('We could not match this description to a task we know yet. Try naming what should happen, for example “answer missed calls” or “write Instagram posts”.');

  return {
    engineVersion: ENGINE_VERSION, taxonomyVersion: TAXONOMY_VERSION, catalogVersion: CATALOG_VERSION, checkedAt: CHECKED, interpreter: meta.interpreter,
    mode: 'catalog', modeNote: `Results come from our reviewed catalogue of ${tools.length} tools (sources checked ${CHECKED}). Live web discovery is not enabled in this version.`,
    status, intent, profileSnapshot: meta.profileSnapshot,
    candidates: candidates.slice(0, limit), totalCandidates: candidates.length, excluded,
    coverage, gaps, singleToolCovers, multiToolNeeded, notices,
    stats: { catalogSize: tools.length, considered: tools.filter(t => TOOL_TAGS[t.id]).length, eligible: candidates.length },
  };
}

export const ALL_CAPABILITIES = CAPABILITIES;
