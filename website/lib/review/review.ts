// Review Engine: "which of the discovered tools is right for THIS business, and why?"
// 1. Gates (must-haves: cost at the owner's volume, yearly billing, must-keep software, focus requirements)
// 2. Five fit pillars, each 0–100 with a reason, or null when unknown (never guessed)
// 3. Personalised weights derived from the Business Brief (shown to the owner)
// 4. Proof scored on a separate axis (evidence level, age, completeness) → fit-vs-proof quadrant
// Methodology is published at /methodology. No vendor can pay to change any of this.
import { tools, CHECKED, type Tool } from '../catalog';
import { TOOL_TAGS } from '../discovery/tool-tags';
import { capabilityById } from '../discovery/taxonomy';
import type { Candidate, DiscoveryResult } from '../discovery/discover';
import { BUDGET_CAP, BUDGETS, DATA_HANDLED, AUTONOMY } from '../intake/bank';
import { monthlyVolume, type BusinessBrief } from '../intake/brief';
import { compatibility, type Compatibility } from '../integration/graph';
import { activeRequirements, coverageFor, requirementsFor, type Coverage } from './requirements';
import { factsFor, securityBadge, iciTier, ICI_LABEL, type Badge, type IciTier } from './facts';
import { aggregate, type OwnerEvidence, type Report } from './outcomes';

/** Apps to check compatibility against: listed software + apps named in follow-ups. */
export function appsForBrief(brief: BusinessBrief): string[] {
  const f = brief.followups;
  const extra: string[] = [];
  const pick = (v: string | string[] | undefined) => ([] as string[]).concat(v ?? []);
  const X4: Record<string, string> = { google: 'Google Calendar', outlook: 'Outlook', calendly: 'Calendly', jobber: 'Jobber', housecall: 'Housecall Pro', square: 'Square' };
  const X8: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram' };
  const X10: Record<string, string> = { quickbooks: 'QuickBooks', xero: 'Xero', freshbooks: 'FreshBooks', wave: 'Wave' };
  const X14: Record<string, string> = { zoom: 'Zoom', meet: 'Google Meet', teams: 'Microsoft Teams' };
  for (const v of pick(f.X4)) if (X4[v]) extra.push(X4[v]);
  for (const v of pick(f.X8)) if (X8[v]) extra.push(X8[v]);
  for (const v of pick(f.X10)) if (X10[v]) extra.push(X10[v]);
  for (const v of pick(f.X14)) if (X14[v]) extra.push(X14[v]);
  const seen = new Set<string>();
  return [...brief.stack.tools, ...extra].filter(n => { const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

export const REVIEW_VERSION = '2.0.0';
export type PillarId = 'need' | 'cost' | 'stack' | 'security' | 'ease' | 'owners';
export const PILLARS: Record<PillarId, { label: string; question: string }> = {
  need: { label: 'Need fit', question: 'Does it solve your problem, especially your #1 problem?' },
  cost: { label: 'True cost', question: 'What will it really cost you each month?' },
  ease: { label: 'Ease of setup', question: 'Can you get it running with the help you have?' },
  stack: { label: 'Works with your tools', question: 'Does it connect to the software you already use?' },
  security: { label: 'Security & control', question: 'Is your data safe, and does it stay under your control?' },
  owners: { label: 'Proven by owners like you', question: 'Did it fix the problem for similar businesses that adopted it through us?' },
};
export const DEFAULT_WEIGHTS: Record<PillarId, number> = { need: 25, cost: 20, stack: 20, security: 20, ease: 15, owners: 0 };
/** Owner results earn weight only as evidence accumulates: up to this much at OWNER_FULL_AT effective reports. */
export const OWNER_MAX_WEIGHT = 15, OWNER_FULL_AT = 10;
export const EVIDENCE_DECAY_PER_MONTH = 0.03; // older evidence counts less (pattern borrowed from G2's review decay)

export type PillarScore = { id: PillarId; label: string; score: number | null; reason: string };
export type CostEstimate = { plan: string | null; monthly: number | null; lowerBound: boolean; label: string; assumptions: string[]; annualRequired: boolean };
export type ToolReview = {
  toolId: string; name: string; category: string;
  status: 'top-pick' | 'worth-a-look' | 'not-suitable';
  gates: string[];
  fit: number | null; proof: number; confidence: 'High' | 'Medium' | 'Low';
  quadrant: 'Strong fit, well proven' | 'Strong fit, needs checking' | 'Partial fit, well proven' | 'Partial fit, needs checking';
  pillars: PillarScore[];
  requirements: Coverage['results']; requirementsMet: string | null;
  security: Badge; ici: { tier: IciTier; label: string; reasons: string[]; cited: boolean };
  owners: OwnerEvidence; missingLinks: string[];
  cost: CostEstimate; compatibility: Compatibility;
  coversFocus: boolean; checkBeforeBuying: string[]; discovery: Candidate;
};
export type ReviewResult = {
  reviewVersion: string; weights: { id: PillarId; label: string; weight: number }[]; weightReasons: string[];
  reviews: ToolReview[]; topPicks: string[]; focusCovered: boolean; notes: string[];
};

const toolById = new Map(tools.map(t => [t.id, t]));
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const SENSITIVE = ['payments', 'health', 'employees', 'financial'] as const;
const COMPLIANCE: Record<string, string> = { payments: 'PCI DSS (card data)', health: 'HIPAA (health information)', employees: 'employee-data privacy', financial: 'financial-data security (e.g. SOC 2)' };
// How much a tool does on its own, by area (0 = drafts for you … 3 = acts/talks to customers).
const AREA_AUTONOMY: Record<string, number> = { calls: 3, chat: 3, operations: 2, sales: 1, finance: 1, marketing: 0, productivity: 0, gap: 0 };
const OWNER_AUTONOMY: Record<keyof typeof AUTONOMY, number> = { draft: 0, organise: 1, send: 2, act: 3 };
const UNIT_FOR_FOCUS: Record<string, Partial<Record<string, { factor: number; note?: string }>>> = {
  calls: { calls: { factor: 1 }, customers: { factor: 1, note: 'Assumes each call is a different customer (upper bound).' }, minutes: { factor: 3, note: 'Assumes about 3 minutes per call.' } },
  chat: { conversations: { factor: 1 } },
  marketing: { pieces: { factor: 1 } },
};

export function personalWeights(brief: BusinessBrief): { weights: Record<PillarId, number>; reasons: string[] } {
  const w = { ...DEFAULT_WEIGHTS };
  const reasons: string[] = [];
  const c = brief.constraints;
  if (c.budget === 'free' || c.budget === 'under-50') { w.cost += 10; reasons.push('True cost counts more because your budget is tight.'); }
  if (brief.readiness.techComfort === 'avoid') { w.ease += 10; reasons.push('Ease of setup counts more because you prefer help with setup.'); }
  else if (brief.readiness.techComfort === 'steps') { w.ease += 5; reasons.push('Ease of setup counts a little more because you prefer clear steps.'); }
  if (brief.readiness.setupBy === 'nobody') { w.ease += 5; reasons.push('Nobody is lined up to set it up yet, so simple setup matters.'); }
  if (brief.stack.mustKeep.length) { w.stack += 10; reasons.push(`Working with ${brief.stack.mustKeep.join(', ')} counts more because you must keep ${brief.stack.mustKeep.length > 1 ? 'them' : 'it'}.`); }
  if (brief.stack.status !== 'listed' || !brief.stack.tools.length) { w.stack = 0; reasons.push('Compatibility is not scored because you did not list existing software.'); }
  if (c.dataHandled.some(d => (SENSITIVE as readonly string[]).includes(d))) { w.security += 10; reasons.push('Security & control counts more because the tool would handle sensitive information.'); }
  if (c.autonomy === 'draft') { w.security += 5; reasons.push('You want to approve everything, so control matters more.'); }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(w) as PillarId[]) w[k] = Math.round((w[k] / total) * 100);
  if (!reasons.length) reasons.push('Standard weights: need fit matters most, then cost, setup, compatibility and control.');
  return { weights: w, reasons };
}

function estimateCost(tool: Tool, cov: Coverage, brief: BusinessBrief): CostEstimate {
  const plan = cov.plan ?? tool.plans[0];
  const assumptions: string[] = [];
  if (!plan || tool.reviewLevel === 'product' || plan.price.monthly === null)
    return { plan: plan?.name ?? null, monthly: null, lowerBound: false, label: 'Price not verified', assumptions: ['Check the current plan price and usage limits on the vendor site.'], annualRequired: false };
  const p = plan.price;
  let monthly = p.monthly!;
  let lowerBound = !!p.extraUnknown;
  const volume = monthlyVolume(brief);
  const focusArea = capabilityById.get(brief.focus.capabilities[0])?.area ?? '';
  const unitRule = p.unit ? UNIT_FOR_FOCUS[focusArea]?.[p.unit] : undefined;
  if (p.unit) {
    if (volume === null || !unitRule) { lowerBound = true; assumptions.push(`Billed per ${p.unit.replace(/s$/, '')}; starting price shown because your monthly volume is not known.`); }
    else {
      const used = volume * unitRule.factor;
      if (unitRule.note) assumptions.push(unitRule.note);
      if (p.included !== undefined && used > p.included) {
        if (p.overage !== undefined) { monthly += (used - p.included) * p.overage; assumptions.push(`${Math.round(used)} ${p.unit}/month: ${p.included} included, ${Math.round(used - p.included)} extra at ${money(p.overage)} each.`); }
        else { lowerBound = true; assumptions.push(`Your ~${Math.round(used)} ${p.unit}/month exceeds the ${p.included} included; the extra-usage price is not established.`); }
      } else if (p.included !== undefined) assumptions.push(`Your ~${Math.round(used)} ${p.unit}/month fits within the ${p.included} included.`);
    }
  }
  if (p.extraUnknown) assumptions.push('Some fees (usage, phone numbers, add-ons) are not established, so this is a minimum.');
  const annualRequired = !!(p.requiresAnnual || p.annual);
  if (annualRequired) assumptions.push(`Shown as a monthly equivalent; billed ${p.annual ? `${money(p.annual)} per year` : 'yearly'}.`);
  monthly = Math.round(monthly * 100) / 100;
  const label = monthly === 0 && !lowerBound ? `Free (${plan.name})` : `${lowerBound ? 'From ' : ''}${money(monthly)}/mo · ${plan.name}`;
  return { plan: plan.name, monthly, lowerBound, label, assumptions, annualRequired };
}

function ageMonths(date: string) { return Math.max(0, (Date.parse(`${CHECKED}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / (30.44 * 864e5)); }

export function review(brief: BusinessBrief, discovery: DiscoveryResult, reports: Report[] = []): ReviewResult {
  const { weights, reasons: weightReasons } = personalWeights(brief);
  const reqs = activeRequirements(brief);
  const cap = BUDGET_CAP[brief.constraints.budget as keyof typeof BUDGETS];
  const focusCaps = brief.focus.capabilities;
  const sensitive = brief.constraints.dataHandled.filter(d => (SENSITIVE as readonly string[]).includes(d));
  const handoff = ([] as string[]).concat(brief.followups.X5 ?? []).filter(x => x !== 'nothing');
  const reviews: ToolReview[] = [];

  const apps = appsForBrief(brief);
  for (const cand of discovery.candidates) {
    const tool = toolById.get(cand.toolId)!;
    const tag = TOOL_TAGS[tool.id];
    const toolReqs = requirementsFor(reqs, cand.matched.map(m => m.capabilityId));
    // Plan choice: respect "no yearly billing", then most requirements met, fewest "no", lowest cost at volume.
    const noAnnual = brief.constraints.annual === 'no';
    const allowed = tool.plans.filter(p => !noAnnual || !(p.price.requiresAnnual || p.price.annual));
    const options = (allowed.length ? allowed : tool.plans).map(plan => {
      const cov = coverageFor({ ...tool, plans: [plan] }, toolReqs);
      return { cov, cost: estimateCost(tool, cov, brief), no: cov.results.filter(r => r.status === 'no').length };
    }).sort((a, b) => b.cov.met - a.cov.met || a.no - b.no || (a.cost.monthly ?? 1e9) - (b.cost.monthly ?? 1e9));
    const { cov, cost } = options[0];
    const compat = compatibility(tool.id, apps, brief.stack.mustKeep);
    // Covers the #1 problem only if that is one of the tool's MAIN purposes (not a side feature).
    const coversFocus = focusCaps.some(c => cand.matched.some(m => m.capabilityId === c && m.strength === 'primary'));
    const gates: string[] = [];
    const owners = aggregate(reports, tool.id, { industry: brief.business.industry, teamSize: brief.business.teamSize, industryLabel: brief.business.industryLabel.toLowerCase() });
    const check: string[] = [];

    // ── Gates ──
    if (cost.monthly !== null && cap !== null && cost.monthly > cap) gates.push(`${cost.lowerBound ? 'At least ' : ''}${money(cost.monthly)}/mo at your usage, above your ${brief.constraints.budget === 'free' ? 'free-only' : 'monthly'} budget.`);
    if (!allowed.length && noAnnual) gates.push('Only offered with yearly billing; you said no to yearly billing.');
    if (compat.mustKeepConflict) gates.push('Does not work with software you said you must keep.');
    const focusReqNo = cov.results.filter(r => r.status === 'no');
    if (focusReqNo.length && coversFocus) gates.push(`Cannot do what you asked on any reviewed plan: ${focusReqNo.map(r => r.label.toLowerCase()).join(', ')}.`);

    // ── Pillars ──
    // Need fit judges how well the tool does the job(s) it covers; covering every need is the bundle's job.
    const strengths = cand.matched.map(m => (m.strength === 'primary' ? 1 : 0.6));
    const coveredNeeds = cand.matched.length;
    const base = Math.min(100, Math.max(...strengths) * 100 + Math.min(15, (coveredNeeds - 1) * 5));
    const reqKnown = cov.total - cov.unknown;
    const reqPct = reqKnown > 0 ? (cov.met / reqKnown) * 100 : null;
    let need = reqPct === null ? base : base * 0.6 + reqPct * 0.4;
    if (!coversFocus) need = Math.min(need, 70);
    const mainNeed = cand.matched.find(m => m.strength === 'primary') ?? cand.matched[0];
    const needReason = `${mainNeed.strength === 'primary' ? 'Main purpose' : 'Offers'}: ${mainNeed.label.toLowerCase()}${coversFocus ? ' (your #1 problem)' : ''}${coveredNeeds > 1 ? `; covers ${coveredNeeds} of your needs` : ''}${cov.total ? `; meets ${cov.met} of ${cov.total} requirements${cov.unknown ? ` (${cov.unknown} not verified)` : ''}` : ''}${coversFocus ? '' : '; does not address your #1 problem'}.`;

    let costScore: number | null = null;
    let costReason = 'Price not verified, so cost cannot be scored.';
    if (cost.monthly !== null) {
      if (cost.monthly === 0) costScore = cost.lowerBound ? 85 : 100;
      else if (cap !== null && cap > 0) costScore = clamp(100 - (cost.monthly / cap) * 60);
      else costScore = cost.monthly <= 25 ? 90 : cost.monthly <= 75 ? 75 : cost.monthly <= 150 ? 60 : cost.monthly <= 300 ? 45 : 30;
      if (cost.lowerBound) costScore = clamp(costScore - 10);
      costReason = `${cost.label}${cap !== null && cap > 0 ? ` against your ${money(cap + 0.01)} budget` : ''}${cost.lowerBound ? ' (minimum; some charges unknown)' : ''}.`;
    }

    const audience = tag?.audience ?? 'owner';
    const facts = factsFor(tool.id);
    const ici = iciTier(facts, { audience, category: tool.task, existingOnly: !!tool.existingOnly });
    const comfort = brief.readiness.techComfort;
    const ICI_SCORE: Record<IciTier, Record<string, number>> = { 1: { avoid: 95, steps: 95, comfortable: 95 }, 2: { avoid: 75, steps: 82, comfortable: 85 }, 3: { avoid: 40, steps: 55, comfortable: 70 }, 4: { avoid: 5, steps: 15, comfortable: 45 } };
    let ease = ICI_SCORE[ici.tier][comfort];
    const easeNotes = [`Tier ${ici.tier} (${ICI_LABEL[ici.tier]})`, ...ici.reasons.map(r => r.charAt(0).toLowerCase() + r.slice(1))];
    if (tool.plans.some(p => p.price.freeOngoing)) { ease += 5; easeNotes.push('free plan to try first'); }
    if (comfort === 'avoid' && ici.tier >= 3) easeNotes.push('harder than you said you are comfortable with');
    const easeScore = clamp(ease);

    const stackScore = brief.stack.status === 'listed' && brief.stack.tools.length ? compat.score : null;
    const stackReason = !brief.stack.tools.length ? 'No existing software listed.' : `${compat.summary}${compat.items.some(i => i.grade === 'unknown') ? '; others not yet verified' : ''}.`;

    const toolLevel = AREA_AUTONOMY[tag ? (capabilityById.get(Object.keys(tag.caps)[0])?.area ?? 'gap') : 'gap'] ?? 0;
    const ownerLevel = OWNER_AUTONOMY[brief.constraints.autonomy];
    const autonomyPart = toolLevel > ownerLevel ? 35 : 90;
    const badge = securityBadge(facts);
    let securityPart = { green: 90, yellow: 65, grey: 50, red: 20 }[badge.level];
    const secNotes: string[] = [badge.label.toLowerCase()];
    if (brief.constraints.dataHandled.includes('health')) {
      const h = facts?.hipaaBaa.status ?? 'not-found';
      if (h === 'not-available') gates.push('States it does not offer a HIPAA business associate agreement, but you handle health information.');
      else if (h === 'available') secNotes.push('HIPAA BAA available');
      else { securityPart = Math.min(securityPart, 45); secNotes.push('no HIPAA BAA statement found'); }
    }
    const trustScore = clamp(securityPart * 0.7 + autonomyPart * 0.3);
    const trustNotes: string[] = [...secNotes];
    if (toolLevel > ownerLevel) trustNotes.push(toolLevel === 3 ? 'it talks to customers on its own, but you want to approve everything' : 'it acts more on its own than you said you want');
    else trustNotes.push('works at the level of control you chose');

    const pillars: PillarScore[] = [
      { id: 'need', label: PILLARS.need.label, score: clamp(need), reason: needReason },
      { id: 'cost', label: PILLARS.cost.label, score: costScore, reason: costReason },
      { id: 'ease', label: PILLARS.ease.label, score: easeScore, reason: `${easeNotes.join('; ')}.${ici.cited ? ' From the vendor’s own setup pages.' : ' Estimated; not yet verified.'}` },
      { id: 'stack', label: PILLARS.stack.label, score: stackScore, reason: stackReason },
      { id: 'security', label: PILLARS.security.label, score: trustScore, reason: `${trustNotes.join('; ')}.${facts ? ` Checked ${facts.checkedAt} on ${facts.domain}.` : ''}` },
      { id: 'owners', label: PILLARS.owners.label, score: owners.score, reason: owners.score === null ? 'No results from owners like you yet; this does not count for or against the tool.' : `${owners.label}; at least ${owners.fixedAtLeast}% of adopters say it fixed the problem${owners.typicalHours ? `; typical time saved ${owners.typicalHours} h/week` : ''}.` },
    ];
    let wsum = 0, ssum = 0;
    const ownerWeight = owners.score === null ? 0 : OWNER_MAX_WEIGHT * Math.min(1, owners.effective / OWNER_FULL_AT);
    for (const p of pillars) { const wt = p.id === 'owners' ? ownerWeight : weights[p.id]; if (p.score !== null && wt > 0) { wsum += wt; ssum += wt * p.score; } }
    const fit = wsum ? Math.round(ssum / wsum) : null;

    // ── Proof axis (separate from fit) ──
    const evidence = tool.reviewLevel === 'product' ? 40 : 80;
    const decay = Math.pow(1 - EVIDENCE_DECAY_PER_MONTH, ageMonths(cand.checkedAt));
    const scoredPillars = pillars.filter(p => p.id !== 'owners' && weights[p.id] > 0);
    const knownShare = scoredPillars.filter(p => p.score !== null).length / (scoredPillars.length || 1);
    const reqShare = cov.total ? (cov.total - cov.unknown) / cov.total : 1;
    const factsShare = facts ? Math.min(1, ([facts.soc2.status !== 'not-found', facts.trainsOnData.status !== 'not-found', facts.setup.evidence.length > 0, facts.integrations.length > 0].filter(Boolean).length) / 3) : 0;
    const proof = clamp(evidence * decay * 0.5 + knownShare * 20 + reqShare * 10 + factsShare * 10 + Math.min(20, owners.effective * 4));
    const confidence = proof >= 65 ? 'High' : proof >= 45 ? 'Medium' : 'Low';
    const strongFit = (fit ?? 0) >= 65, wellProven = proof >= 60;
    const quadrant = strongFit ? (wellProven ? 'Strong fit, well proven' : 'Strong fit, needs checking') : (wellProven ? 'Partial fit, well proven' : 'Partial fit, needs checking');

    // ── Check before buying ──
    if (cost.monthly === null) check.push('Confirm the plan price, usage limits and any yearly commitment.');
    else if (cost.lowerBound) check.push('Confirm extra-usage and add-on fees; the price shown is a minimum.');
    for (const r of cov.results.filter(r => r.status === 'unknown')) check.push(`Confirm it ${r.label.toLowerCase().replace(/^works with/, 'works with')} on the plan you choose.`);
    for (const s of sensitive) check.push(`Ask the vendor about ${COMPLIANCE[s]}.`);
    if (handoff.length && toolLevel >= 2) check.push(`Confirm it hands ${handoff.join(', ')} to a real person.`);
    for (const i of compat.items.filter(i => i.grade === 'unknown')) check.push(`Ask whether it connects to ${i.app}.`);
    if (cost.annualRequired && brief.constraints.annual !== 'yes') check.push('This plan is billed yearly; check the monthly option.');
    if (badge.level === 'grey') check.push('Ask the vendor whether it uses your data to train AI and how long it keeps your data.');
    const viaZ = compat.items.filter(i => i.grade === 'via-zapier').map(i => i.app);
    const missingLinks = viaZ.length ? [`No direct connection to ${viaZ.join(', ')}; works through Zapier, which can add a subscription and setup time.`] : [];

    reviews.push({
      toolId: tool.id, name: tool.name, category: cand.category, status: gates.length ? 'not-suitable' : 'worth-a-look', gates,
      fit, proof, confidence, quadrant, pillars, requirements: cov.results,
      requirementsMet: cov.total ? `${cov.met} of ${cov.total}${cov.unknown ? ` (${cov.unknown} unverified)` : ''}` : null,
      cost, compatibility: compat, coversFocus, checkBeforeBuying: [...new Set(check)].slice(0, 7), discovery: cand,
      security: badge, ici: { ...ici, label: ICI_LABEL[ici.tier] }, owners, missingLinks,
    });
  }

  const eligible = reviews.filter(r => r.status !== 'not-suitable')
    .sort((a, b) => Number(b.coversFocus) - Number(a.coversFocus) || (b.fit ?? 0) - (a.fit ?? 0) || b.proof - a.proof || a.name.localeCompare(b.name));
  // Minimum evidence before a tool can be a top pick (Low-confidence tools stay in "Worth a look").
  const topPicks = eligible.filter(r => r.coversFocus && (r.fit ?? 0) >= 50 && r.confidence !== 'Low').slice(0, 3);
  // Within each group, verified tools first, then fit.
  eligible.sort((a, b) => Number(topPicks.includes(b)) - Number(topPicks.includes(a)) || Number(b.coversFocus) - Number(a.coversFocus) || Number(b.confidence !== 'Low') - Number(a.confidence !== 'Low') || (b.fit ?? 0) - (a.fit ?? 0) || b.proof - a.proof);
  for (const r of topPicks) r.status = 'top-pick';
  const ordered = [...eligible, ...reviews.filter(r => r.status === 'not-suitable')];
  const notes: string[] = [];
  if (!topPicks.length) notes.push(discovery.gaps.some(g => focusCaps.includes(g.capabilityId))
    ? 'No reviewed tool covers your #1 problem yet. We will not invent one; see the gaps below.'
    : 'No tool scored high enough for your #1 problem; see “Worth a look” and what to check.');
  if (sensitive.length) notes.push('Compliance claims are vendor statements we have not audited. Always confirm before sharing sensitive data.');
  return {
    reviewVersion: REVIEW_VERSION,
    weights: (Object.keys(weights) as PillarId[]).map(id => ({ id, label: PILLARS[id].label, weight: weights[id] })),
    weightReasons, reviews: ordered, topPicks: topPicks.map(r => r.toolId), focusCovered: topPicks.length > 0, notes,
  };
}

export const METHODOLOGY = {
  version: REVIEW_VERSION, pillars: PILLARS, defaultWeights: DEFAULT_WEIGHTS, evidenceDecayPerMonth: EVIDENCE_DECAY_PER_MONTH,
  dataLabels: DATA_HANDLED,
};
