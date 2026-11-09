// Recipe compiler: turns the recommended bundle into concrete, machine-readable workflows
// ("When X happens in tool A → do Y in app B"), each with its connection method, evidence,
// a Zapier link where verified, and the human-approval steps the owner asked for.
// We plan the workflow; trusted execution platforms (the vendor itself, Zapier, Make) run it.
// The schema is stable so it can later compile to Zapier/Make templates.
import { tools } from '../catalog';
import { capabilityById } from '../discovery/taxonomy';
import type { BusinessBrief } from '../intake/brief';
import type { ReviewResult, ToolReview } from '../review/review';
import { appById, compatibility, resolveApps, zapierPairUrl, type Grade } from './graph';
import { appsForBrief } from '../review/review';
import type { Bundle } from './plan';

export const RECIPE_SCHEMA = 'bizzimpact.recipe/1.0';
export type Connection = 'built-in' | 'native' | 'zapier' | 'manual';
export type Recipe = {
  schema: typeof RECIPE_SCHEMA; id: string; title: string; plain: string;
  trigger: { tool: string; event: string };
  action: { app: string; does: string };
  connection: Connection; connectionLabel: string;
  evidence: { label: string; url: string } | null; zapierUrl: string | null;
  humanApproval: string | null; guardrail: string | null;
};

const CONNECTION_LABEL: Record<Connection, string> = {
  'built-in': 'Built in: switch it on', native: 'Direct connection (documented)', zapier: 'Through Zapier (both listed in its directory)', manual: 'Manual for now: export or copy',
};
const toolById = new Map(tools.map(t => [t.id, t]));
const gradeToConnection = (g: Grade): Connection => (g === 'built-in' ? 'built-in' : g === 'native' ? 'native' : g === 'via-zapier' ? 'zapier' : 'manual');

/** What each kind of tool produces, and where that output naturally goes in an owner's stack. */
const PATTERNS: Record<string, { event: string; targets: { category: string[]; does: string }[]; fallback: string }> = {
  'phone-answering': { event: 'takes a call or message', targets: [{ category: ['field-service', 'crm'], does: 'creates a new client/request' }, { category: ['calendar'], does: 'adds the callback to your calendar' }], fallback: 'texts or emails you the caller’s details' },
  'lead-capture': { event: 'captures a new lead', targets: [{ category: ['field-service', 'crm'], does: 'creates the lead as a client/request' }], fallback: 'emails you the lead' },
  'appointment-booking': { event: 'receives a booking request', targets: [{ category: ['calendar', 'field-service'], does: 'adds the appointment to your calendar' }], fallback: 'emails you the request to confirm' },
  'website-chat': { event: 'gets a question it can’t answer', targets: [{ category: ['crm', 'field-service'], does: 'logs the enquiry' }], fallback: 'hands the chat to you by email' },
  'customer-support': { event: 'gets a question it can’t answer', targets: [{ category: ['crm'], does: 'logs the enquiry' }], fallback: 'hands it to you by email' },
  'social-messaging': { event: 'receives a message', targets: [{ category: ['crm'], does: 'logs the contact' }], fallback: 'notifies you' },
  'social-content': { event: 'has a post you’ve approved', targets: [{ category: ['social'], does: 'publishes it' }], fallback: 'lets you copy it to post yourself' },
  'social-scheduling': { event: 'reaches a scheduled time', targets: [{ category: ['social'], does: 'publishes the post' }], fallback: 'reminds you to post' },
  'image-creation': { event: 'finishes a design', targets: [{ category: ['social', 'marketing'], does: 'sends it to your posts' }], fallback: 'lets you download it' },
  'email-marketing': { event: 'needs your customer list', targets: [{ category: ['payments', 'field-service', 'crm', 'website'], does: 'syncs new customers into your list' }], fallback: 'imports a customer CSV you export' },
  'bookkeeping': { event: 'categorises a transaction', targets: [{ category: ['accounting'], does: 'updates your books' }], fallback: 'exports entries for your accountant' },
  'receipt-capture': { event: 'reads a receipt', targets: [{ category: ['accounting'], does: 'creates the expense' }], fallback: 'exports receipts for your books' },
  'meeting-notes': { event: 'finishes a meeting', targets: [{ category: ['meetings'], does: 'records it' }, { category: ['crm', 'email'], does: 'sends notes and action items' }], fallback: 'emails you notes and action items' },
  'crm-followup': { event: 'sees a quote going cold', targets: [{ category: ['calendar', 'email'], does: 'reminds you to follow up' }], fallback: 'reminds you by email' },
  'workflow-automation': { event: 'sees new data in one app', targets: [{ category: ['accounting', 'field-service', 'crm', 'calendar'], does: 'copies it into the next app' }], fallback: 'sends you a summary' },
};

export function compileRecipes(brief: BusinessBrief, rev: ReviewResult, bundle: Bundle | null): Recipe[] {
  if (!bundle) return [];
  const apps = resolveApps(appsForBrief(brief)).filter(r => r.app && r.app.id !== 'zapier').map(r => r.app!);
  const reviews = new Map(rev.reviews.map(r => [r.toolId, r]));
  const handoff = ([] as string[]).concat(brief.followups.X5 ?? []).filter(x => x !== 'nothing');
  const recipes: Recipe[] = [];
  for (const bt of bundle.tools) {
    const r = reviews.get(bt.toolId) as ToolReview;
    const tool = toolById.get(bt.toolId)!;
    const caps = r.discovery.matched.filter(m => m.strength === 'primary').map(m => m.capabilityId);
    for (const cap of caps.length ? caps : r.discovery.matched.map(m => m.capabilityId)) {
      const pat = PATTERNS[cap];
      if (!pat) continue;
      let made = false;
      for (const target of pat.targets) {
        for (const app of apps.filter(a => target.category.includes(a.category))) {
          const c = compatibility(tool.id, [app.name]).items[0];
          if (cap === 'social-content' && brief.followups.X9 === 'manual') continue;
          const connection = gradeToConnection(c.grade);
          recipes.push(makeRecipe(brief, r, cap, pat.event, app.name, target.does, connection, c.source ?? null, zapierPairUrl(tool.id, app.id), handoff));
          made = true;
        }
      }
      if (!made) recipes.push(makeRecipe(brief, r, cap, pat.event, 'You', pat.fallback, 'manual', null, null, handoff));
    }
  }
  // Prefer automated recipes; keep at most 3 per tool.
  const order: Record<Connection, number> = { 'built-in': 0, native: 1, zapier: 2, manual: 3 };
  const seen = new Set<string>();
  return recipes.sort((a, b) => order[a.connection] - order[b.connection])
    .filter(x => { const k = `${x.trigger.tool}|${x.action.app}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .filter((x, _i, all) => all.filter(y => y.trigger.tool === x.trigger.tool).indexOf(x) < 3);
}

function makeRecipe(brief: BusinessBrief, r: ToolReview, cap: string, event: string, app: string, does: string, connection: Connection,
  evidence: Recipe['evidence'], zapierUrl: string | null, handoff: string[]): Recipe {
  const draftOnly = brief.constraints.autonomy === 'draft';
  const rules: string[] = [];
  if (draftOnly) rules.push('You approve each item before it is sent or saved.');
  if (brief.followups.X2 === 'request' && ['phone-answering', 'appointment-booking', 'lead-capture'].includes(cap)) rules.push('Bookings stay requests until you confirm them.');
  if (handoff.length && ['phone-answering', 'lead-capture', 'website-chat', 'customer-support', 'social-messaging'].includes(cap)) rules.push(`Always passed to you: ${handoff.join(', ')}.`);
  const humanApproval = rules.length ? rules.join(' ') : null;
  const plan = toolById.get(r.toolId)!.plans.find(p => p.name === r.cost.plan);
  const guardrail = plan?.price.unit ? `Usage-billed (${plan.price.unit}): set a monthly cap or alert in ${r.name} so extra usage can’t surprise you.` : null;
  const via = connection === 'zapier' ? ' through Zapier' : connection === 'manual' && app !== 'You' ? ' (manual until a connection is confirmed)' : '';
  return {
    schema: RECIPE_SCHEMA, id: `${r.toolId}:${cap}:${app}`.toLowerCase().replace(/[^a-z0-9:]+/g, '-'),
    title: `${r.name} → ${app}`,
    plain: cap === 'email-marketing' && app !== 'You' ? `New customers in ${app} are added to your ${r.name} list${via}.`
      : cap === 'meeting-notes' && app !== 'You' && /Zoom|Meet|Teams/.test(app) ? `${r.name} joins your ${app} meetings and writes notes and action items${via}.`
      : `When ${r.name} ${event}, ${app === 'You' ? `it ${does}` : `${app} ${does}`}${via}.`,
    trigger: { tool: r.name, event }, action: { app, does }, connection, connectionLabel: CONNECTION_LABEL[connection],
    evidence, zapierUrl, humanApproval, guardrail,
  };
}

export const capabilityLabel = (id: string) => capabilityById.get(id)?.label ?? id;
export { appById };
