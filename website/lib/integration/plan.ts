// Integration Engine: multi-tool bundle + adoption plan.
// Bundle = smallest set of reviewed (non-gated) tools that covers the owner's needs, within the
// total monthly budget, preferring tools that work with their software and with each other.
import { tools } from '../catalog';
import { BUDGET_CAP, type BUDGETS } from '../intake/bank';
import type { BusinessBrief } from '../intake/brief';
import type { ReviewResult, ToolReview } from '../review/review';
import { appById, GRADE_LABEL, linkBetweenTools } from './graph';
import { compileRecipes, type Recipe } from './recipes';

export const INTEGRATION_VERSION = '2.0.0';
export type BundleTool = { toolId: string; name: string; covers: string[]; cost: string; monthly: number | null; fit: number | null };
export type Bundle = {
  label: string; tools: BundleTool[]; covers: string[]; missing: string[];
  totalMonthly: number; unknownCosts: number; costLabel: string; withinBudget: boolean | null;
  avgFit: number | null; dataFlow: string[]; viaZapier: string[]; why: string[];
};
export type AdoptionStep = { title: string; detail: string };
export type AdoptionTool = { toolId: string; name: string; order: number; effort: string; steps: AdoptionStep[] };
export type Advisor = { reason: string; links: { label: string; url: string }[] };
export type IntegrationResult = {
  integrationVersion: string; recommended: Bundle | null; alternative: Bundle | null;
  needs: { capabilityId: string; label: string; priority: string; coverable: boolean }[];
  adoption: AdoptionTool[]; timeline: string[]; successMeasure: string; checkIn: string; advisor: Advisor | null; notes: string[];
  recipes: Recipe[];
};

const toolById = new Map(tools.map(t => [t.id, t]));
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const SUCCESS_DEFAULT: Record<string, string> = {
  'phone-answering': 'Every call is answered or captured', 'appointment-booking': 'Customers can book without calling you',
  'customer-support': 'Common questions answered without you', 'website-chat': 'Website visitors get answers day and night',
  'social-content': 'Posting regularly without it eating your evenings', 'bookkeeping': 'Books up to date every week',
  'email-marketing': 'Past customers hear from you every month', 'meeting-notes': 'Every meeting ends with written action items',
};
// Official locators; we never invent a specific local office.
const ADVISOR_LINKS = [
  { label: 'Find your local Small Business Development Center (SBDC)', url: 'https://americassbdc.org/find-your-sbdc/' },
  { label: 'Get a free SCORE mentor (score.org)', url: 'https://www.score.org/' },
  { label: 'SBA local assistance finder', url: 'https://www.sba.gov/local-assistance/find' },
];

function combos<T>(items: T[], max: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length) out.push([...acc]);
    if (acc.length === max) return;
    for (let i = start; i < items.length; i++) { acc.push(items[i]); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return out;
}

function capsOf(r: ToolReview) { return r.discovery.matched.map(m => m.capabilityId); }

function makeBundle(set: ToolReview[], brief: BusinessBrief, needIds: string[], label: string): Bundle {
  const covered = new Set(set.flatMap(capsOf));
  const labelOf = (id: string) => brief.needs.find(n => n.capabilityId === id)?.label ?? id;
  const known = set.filter(r => r.cost.monthly !== null);
  const totalMonthly = Math.round(known.reduce((n, r) => n + r.cost.monthly!, 0) * 100) / 100;
  const unknownCosts = set.length - known.length;
  const lowerBound = set.some(r => r.cost.lowerBound);
  const cap = BUDGET_CAP[brief.constraints.budget as keyof typeof BUDGETS];
  const withinBudget = cap === null ? null : totalMonthly <= cap ? (unknownCosts ? null : true) : false;
  const dataFlow: string[] = [];
  const viaZapier: string[] = [];
  for (const r of set) {
    for (const i of r.compatibility.items.filter(i => i.grade === 'native' || i.grade === 'built-in')) dataFlow.push(`${r.name} → ${i.app}: ${i.action ?? GRADE_LABEL[i.grade]}`);
    const z = r.compatibility.items.filter(i => i.grade === 'via-zapier').map(i => i.app);
    if (z.length) viaZapier.push(`${r.name} can reach ${z.join(', ')} through Zapier`);
  }
  for (let a = 0; a < set.length; a++) for (let b = a + 1; b < set.length; b++) {
    const link = linkBetweenTools(set[a].toolId, set[b].toolId);
    if (link) dataFlow.push(`${set[a].name} ↔ ${set[b].name}: both connect to ${appById.get(link.appId)?.name}`);
  }
  if (!dataFlow.length && !viaZapier.length) dataFlow.push('No documented connection to your apps yet; move information by export or copy until a connection is verified.');
  const coveredIds = needIds.filter(id => covered.has(id));
  const why: string[] = [`Covers ${coveredIds.length} of your ${needIds.length} need${needIds.length > 1 ? 's' : ''} with ${set.length} tool${set.length > 1 ? 's' : ''}`];
  for (const r of set) { const main = r.discovery.matched.filter(m => m.strength === 'primary' && needIds.includes(m.capabilityId)).map(m => (/^AI\b/.test(m.label) ? m.label : m.label.charAt(0).toLowerCase() + m.label.slice(1))); if (main.length > 1) why.push(`${r.name} handles ${main.join(' and ')} in one tool`); }
  const knownTotal = Math.round(set.filter(r => r.cost.monthly !== null).reduce((n, r) => n + r.cost.monthly!, 0) * 100) / 100;
  const unknownN = set.filter(r => r.cost.monthly === null).length;
  if (cap !== null) why.push(knownTotal > cap ? `Over your budget at ${money(knownTotal)}/mo` : unknownN ? `Known prices (${money(knownTotal)}/mo) fit your ${cap === 0 ? 'free-only' : money(Math.round(cap))} budget; ${unknownN} price${unknownN > 1 ? 's' : ''} to confirm` : `${set.some(r => r.cost.lowerBound) ? 'From ' : ''}${money(knownTotal)}/mo, within your ${cap === 0 ? 'free-only' : money(Math.round(cap))} budget`);
  const linked = set.reduce((n, r) => n + r.compatibility.items.filter(i => i.grade !== 'unknown' && i.grade !== 'not-supported').length, 0);
  if (linked) why.push(`${linked} connection${linked > 1 ? 's' : ''} to software you already use`);
  const fits = set.map(r => r.fit).filter((f): f is number => f !== null);
  return {
    label,
    tools: set.map(r => ({ toolId: r.toolId, name: r.name, covers: capsOf(r).filter(c => needIds.includes(c)).map(labelOf), cost: r.cost.label, monthly: r.cost.monthly, fit: r.fit })),
    covers: needIds.filter(id => covered.has(id)).map(labelOf), missing: needIds.filter(id => !covered.has(id)).map(labelOf),
    totalMonthly, unknownCosts,
    costLabel: `${lowerBound || unknownCosts ? 'From ' : ''}${money(totalMonthly)}/mo${unknownCosts ? ` + ${unknownCosts} price${unknownCosts > 1 ? 's' : ''} to confirm` : ''}`,
    withinBudget, avgFit: fits.length ? Math.round(fits.reduce((a, b) => a + b, 0) / fits.length) : null, dataFlow, viaZapier, why,
  };
}

export function buildBundles(brief: BusinessBrief, rev: ReviewResult): { recommended: Bundle | null; alternative: Bundle | null; needs: IntegrationResult['needs'] } {
  const eligible = rev.reviews.filter(r => r.status !== 'not-suitable');
  const required = brief.needs.filter(n => n.priority !== 'inferred');
  const needs = required.map(n => ({ capabilityId: n.capabilityId, label: n.label, priority: n.priority, coverable: eligible.some(r => capsOf(r).includes(n.capabilityId)) }));
  const needIds = needs.filter(n => n.coverable).map(n => n.capabilityId);
  const focusIds = brief.focus.capabilities.filter(id => needIds.includes(id));
  if (!needIds.length) return { recommended: null, alternative: null, needs };

  // Candidate pool: best 8 overall + best 2 per need, so secondary needs are reachable.
  const pool = new Map<string, ToolReview>();
  for (const r of eligible.slice(0, 8)) pool.set(r.toolId, r);
  for (const id of needIds) for (const r of eligible.filter(r => capsOf(r).includes(id)).slice(0, 2)) pool.set(r.toolId, r);
  const cap = BUDGET_CAP[brief.constraints.budget as keyof typeof BUDGETS];
  const weightOf = (id: string) => (focusIds.includes(id) ? 3 : 1);

  const scored = combos([...pool.values()], 3).map(set => {
    const covered = new Set(set.flatMap(capsOf));
    const coverage = needIds.reduce((n, id) => n + (covered.has(id) ? weightOf(id) : 0), 0);
    const focusOk = focusIds.every(id => covered.has(id));
    const known = set.filter(r => r.cost.monthly !== null).reduce((n, r) => n + r.cost.monthly!, 0);
    const overBudget = cap !== null && known > cap;
    const overlap = needIds.reduce((n, id) => n + Math.max(0, set.filter(r => capsOf(r).includes(id)).length - 1), 0);
    const links = set.reduce((n, r, i) => n + set.slice(i + 1).filter(o => linkBetweenTools(r.toolId, o.toolId)).length, 0);
    const avgFit = set.reduce((n, r) => n + (r.fit ?? 0), 0) / set.length;
    const avgProof = set.reduce((n, r) => n + r.proof, 0) / set.length;
    const unknownCosts = set.filter(r => r.cost.monthly === null).length;
    const value = coverage * 100 - set.length * 30 - overlap * 20 + links * 10 + avgFit * 0.5 + avgProof * 0.3 - unknownCosts * 15;
    return { set, focusOk, overBudget, value, known, coverage, unknownCosts };
  }).filter(s => s.focusOk && !s.overBudget).sort((a, b) => b.value - a.value || a.known - b.known);

  if (!scored.length) return { recommended: null, alternative: null, needs };
  const best = scored[0];
  const recommended = makeBundle(best.set, brief, needIds, best.set.length === 1 ? 'One tool covers it' : `${best.set.length}-tool plan`);
  // Alternative: the cheapest other set with the same coverage, else the next best.
  const ids = (s: ToolReview[]) => s.map(r => r.toolId).sort().join(',');
  const others = scored.filter(s => ids(s.set) !== ids(best.set));
  // A "lower-cost" claim needs every price known; unknown prices are never treated as $0.
  const cheaper = others.filter(s => s.coverage === best.coverage && s.unknownCosts === 0 && s.known < best.known).sort((a, b) => a.known - b.known)[0];
  const alt = cheaper ?? others[0];
  const alternative = alt ? makeBundle(alt.set, brief, needIds, cheaper ? 'Lower-cost option' : 'Alternative') : null;
  return { recommended, alternative, needs };
}

function effortFor(r: ToolReview): string {
  const ease = r.pillars.find(p => p.id === 'ease')?.score ?? 50;
  return ease >= 70 ? 'About an hour to set up' : ease >= 50 ? 'Half a day to set up' : 'A day or more; consider getting help';
}

export function integrate(brief: BusinessBrief, rev: ReviewResult): IntegrationResult {
  const { recommended, alternative, needs } = buildBundles(brief, rev);
  const notes: string[] = [];
  const reviewsById = new Map(rev.reviews.map(r => [r.toolId, r]));
  const focusIds = brief.focus.capabilities;
  const bundleTools = (recommended?.tools ?? []).map(t => reviewsById.get(t.toolId)!)
    .sort((a, b) => Number(focusIds.some(f => capsOf(b).includes(f))) - Number(focusIds.some(f => capsOf(a).includes(f))));

  const adoption: AdoptionTool[] = bundleTools.map((r, i) => {
    const tool = toolById.get(r.toolId)!;
    const connect = r.compatibility.items.map(it => it.grade === 'built-in' ? `Already inside ${it.app}: switch the AI feature on in your current account.`
      : it.grade === 'native' ? `Connect to ${it.app} from ${r.name}'s settings (${it.action}).`
      : it.grade === 'via-zapier' ? `Link to ${it.app} through Zapier; test one example first.`
      : it.grade === 'not-supported' ? `No ${it.app} connection on reviewed plans; keep your current process for that part.`
      : `Ask ${r.name} whether it connects to ${it.app}; until confirmed, export or copy information manually.`);
    return {
      toolId: r.toolId, name: r.name, order: i + 1, effort: effortFor(r),
      steps: [
        { title: 'Choose the plan', detail: `${r.cost.label}. ${r.cost.assumptions[0] ?? ''}`.trim() },
        ...(r.checkBeforeBuying.length ? [{ title: 'Check before you pay', detail: r.checkBeforeBuying.slice(0, 3).join(' ') }] : []),
        ...(connect.length ? [{ title: 'Connect your software', detail: connect.join(' ') }] : []),
        ...tool.steps.slice(0, 3).map((s, k) => ({ title: `Set up (${k + 1})`, detail: s })),
        { title: 'Test safely', detail: tool.test },
        { title: 'If it does not work out', detail: tool.rollback },
      ],
    };
  });

  const timeline = brief.constraints.timeline === 'week'
    ? adoption.map((a, i) => `${i === 0 ? 'Days 1–3' : 'Days 4–7'}: set up and test ${a.name}`)
    : adoption.map((a, i) => `Week ${i + 1}: set up and test ${a.name}`);
  if (adoption.length) timeline.push(`Week ${adoption.length + 1}: go live, then check in after 30 days`);
  const successMeasure = brief.deepDive.W5 || SUCCESS_DEFAULT[focusIds[0]] || `Clear progress on your #1 problem: “${brief.focus.label}”`;
  const checkIn = `After 30 days, ask: “${successMeasure}”. Is it better than before? If not, use the undo steps and try the alternative.`;

  const wantsHelp = brief.constraints.advisor === 'yes' || brief.constraints.advisor === 'later' || brief.readiness.setupBy === 'nobody' || brief.readiness.techComfort === 'avoid';
  const advisor = wantsHelp && brief.business.country==='US' ? {
    reason: brief.constraints.advisor === 'yes' ? 'You asked for free local help.' : 'Free, neutral local advisors can help you set this up.',
    links: ADVISOR_LINKS,
  } : null;
  if (!recommended) notes.push(needs.some(n => n.coverable) ? 'No combination fits your budget and covers your #1 problem. Try a higher budget, or see the individual reviews.' : 'Your needs are not covered by reviewed tools yet; see the gaps.');
  if (recommended?.missing.length) notes.push(`Not covered by any reviewed tool yet: ${recommended.missing.join(', ')}.`);
  if (brief.stack.status === 'not-sure') notes.push('You were not sure which software you use, so connections could not be checked.');
  const recipes = compileRecipes(brief, rev, recommended);
  return { integrationVersion: INTEGRATION_VERSION, recommended, alternative, needs, adoption, timeline, successMeasure, checkIn, advisor, notes, recipes };
}
