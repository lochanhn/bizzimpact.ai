// Integration knowledge graph: anchor apps small businesses already use, and graded, sourced
// links between catalogue tools and those apps. Links are derived ONLY from reviewed catalogue
// evidence (plan connection flags, "AI inside software you own" records, documented listings).
// No link means "unknown", never "compatible".
import { tools, CHECKED, type Tool } from '../catalog';
import { normalise } from '../discovery/interpret';
import { TOOL_FACTS } from '../review/facts';
import zapierFile from '../../data/reviewed/zapier-listings.json';

/** Zapier directory listings verified by scripts/verify-zapier-listings.mts (tool pages must mention the vendor's own domain). */
export const ZAPIER = zapierFile as { generatedAt: string; apps: Record<string, string>; tools: Record<string, string> };
export const zapierPairUrl = (toolId: string, appId: string) => ZAPIER.tools[toolId] && ZAPIER.apps[appId] ? `https://zapier.com/apps/${ZAPIER.apps[appId]}/integrations/${ZAPIER.tools[toolId]}` : null;

export type AppCategory = 'accounting' | 'payments' | 'field-service' | 'calendar' | 'email' | 'website' | 'marketing' | 'social' | 'team' | 'automation' | 'crm' | 'meetings' | 'other';
export type App = { id: string; name: string; category: AppCategory; aliases: string[] };
export const APPS: App[] = [
  { id: 'quickbooks', name: 'QuickBooks', category: 'accounting', aliases: ['quickbooks', 'quickbooks online', 'qbo', 'intuit'] },
  { id: 'xero', name: 'Xero', category: 'accounting', aliases: ['xero'] },
  { id: 'freshbooks', name: 'FreshBooks', category: 'accounting', aliases: ['freshbooks'] },
  { id: 'wave', name: 'Wave', category: 'accounting', aliases: ['wave'] },
  { id: 'square', name: 'Square', category: 'payments', aliases: ['square', 'square appointments', 'square pos'] },
  { id: 'clover', name: 'Clover', category: 'payments', aliases: ['clover'] },
  { id: 'toast', name: 'Toast', category: 'payments', aliases: ['toast'] },
  { id: 'stripe', name: 'Stripe', category: 'payments', aliases: ['stripe'] },
  { id: 'shopify', name: 'Shopify', category: 'website', aliases: ['shopify', 'shopify pos'] },
  { id: 'jobber', name: 'Jobber', category: 'field-service', aliases: ['jobber'] },
  { id: 'housecall', name: 'Housecall Pro', category: 'field-service', aliases: ['housecall pro', 'housecall'] },
  { id: 'servicetitan', name: 'ServiceTitan', category: 'field-service', aliases: ['servicetitan', 'service titan'] },
  { id: 'lmn', name: 'LMN', category: 'field-service', aliases: ['lmn'] },
  { id: 'google-calendar', name: 'Google Calendar', category: 'calendar', aliases: ['google calendar', 'google workspace', 'gmail', 'g suite', 'google'] },
  { id: 'outlook', name: 'Outlook / Microsoft 365', category: 'calendar', aliases: ['outlook', 'microsoft 365', 'office 365', 'microsoft 365 outlook', 'microsoft'] },
  { id: 'calendly', name: 'Calendly', category: 'calendar', aliases: ['calendly'] },
  { id: 'wix', name: 'Wix', category: 'website', aliases: ['wix'] },
  { id: 'squarespace', name: 'Squarespace', category: 'website', aliases: ['squarespace'] },
  { id: 'wordpress', name: 'WordPress', category: 'website', aliases: ['wordpress'] },
  { id: 'mailchimp', name: 'Mailchimp', category: 'marketing', aliases: ['mailchimp'] },
  { id: 'canva', name: 'Canva', category: 'marketing', aliases: ['canva'] },
  { id: 'facebook', name: 'Facebook', category: 'social', aliases: ['facebook', 'facebook instagram', 'meta'] },
  { id: 'instagram', name: 'Instagram', category: 'social', aliases: ['instagram', 'facebook instagram'] },
  { id: 'google-business', name: 'Google Business Profile', category: 'marketing', aliases: ['google business profile', 'google my business'] },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', aliases: ['hubspot'] },
  { id: 'gusto', name: 'Gusto', category: 'team', aliases: ['gusto'] },
  { id: 'homebase', name: 'Homebase', category: 'team', aliases: ['homebase'] },
  { id: '7shifts', name: '7shifts', category: 'team', aliases: ['7shifts'] },
  { id: 'zapier', name: 'Zapier', category: 'automation', aliases: ['zapier'] },
  { id: 'zoom', name: 'Zoom', category: 'meetings', aliases: ['zoom'] },
  { id: 'teams', name: 'Microsoft Teams', category: 'meetings', aliases: ['teams', 'microsoft teams'] },
  { id: 'google-meet', name: 'Google Meet', category: 'meetings', aliases: ['google meet', 'meet'] },
];
export const appById = new Map(APPS.map(a => [a.id, a]));

/** Map free-form software names (questionnaire T1) to anchor apps; unknown names are kept as "other". */
export function resolveApps(names: string[]): { input: string; app: App | null }[] {
  return names.filter(n => !/^(none|not sure|paper|spreadsheet)/i.test(n.trim())).map(input => {
    const n = ` ${normalise(input).join(' ')} `;
    // Longest alias first, so "google calendar" wins over "google".
    const hit = APPS.flatMap(app => app.aliases.map(alias => ({ app, alias }))).sort((a, b) => b.alias.length - a.alias.length)
      .find(({ alias }) => n.includes(` ${alias} `));
    return { input, app: hit?.app ?? null };
  });
}

// Grades, strongest first. Values feed the Review Engine's "works with your tools" pillar.
export type Grade = 'built-in' | 'native' | 'via-zapier' | 'not-supported' | 'unknown';
export const GRADE_VALUE: Record<Grade, number | null> = { 'built-in': 1, native: 0.9, 'via-zapier': 0.55, 'not-supported': 0, unknown: null };
export const GRADE_LABEL: Record<Grade, string> = {
  'built-in': 'Built into software you use', native: 'Direct connection documented', 'via-zapier': 'Connects through Zapier',
  'not-supported': 'Not supported on reviewed plans', unknown: 'Not yet verified',
};
export type Link = { toolId: string; appId: string; grade: Grade; action: string; plans?: string[]; source: { label: string; url: string }; observedAt: string; maturity: 'documented' | 'vendor-stated' | 'listed-only' };

const FLAG_APPS: { flag: 'google' | 'outlook' | 'calendly' | 'facebook' | 'instagram'; appId: string; verb: string }[] = [
  { flag: 'google', appId: 'google-calendar', verb: 'Syncs with Google Calendar' },
  { flag: 'outlook', appId: 'outlook', verb: 'Syncs with Outlook calendar' },
  { flag: 'calendly', appId: 'calendly', verb: 'Books through Calendly' },
  { flag: 'facebook', appId: 'facebook', verb: 'Publishes to Facebook' },
  { flag: 'instagram', appId: 'instagram', verb: 'Publishes to Instagram' },
];
// AI features that live inside software the owner may already pay for.
const BUILT_IN: Record<string, string> = {
  housecall: 'housecall', quickbooks: 'quickbooks', xero: 'xero', mailchimp: 'mailchimp', hubspot: 'hubspot', canva: 'canva',
};
// Connector listings mentioned in reviewed records (listing ≠ a tested workflow).
const LISTED: { toolId: string; appId: string; action: string }[] = [
  { toolId: 'frontdesk', appId: 'zapier', action: 'Listed on Zapier; specific workflows need checking' },
];

function primarySource(tool: Tool) { return tool.sources[0]; }

export function buildLinks(): Link[] {
  const links: Link[] = [];
  for (const tool of tools) {
    for (const { flag, appId, verb } of FLAG_APPS) {
      const states = tool.plans.map(p => ({ plan: p.name, s: p.capabilities[flag] })).filter(x => x.s);
      if (!states.length) continue;
      const yes = states.filter(x => x.s === 'yes').map(x => x.plan);
      if (yes.length) links.push({ toolId: tool.id, appId, grade: 'native', action: verb, plans: yes, source: primarySource(tool), observedAt: tool.research?.checkedAt ?? CHECKED, maturity: 'documented' });
      else if (states.every(x => x.s === 'no')) links.push({ toolId: tool.id, appId, grade: 'not-supported', action: `${verb.replace(/^\w+/, 'Does not sync')}`, source: primarySource(tool), observedAt: tool.research?.checkedAt ?? CHECKED, maturity: 'documented' });
    }
    if (BUILT_IN[tool.id]) links.push({ toolId: tool.id, appId: BUILT_IN[tool.id], grade: 'built-in', action: `AI feature inside ${appById.get(BUILT_IN[tool.id])!.name}`, source: primarySource(tool), observedAt: tool.research?.checkedAt ?? CHECKED, maturity: 'documented' });
  }
  // Vendor-stated native integrations, quoted from the vendor's own pages (lib/review/facts.ts).
  for (const [toolId, f] of Object.entries(TOOL_FACTS)) {
    for (const it of f.integrations) {
      const app = resolveApps([it.app])[0]?.app;
      if (!app || links.some(l => l.toolId === toolId && l.appId === app.id)) continue;
      links.push({ toolId, appId: app.id, grade: app.id === 'zapier' ? 'via-zapier' : 'native', action: app.id === 'zapier' ? 'Listed on Zapier by the vendor' : `Connects with ${app.name} (vendor-stated)`,
        source: { label: 'Vendor integrations page', url: it.url }, observedAt: f.checkedAt, maturity: 'vendor-stated' });
    }
  }
  // Verified Zapier directory listings (documented, not just vendor-stated).
  for (const [toolId, slug] of Object.entries(ZAPIER.tools)) {
    if (links.some(l => l.toolId === toolId && l.appId === 'zapier' && l.maturity === 'documented')) continue;
    for (let i = links.length - 1; i >= 0; i--) if (links[i].toolId === toolId && links[i].appId === 'zapier') links.splice(i, 1);
    links.push({ toolId, appId: 'zapier', grade: 'via-zapier', action: 'Listed in Zapier’s app directory', source: { label: 'Zapier app directory', url: `https://zapier.com/apps/${slug}/integrations` }, observedAt: ZAPIER.generatedAt.slice(0, 10), maturity: 'documented' });
  }
  for (const l of LISTED) {
    const tool = tools.find(t => t.id === l.toolId)!;
    links.push({ toolId: l.toolId, appId: l.appId, grade: 'via-zapier', action: l.action, source: primarySource(tool), observedAt: CHECKED, maturity: 'listed-only' });
  }
  return links;
}
export const LINKS = buildLinks();

export type AppCompatibility = { app: string; appId: string | null; grade: Grade; label: string; action: string | null; source: Link['source'] | null; maturity?: Link['maturity'] };
export type Compatibility = { toolId: string; items: AppCompatibility[]; score: number | null; summary: string; mustKeepConflict: boolean };

/** Grade one tool against the owner's software (questionnaire T1). */
export function compatibility(toolId: string, software: string[], mustKeep: string[] = []): Compatibility {
  const resolved = resolveApps(software);
  const items: AppCompatibility[] = resolved.map(({ input, app }) => {
    if (!app) return { app: input, appId: null, grade: 'unknown', label: GRADE_LABEL.unknown, action: null, source: null };
    const link = LINKS.filter(l => l.toolId === toolId && l.appId === app.id).sort((a, b) => (GRADE_VALUE[b.grade] ?? -1) - (GRADE_VALUE[a.grade] ?? -1))[0];
    // A tool listed on Zapier can reach any app the owner connects to Zapier, only if the owner uses Zapier too.
    // On Zapier (vendor-stated) → most everyday apps are reachable through it, at extra cost and setup.
    const viaZapier = !link && app.id !== 'zapier' && LINKS.some(l => l.toolId === toolId && l.appId === 'zapier') && (!!ZAPIER.apps[app.id] || resolved.some(r => r.app?.id === 'zapier'));
    if (link) return { app: app.name, appId: app.id, grade: link.grade, label: GRADE_LABEL[link.grade], action: link.action + (link.plans ? ` (${link.plans.join(', ')})` : ''), source: link.source, maturity: link.maturity };
    if (viaZapier) { const pair = zapierPairUrl(toolId, app.id); return { app: app.name, appId: app.id, grade: 'via-zapier', label: 'Connects through Zapier', action: `Both are in Zapier’s directory; check the exact trigger or action you need`, source: pair ? { label: 'Zapier connections', url: pair } : null, maturity: pair ? 'documented' : 'listed-only' }; }
    return { app: app.name, appId: app.id, grade: 'unknown', label: GRADE_LABEL.unknown, action: null, source: null };
  });
  const known = items.map(i => GRADE_VALUE[i.grade]).filter((v): v is number => v !== null);
  const score = known.length ? Math.round((known.reduce((a, b) => a + b, 0) / known.length) * 100) : null;
  const keep = new Set(resolveApps(mustKeep).map(r => r.app?.id).filter(Boolean));
  const mustKeepConflict = items.some(i => i.appId && keep.has(i.appId) && i.grade === 'not-supported');
  const good = items.filter(i => i.grade === 'built-in' || i.grade === 'native').length;
  const summary = !items.length ? 'No existing software to check against.'
    : good ? `Works with ${good} of your ${items.length} app${items.length === 1 ? '' : 's'}` : known.length ? 'No documented connection to your apps' : 'Connections to your apps not yet verified';
  return { toolId, items, score, summary, mustKeepConflict };
}

export function linkBetweenTools(a: string, b: string): Link | null {
  // Tool-to-tool: two tools share a documented native/built-in link to the same app (e.g. both sync Google Calendar).
  const la = LINKS.filter(l => l.toolId === a && (l.grade === 'native' || l.grade === 'built-in'));
  const lb = LINKS.filter(l => l.toolId === b && (l.grade === 'native' || l.grade === 'built-in'));
  const shared = la.find(x => lb.some(y => y.appId === x.appId));
  return shared ?? null;
}
