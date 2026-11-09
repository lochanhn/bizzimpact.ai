// Questionnaire answers → validated Business Brief: the single contract read by the
// Discovery, Review and Integration engines.
import { z } from 'zod';
import {
  ADVISOR, ANNUAL, AREAS, AUTONOMY, BUDGETS, CUSTOMERS, DATA_HANDLED, DEEP_DIVE, FOLLOWUPS, INDUSTRIES, QUESTIONNAIRE_VERSION,
  SETUP_BY, STRUGGLES, TEAM_SIZES, TECH_COMFORT, TIMELINE, US_STATES, triggeredFollowups, visibleStruggles, type AreaId,
} from './bank';
import { CHANNEL_CAPABILITIES, capabilityById, type Channel } from '../discovery/taxonomy';
import { defaultInterpreter } from '../discovery/interpret';

const keys = <T extends Record<string, unknown>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
const struggleById = new Map(STRUGGLES.map(s => [s.id, s]));

export const answersSchema = z.object({
  industry: z.enum(keys(INDUSTRIES)),
  subtype: z.string().trim().max(60).optional(),
  description: z.string().trim().max(150).optional(),
  customers: z.enum(keys(CUSTOMERS)).optional(),
  teamSize: z.enum(keys(TEAM_SIZES)),
  country: z.enum(['US', 'other']).default('US'),
  state: z.enum(US_STATES).optional(),
  software: z.array(z.string().trim().min(1).max(60)).max(25).default([]),
  softwareStatus: z.enum(['listed', 'none', 'not-sure']).default('listed'),
  mustKeep: z.array(z.string().trim().min(1).max(60)).max(3).default([]),
  techComfort: z.enum(keys(TECH_COMFORT)),
  setupBy: z.enum(keys(SETUP_BY)),
  areas: z.array(z.enum(AREAS.map(a => a.id) as [AreaId, ...AreaId[]])).min(1, 'Choose at least one area.').max(3, 'Choose up to three areas.'),
  struggles: z.array(z.string()).min(1, 'Tick at least one struggle.').max(30),
  focus: z.string(),
  followups: z.record(z.string(), z.union([z.string(), z.array(z.string()).max(10)])).default({}),
  deepDive: z.object({
    W1: z.enum(keys(DEEP_DIVE.W1.options)).optional(),
    W2: z.object({ value: z.number().int().min(0).max(100000), per: z.enum(['day', 'week', 'month']), seasonal: z.boolean().optional() }).optional(),
    W3: z.enum(keys(DEEP_DIVE.W3.options)).optional(),
    W4: z.enum(keys(DEEP_DIVE.W4.options)).optional(),
    W5: z.string().trim().max(200).optional(),
  }).default({}),
  budget: z.enum(keys(BUDGETS)),
  annual: z.enum(keys(ANNUAL)).optional(),
  dataHandled: z.array(z.enum(keys(DATA_HANDLED))).min(1, 'Tell us what information the tool would handle (or “Not sure”).'),
  autonomy: z.enum(keys(AUTONOMY)),
  timeline: z.enum(keys(TIMELINE)).optional(),
  advisor: z.enum(keys(ADVISOR)).optional(),
  extra: z.string().trim().max(2000).optional(),
}).strict().superRefine((a, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  const visible = new Set(a.areas.flatMap(area => visibleStruggles(area, a).map(s => s.id)));
  for (const s of a.struggles) if (!visible.has(s)) issue('struggles', `Unknown or hidden struggle ${s}.`);
  if (!a.struggles.includes(a.focus)) issue('focus', 'Choose which ticked struggle matters most.');
  if (a.softwareStatus !== 'listed' && a.software.length) issue('software', '“None” and “Not sure” cannot be combined with apps.');
  for (const m of a.mustKeep) if (!a.software.includes(m)) issue('mustKeep', 'Must-keep apps must be in your software list.');
  if (a.dataHandled.includes('unsure') && a.dataHandled.length > 1) issue('dataHandled', '“Not sure” cannot be combined with other choices.');
  const allowed = new Map(triggeredFollowups(a.struggles, a.areas).map(f => [f.id, f]));
  for (const [id, value] of Object.entries(a.followups)) {
    const f = allowed.get(id);
    if (!f) { issue('followups', `Follow-up ${id} does not apply to your answers.`); continue; }
    const vals = Array.isArray(value) ? value : [value];
    if (!f.multi && Array.isArray(value)) issue('followups', `${id} takes one answer.`);
    for (const v of vals) if (!(v in f.options)) issue('followups', `Invalid answer for ${id}.`);
  }
});
export type Answers = z.input<typeof answersSchema>;
type Parsed = z.output<typeof answersSchema>;

export type NeedSource = 'ticked' | 'follow-up' | 'free-text';
export type Need = { capabilityId: string; label: string; priority: 'focus' | 'secondary' | 'inferred'; source: NeedSource; struggleIds: string[]; evidence: string };
export type BusinessBrief = {
  briefVersion: '1.0'; questionnaireVersion: string;
  business: { industry: Parsed['industry']; industryLabel: string; subtype?: string; description?: string; customers?: string; teamSize: Parsed['teamSize']; country: string; state?: string };
  stack: { tools: string[]; mustKeep: string[]; status: Parsed['softwareStatus'] };
  readiness: { techComfort: Parsed['techComfort']; setupBy: Parsed['setupBy'] };
  areas: AreaId[];
  needs: Need[];
  focus: { struggleId: string; label: string; capabilities: string[] };
  followups: Record<string, string | string[]>;
  channels: Channel[];
  deepDive: Parsed['deepDive'];
  constraints: { budget: Parsed['budget']; annual: Parsed['annual'] | 'unknown'; dataHandled: Parsed['dataHandled']; autonomy: Parsed['autonomy']; timeline?: Parsed['timeline']; advisor?: Parsed['advisor'] };
  unknowns: { field: string; effect: string }[];
  answersRaw: Parsed;
};

const asArray = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function buildBrief(input: Answers): BusinessBrief {
  const a = answersSchema.parse(input);
  const needs: Need[] = [];
  const add = (capabilityId: string, priority: Need['priority'], source: NeedSource, struggleId: string | null, evidence: string) => {
    const existing = needs.find(n => n.capabilityId === capabilityId);
    if (existing) {
      if (struggleId && !existing.struggleIds.includes(struggleId)) existing.struggleIds.push(struggleId);
      const rank = { focus: 0, secondary: 1, inferred: 2 };
      if (rank[priority] < rank[existing.priority]) existing.priority = priority;
      return;
    }
    needs.push({ capabilityId, label: capabilityById.get(capabilityId)!.label, priority, source, struggleIds: struggleId ? [struggleId] : [], evidence });
  };
  // Focus struggle first so its capabilities carry the focus priority.
  for (const id of [a.focus, ...a.struggles.filter(s => s !== a.focus)]) {
    const s = struggleById.get(id)!;
    for (const c of s.capabilities) add(c, id === a.focus ? 'focus' : 'secondary', 'ticked', id, s.label);
  }
  // X1: the channel turns "customer questions" into concrete channel capabilities.
  const channels = asArray(a.followups.X1) as Channel[];
  for (const ch of channels) for (const c of CHANNEL_CAPABILITIES[ch] ?? []) add(c, 'secondary', 'follow-up', null, `Customers reach you by ${ch}`);
  // Optional free text may only ADD needs, labelled as inferred.
  if (a.extra && a.extra.length >= 10) {
    const intent = defaultInterpreter.interpret({ problem: a.extra, profileChannels: channels.length ? channels : undefined, clarification: channels.length ? undefined : 'skip' });
    for (const c of intent.capabilities) if (c.role === 'required') add(c.id, 'inferred', 'free-text', null, `You wrote “${c.evidence[0] ?? ''}”`);
  }

  const unknowns: BusinessBrief['unknowns'] = [];
  if (a.budget === 'unknown') unknowns.push({ field: 'budget', effect: 'We cannot confirm whether tools are affordable for you.' });
  if (a.softwareStatus === 'not-sure') unknowns.push({ field: 'software', effect: 'We cannot check compatibility with the software you use.' });
  if (a.dataHandled.includes('unsure')) unknowns.push({ field: 'dataHandled', effect: 'We cannot check data-safety needs; review each tool’s privacy terms.' });
  if (!a.deepDive.W2) unknowns.push({ field: 'volume', effect: 'Usage-based prices are shown as starting prices, not your monthly total.' });
  if (!a.state && a.country === 'US') unknowns.push({ field: 'state', effect: 'We cannot point you to your nearest small-business advisor.' });
  for (const f of triggeredFollowups(a.struggles, a.areas)) if (a.followups[f.id] === undefined) unknowns.push({ field: f.id, effect: `Not answered: “${f.question}”` });
  if (a.followups.X2 === 'unsure') unknowns.push({ field: 'X2', effect: 'Booking vs message-taking is unclear; both kinds of tool are shown.' });

  const focusStruggle = struggleById.get(a.focus)!;
  return {
    briefVersion: '1.0', questionnaireVersion: QUESTIONNAIRE_VERSION,
    business: { industry: a.industry, industryLabel: INDUSTRIES[a.industry].label, subtype: a.subtype, description: a.description, customers: a.customers, teamSize: a.teamSize, country: a.country, state: a.state },
    stack: { tools: a.software, mustKeep: a.mustKeep, status: a.softwareStatus },
    readiness: { techComfort: a.techComfort, setupBy: a.setupBy },
    areas: a.areas, needs,
    focus: { struggleId: a.focus, label: focusStruggle.label, capabilities: focusStruggle.capabilities },
    followups: a.followups, channels, deepDive: a.deepDive,
    constraints: { budget: a.budget, annual: a.annual ?? 'unknown', dataHandled: a.dataHandled, autonomy: a.autonomy, timeline: a.timeline, advisor: a.advisor },
    unknowns, answersRaw: a,
  };
}

/** Monthly volume of the focus task, if the owner gave one. */
export function monthlyVolume(brief: BusinessBrief): number | null {
  const w = brief.deepDive.W2;
  if (!w) return null;
  return Math.round(w.value * (w.per === 'day' ? 30 : w.per === 'week' ? 4.33 : 1));
}
export { FOLLOWUPS };
