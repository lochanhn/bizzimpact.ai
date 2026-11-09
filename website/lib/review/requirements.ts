// Requirement coverage inside a capability ("meets 4 of 5 of your requirements").
// Requirements are activated by the owner's answers and checked against the plan-level
// feature flags recorded in the reviewed catalogue. Product-level records stay "unknown".
import type { Capability, Plan, Tool } from '../catalog';
import type { BusinessBrief } from '../intake/brief';

export type Requirement = { id: string; label: string; flag: Capability; caps: string[] };
export type RequirementResult = { id: string; label: string; status: 'yes' | 'no' | 'unknown' };
export type Coverage = { plan: Plan | null; results: RequirementResult[]; met: number; total: number; unknown: number };

const has = (b: BusinessBrief, ...ids: string[]) => ids.some(id => b.answersRaw.struggles.includes(id));
const ans = (b: BusinessBrief, id: string) => b.followups[id];
const includes = (v: string | string[] | undefined, x: string) => (Array.isArray(v) ? v.includes(x) : v === x);

/** The requirements this owner's answers activate. */
export function activeRequirements(brief: BusinessBrief): Requirement[] {
  const reqs: Requirement[] = [];
  const add = (id: string, label: string, flag: Capability, caps: string[]) => {
    const existing = reqs.find(r => r.id === id);
    if (existing) { for (const c of caps) if (!existing.caps.includes(c)) existing.caps.push(c); return; }
    reqs.push({ id, label, flag, caps: [...caps] });
  };
  const CALLS = ['phone-answering', 'appointment-booking', 'lead-capture'];
  const CHAT = ['website-chat', 'customer-support', 'social-messaging'];
  const SOCIAL = ['social-content', 'social-scheduling', 'copywriting'];
  // Calls, enquiries and bookings
  if (has(brief, 'C1', 'C2')) {
    const x2 = ans(brief, 'X2');
    if (x2 === 'faq') add('faq', 'Answers common questions', 'faq', CALLS);
    if (x2 === 'capture' || has(brief, 'C1')) add('capture', 'Takes messages and caller details', 'capture', CALLS);
    if (x2 === 'request') add('request', 'Takes booking requests for you to confirm', 'request', CALLS);
    if (x2 === 'book' || (has(brief, 'C2') && x2 !== 'request' && x2 !== 'capture')) add('booking', 'Books appointments directly', 'booking', CALLS);
    const x4 = ans(brief, 'X4');
    if (x4 === 'google') add('google', 'Works with Google Calendar', 'google', CALLS);
    if (x4 === 'outlook') add('outlook', 'Works with Outlook calendar', 'outlook', CALLS);
    if (x4 === 'calendly') add('calendly', 'Works with Calendly', 'calendly', CALLS);
  }
  if (has(brief, 'C3', 'C4', 'C5', 'C7')) { add('faq', 'Answers common questions', 'faq', CHAT); add('capture', 'Collects customer details', 'capture', CHAT); }
  // Marketing content
  if (has(brief, 'M1', 'M2')) add('text', 'Writes posts and text', 'text', SOCIAL);
  if (has(brief, 'M3')) add('image', 'Creates images and graphics', 'image', [...SOCIAL, 'image-creation']);
  if (has(brief, 'M4')) add('video', 'Creates video', 'video', [...SOCIAL, 'video-creation']);
  if (has(brief, 'M1')) {
    const x9 = ans(brief, 'X9');
    if (x9 === 'schedule' || x9 === 'auto') add('schedule', 'Schedules posts', 'schedule', SOCIAL);
    if (x9 === 'schedule' || x9 === 'auto') {
      if (includes(ans(brief, 'X8'), 'facebook')) add('facebook', 'Publishes to Facebook', 'facebook', SOCIAL);
      if (includes(ans(brief, 'X8'), 'instagram')) add('instagram', 'Publishes to Instagram', 'instagram', SOCIAL);
    }
  }
  return reqs;
}

/** Requirements relevant to a tool, given the capabilities it matched. */
export function requirementsFor(reqs: Requirement[], matchedCaps: string[]): Requirement[] {
  return reqs.filter(r => r.caps.some(c => matchedCaps.includes(c)));
}

/** Best plan for these requirements: most "yes", then fewest "no", then cheapest known price. */
export function coverageFor(tool: Tool, reqs: Requirement[]): Coverage {
  if (!reqs.length) return { plan: tool.plans[0] ?? null, results: [], met: 0, total: 0, unknown: 0 };
  const relevant = reqs.filter(r => tool.reviewLevel === 'product' || tool.plans.some(p => p.capabilities[r.flag] !== undefined));
  if (tool.reviewLevel === 'product' || !relevant.length)
    return { plan: tool.plans[0] ?? null, results: reqs.map(r => ({ id: r.id, label: r.label, status: 'unknown' })), met: 0, total: reqs.length, unknown: reqs.length };
  const scored = tool.plans.map(plan => {
    const results = reqs.map(r => ({ id: r.id, label: r.label, status: (plan.capabilities[r.flag] ?? 'unknown') as RequirementResult['status'] }));
    return { plan, results, met: results.filter(r => r.status === 'yes').length, no: results.filter(r => r.status === 'no').length };
  }).sort((a, b) => b.met - a.met || a.no - b.no || (a.plan.price.monthly ?? 1e9) - (b.plan.price.monthly ?? 1e9));
  const best = scored[0];
  return { plan: best.plan, results: best.results, met: best.met, total: reqs.length, unknown: best.results.filter(r => r.status === 'unknown').length };
}
