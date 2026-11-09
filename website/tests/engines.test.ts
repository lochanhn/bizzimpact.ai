import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, FOLLOWUPS, QUESTION_USAGE, STRUGGLES, DEEP_DIVE } from '../lib/intake/bank';
import { answersSchema, buildBrief, type Answers } from '../lib/intake/brief';
import { CAPABILITY_IDS } from '../lib/discovery/taxonomy';
import { discoverFromBrief } from '../lib/discovery/from-brief';
import { review, personalWeights } from '../lib/review/review';
import { integrate } from '../lib/integration/plan';
import { compatibility, resolveApps, LINKS } from '../lib/integration/graph';
import { runPlan } from '../lib/pipeline';
import { tools } from '../lib/catalog';
import { TOOL_FACTS, securityBadge, iciTier, validateFacts } from '../lib/review/facts';
import { issuePlanToken, verifyPlanToken, submitReport, aggregate, wilsonLower, type Report } from '../lib/review/outcomes';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { POST } from '../app/api/plan/route';

const landscaper: Answers = {
  industry: 'home', subtype: 'Landscaping / lawn care', teamSize: '2-10', state: 'MD', software: ['QuickBooks', 'Google Calendar', 'Jobber'], mustKeep: ['Jobber'],
  techComfort: 'steps', setupBy: 'me', areas: ['service', 'marketing'], struggles: ['C1', 'C2', 'M1'], focus: 'C1',
  followups: { X2: 'request', X3: ['hours', 'busy'], X4: 'google', X5: ['emergencies'], X7: 'new', X8: ['facebook', 'instagram'], X9: 'schedule' },
  deepDive: { W2: { value: 40, per: 'week' }, W3: '3-5', W5: 'Every call answered' }, budget: '50-149', annual: 'no', dataHandled: ['contacts'], autonomy: 'send', timeline: 'month', advisor: 'yes',
};
const cafe: Answers = {
  industry: 'food', teamSize: '2-10', software: ['Square', 'Canva'], techComfort: 'avoid', setupBy: 'nobody', areas: ['stock', 'marketing'],
  struggles: ['S1', 'M1', 'M3'], focus: 'S1', followups: { X12: ['sales'], X13: 'suggest', X8: ['instagram'], X9: 'manual' }, budget: 'free', dataHandled: ['public'], autonomy: 'draft',
};
const with_ = (base: Answers, change: Partial<Answers>): Answers => ({ ...base, ...change });

test('question bank: every struggle maps to controlled capabilities and every question is used by an engine', () => {
  assert.equal(STRUGGLES.length, 43);
  assert.equal(new Set(STRUGGLES.map(s => s.id)).size, STRUGGLES.length);
  for (const s of STRUGGLES) for (const c of s.capabilities) assert.ok(CAPABILITY_IDS.has(c), `${s.id} → unknown ${c}`);
  for (const f of FOLLOWUPS) {
    assert.ok(f.usedBy.length > 0, `${f.id} unused`);
    for (const t of f.trigger) assert.ok(t.startsWith('area:') ? AREAS.some(a => `area:${a.id}` === t) : STRUGGLES.some(s => s.id === t), `${f.id} bad trigger ${t}`);
  }
  for (const [id, used] of Object.entries(QUESTION_USAGE)) assert.ok(used.length > 0, `${id} unused`);
  for (const [id, q] of Object.entries(DEEP_DIVE)) assert.ok(q.usedBy.length > 0, `${id} unused`);
});

test('brief validation rejects inconsistent answers instead of guessing', () => {
  const bad = (change: Partial<Answers>) => answersSchema.safeParse(with_(landscaper, change)).success;
  assert.equal(bad({ focus: 'M5' }), false, 'focus must be ticked');
  assert.equal(bad({ areas: ['service', 'marketing', 'money', 'admin'] }), false, 'max three areas');
  assert.equal(bad({ softwareStatus: 'none' }), false, 'None cannot combine with apps');
  assert.equal(bad({ mustKeep: ['Shopify'] }), false, 'must-keep must be in software list');
  assert.equal(bad({ followups: { X12: ['sales'] } }), false, 'follow-up must be triggered');
  assert.equal(bad({ followups: { X2: 'teleport' } }), false, 'invalid option');
  assert.equal(bad({ struggles: ['C1', 'A10'], focus: 'C1', areas: ['service'] }), false, 'struggle outside chosen areas');
  assert.equal(bad({ dataHandled: ['unsure', 'health'] }), false, 'Not sure is exclusive');
  assert.equal(answersSchema.safeParse(with_(cafe, { struggles: ['S1', 'A8'], areas: ['stock', 'admin'], teamSize: 'solo', focus: 'S1', followups: {} })).success, false, 'staff scheduling hidden for solo owners');
});

test('brief: ticked struggles become needs with focus priority; free text only adds inferred needs', () => {
  const b = buildBrief(with_(landscaper, { extra: 'We also forget to follow up on quotes.' }));
  assert.deepEqual(b.needs.filter(n => n.priority === 'focus').map(n => n.capabilityId).sort(), ['lead-capture', 'phone-answering']);
  assert.ok(b.needs.some(n => n.capabilityId === 'appointment-booking' && n.priority === 'secondary' && n.source === 'ticked'));
  const inferred = b.needs.find(n => n.capabilityId === 'crm-followup');
  assert.ok(inferred && inferred.priority === 'inferred' && inferred.source === 'free-text');
  const c = buildBrief(with_(landscaper, { struggles: ['C3'], focus: 'C3', areas: ['service'], followups: { X1: ['website'] } }));
  assert.ok(c.needs.some(n => n.capabilityId === 'website-chat' && n.source === 'follow-up'), 'channel answer resolves the need');
  const u = buildBrief(with_(cafe, { budget: 'unknown', softwareStatus: 'not-sure', software: [] }));
  assert.ok(['budget', 'software', 'volume', 'state'].every(f => u.unknowns.some(x => x.field === f)));
});

test('discovery from the brief needs no text interpretation and reports honest gaps', () => {
  const d = discoverFromBrief(buildBrief(cafe));
  assert.equal(d.interpreter, 'questionnaire-v1');
  assert.ok(d.gaps.some(g => g.capabilityId === 'inventory-forecasting'));
  assert.ok(d.intent.capabilities.every(c => c.source === 'questionnaire'));
});

test('review: gates use cost at the owner volume and respect "no yearly billing"', () => {
  const b = buildBrief(landscaper);
  const r = review(b, discoverFromBrief(b));
  const smith = r.reviews.find(x => x.toolId === 'smith')!;
  assert.equal(smith.status, 'not-suitable');
  assert.match(smith.gates[0], /above your monthly budget/);
  const fd = r.reviews.find(x => x.toolId === 'frontdesk')!;
  assert.equal(fd.cost.annualRequired, false, 'monthly plan chosen when yearly billing is refused');
  const goodcall = r.reviews.find(x => x.toolId === 'goodcall')!;
  assert.equal(goodcall.cost.monthly, 136.67, '$79 + (173 − 100) × $0.79 at 40 calls/week');
});

test('review: top picks need minimum evidence; unknown pillars stay null, never zero', () => {
  const b = buildBrief(landscaper);
  const r = review(b, discoverFromBrief(b));
  assert.ok(r.topPicks.length > 0 && r.topPicks.length <= 3);
  for (const id of r.topPicks) { const t = r.reviews.find(x => x.toolId === id)!; assert.notEqual(t.confidence, 'Low'); assert.ok(t.coversFocus); }
  const unverified = r.reviews.find(x => x.discovery.evidenceLevel === 'product')!;
  assert.equal(unverified.pillars.find(p => p.id === 'cost')!.score, null);
  assert.notEqual(unverified.status, 'top-pick');
  assert.ok(unverified.checkBeforeBuying.some(c => /price/i.test(c)));
});

test('review: personal weights follow the owner answers and are explained', () => {
  const tight = personalWeights(buildBrief(cafe));
  const base = personalWeights(buildBrief(with_(cafe, { budget: '500+', techComfort: 'comfortable', setupBy: 'me', autonomy: 'act' })));
  assert.ok(tight.weights.cost > base.weights.cost && tight.weights.ease > base.weights.ease);
  assert.ok(tight.reasons.some(r => /budget/.test(r)));
  const sens = personalWeights(buildBrief(with_(cafe, { dataHandled: ['health'] })));
  assert.ok(sens.weights.security > tight.weights.security - 1 && sens.reasons.some(r => /sensitive/.test(r)));
  for (const w of [tight, base, sens]) assert.ok(Math.abs(Object.values(w.weights).reduce((a, b) => a + b, 0) - 100) <= 2);
  const r = review(buildBrief(with_(landscaper, { dataHandled: ['health'] })), discoverFromBrief(buildBrief(with_(landscaper, { dataHandled: ['health'] }))));
  assert.ok(r.reviews.some(x => x.checkBeforeBuying.some(c => /HIPAA/.test(c))), 'compliance shown as a check, not a claim');
});

test('integration graph: links come only from catalogue evidence, and unknown apps stay unknown', () => {
  for (const l of LINKS) { assert.ok(tools.some(t => t.id === l.toolId)); assert.match(l.source.url, /^https:\/\//); if (l.maturity === 'vendor-stated') assert.ok(TOOL_FACTS[l.toolId]?.integrations.some(i => i.url === l.source.url), 'vendor-stated links cite the vendor page'); }
  assert.equal(resolveApps(['Google Calendar'])[0].app?.id, 'google-calendar');
  assert.equal(resolveApps(['Microsoft 365 / Outlook'])[0].app?.id, 'outlook');
  const c = compatibility('dialzara', ['Google Calendar', 'Jobber']);
  assert.equal(c.items.find(i => i.app === 'Google Calendar')!.grade, 'native');
  assert.equal(c.items.find(i => i.app === 'Jobber')!.grade, 'via-zapier', 'vendor states a Zapier listing, so Jobber is reachable through Zapier');
  assert.equal(compatibility('slang', ['Jobber']).items[0].grade, 'unknown', 'no evidence means unknown, never compatible');
  assert.equal(compatibility('quickbooks', ['QuickBooks']).items[0].grade, 'built-in');
});

test('integration: bundle covers every coverable need within budget, with sourced data flow and adoption steps', () => {
  const p = runPlan(landscaper);
  const b = p.integration.recommended!;
  assert.ok(b && b.missing.length === 0 && b.withinBudget !== false);
  assert.ok(b.tools.length <= 3);
  assert.ok(b.dataFlow.some(f => /Instagram|Facebook|Google Calendar/.test(f)));
  assert.equal(p.integration.adoption[0].order, 1);
  assert.ok(p.integration.adoption[0].steps.some(s => s.title === 'Test safely') && p.integration.adoption[0].steps.some(s => /work out/.test(s.title)));
  assert.equal(p.integration.successMeasure, 'Every call answered');
  assert.ok(p.integration.advisor && p.integration.advisor.links.every(l => /^https:\/\/(americassbdc\.org|www\.score\.org|www\.sba\.gov)\//.test(l.url)));
  if (p.integration.alternative?.label === 'Lower-cost option') assert.equal(p.integration.alternative.unknownCosts, 0, 'unknown prices are never treated as $0');
});

test('integration: when the #1 problem is a catalogue gap, the plan says so and still covers other needs for free', () => {
  const p = runPlan(cafe);
  assert.equal(p.review.topPicks.length, 0);
  assert.match(p.review.notes[0], /will not invent/);
  const b = p.integration.recommended!;
  assert.equal(b.totalMonthly, 0);
  assert.ok(b.tools.every(t => t.monthly === 0));
});

test('plan API validates answers and returns all three engines', async () => {
  const req = (body: unknown) => POST(new Request('http://localhost/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  assert.equal((await req({ ...landscaper, focus: 'M9' })).status, 400);
  assert.equal((await req({ ...landscaper, secret: 1 })).status, 400);
  const ok = await req(landscaper);
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.ok(body.brief && body.discovery && body.review && body.integration);
  assert.deepEqual(runPlan(landscaper).review.topPicks, body.review.topPicks, 'deterministic');
});

test('trust facts: only quotes from the vendor\'s own policy pages count; missing evidence is grey, never red', () => {
  const raw = { soc2: { status: 'type2', quote: 'We are SOC 2 Type II certified.', url: 'https://acme.com/security' },
    trainsOnData: { status: 'yes', quote: 'We use your data to train our models.', url: 'https://acme.com/blog/ai-news' },
    hipaaBaa: { status: 'available', quote: 'We sign BAAs for healthcare customers.', url: 'https://evil.com/acme' },
    setup: { evidence: [{ fact: 'Phone call forwarding required', quote: 'Forward your line to us', url: 'https://help.acme.com/setup' }] }, integrations: [] };
  const f = validateFacts(raw, 'acme.com')!;
  assert.equal(f.soc2.status, 'type2');
  assert.equal(f.trainsOnData.status, 'not-found', 'blog posts are not policy');
  assert.equal(f.hipaaBaa.status, 'not-found', 'other domains do not count');
  const badge = securityBadge({ ...f, toolId: 'acme', domain: 'acme.com', checkedAt: '2026-11-08', sourcesSeen: 3 });
  assert.notEqual(badge.level, 'red');
  assert.equal(securityBadge(null).level, 'grey');
  assert.equal(iciTier({ ...f, toolId: 'acme', domain: 'acme.com', checkedAt: '2026-11-08', sourcesSeen: 3 }, { audience: 'owner', category: 'calls', existingOnly: false }).tier, 3);
  for (const [id, t] of Object.entries(TOOL_FACTS)) if (securityBadge(t).level === 'red') assert.ok(t.trainsReview, `${id} red badge needs a human-reviewed quote`);
});

test('owner results: signed plans only, one report per tool, similar businesses weigh more, thin evidence shrinks to neutral', async () => {
  process.env.OUTCOMES_PATH = path.join(mkdtempSync(path.join(tmpdir(), 'bizz-out-')), 'o.json');
  process.env.OUTCOME_MIN_DAYS = '14';
  const issued = new Date('2026-10-01T00:00:00Z');
  const token = issuePlanToken({ toolIds: ['rosie'], industry: 'home', teamSize: '2-10' }, issued);
  assert.ok(verifyPlanToken(token));
  assert.equal(verifyPlanToken(token.slice(0, -2) + 'xx'), null, 'tampered token rejected');
  const later = new Date('2026-11-08T00:00:00Z');
  assert.equal((await submitReport({ token, toolId: 'goodcall', adopted: 'yes', fixed: 'yes' }, later)).ok, false, 'tool not in plan');
  assert.equal((await submitReport({ token, toolId: 'rosie', adopted: 'yes', fixed: 'yes' }, new Date('2026-10-05T00:00:00Z'))).ok, false, 'too early');
  assert.equal((await submitReport({ token, toolId: 'rosie', adopted: 'yes', fixed: 'yes', hoursSaved: '3-5' }, later)).ok, true);
  assert.equal((await submitReport({ token, toolId: 'rosie', adopted: 'yes', fixed: 'no' }, later)).ok, false, 'one report per plan per tool');
  const r = (industry: string, fixed: 'yes' | 'no'): Report => ({ toolId: 'rosie', adopted: 'yes', fixed, planId: Math.random().toString(), industry, teamSize: '2-10', reportedAt: later.toISOString(), status: 'counted' });
  const one = aggregate([r('home', 'yes')], 'rosie', { industry: 'home', teamSize: '2-10' }, later);
  assert.ok(one.score! > 50 && one.score! < 70, `one good report stays near neutral (${one.score})`);
  assert.ok(one.fixedAtLeast! < 30, 'Wilson lower bound: 1 of 1 never reads as 100%');
  const mine = aggregate([r('home', 'yes'), r('food', 'no')], 'rosie', { industry: 'home', teamSize: '2-10' }, later);
  const theirs = aggregate([r('home', 'yes'), r('food', 'no')], 'rosie', { industry: 'food', teamSize: '2-10' }, later);
  assert.ok(mine.score! > theirs.score!, 'results from similar businesses count more');
  assert.ok(Math.abs(wilsonLower(8, 10) - 0.49) < 0.02);
});

test('owner results change rankings only as evidence grows; no reports means no effect', () => {
  const base = runPlan(landscaper);
  const reports: Report[] = Array.from({ length: 12 }, (_, i) => ({ toolId: 'goodcall', adopted: 'yes', fixed: 'yes', hoursSaved: '3-5', planId: `p${i}`, industry: 'home', teamSize: '2-10', reportedAt: new Date().toISOString(), status: 'counted' }));
  const boosted = runPlan(landscaper, reports);
  const before = base.review.reviews.find(x => x.toolId === 'goodcall')!, after = boosted.review.reviews.find(x => x.toolId === 'goodcall')!;
  assert.equal(before.pillars.find(p => p.id === 'owners')!.score, null);
  assert.ok(after.fit! > before.fit!, 'proven results raise fit');
  assert.ok(after.proof > before.proof, 'and confidence');
  const held = runPlan(landscaper, reports.map(x => ({ ...x, status: 'held' as const })));
  assert.equal(held.review.reviews.find(x => x.toolId === 'goodcall')!.fit, before.fit, 'held reports do not count');
  assert.ok(base.planToken && base.checkInTools.length > 0);
});
