import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tools } from '../lib/catalog';
import { CAPABILITIES, CAPABILITY_IDS, capabilityById } from '../lib/discovery/taxonomy';
import { TOOL_TAGS } from '../lib/discovery/tool-tags';
import { RuleInterpreter, stem } from '../lib/discovery/interpret';
import { discover } from '../lib/discovery/discover';
import { evaluateDiscovery } from '../lib/discovery/evaluate';
import { POST } from '../app/api/discover/route';

const ids = (r: ReturnType<typeof discover>) => r.candidates.map(c => c.toolId);
const req = (body: unknown, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  POST(new Request('http://localhost/api/discover', { method: 'POST', headers, body: JSON.stringify(body) }));

test('every catalogue tool is tagged, and every tag uses a controlled capability ID', () => {
  for (const t of tools) assert.ok(TOOL_TAGS[t.id], `untagged tool ${t.id}`);
  for (const [id, tag] of Object.entries(TOOL_TAGS)) {
    assert.ok(tools.some(t => t.id === id), `tag for unknown tool ${id}`);
    assert.ok(Object.keys(tag.caps).length > 0, `${id} has no capabilities`);
    for (const cap of Object.keys(tag.caps)) assert.ok(CAPABILITY_IDS.has(cap), `${id} uses unknown capability ${cap}`);
  }
  assert.equal(new Set(CAPABILITIES.map(c => c.id)).size, CAPABILITIES.length, 'duplicate capability IDs');
});

test('gap capabilities really have no catalogue tool, so gaps are never hidden', () => {
  for (const c of CAPABILITIES.filter(c => c.area === 'gap'))
    assert.ok(!Object.values(TOOL_TAGS).some(t => t.caps[c.id]), `${c.id} is marked as a gap but tagged on a tool`);
});

test('stemming keeps singular/plural and verb forms together without collapsing "notes" into "not"', () => {
  assert.equal(stem('meetings'), stem('meeting'));
  assert.equal(stem('calls'), stem('call'));
  assert.equal(stem('enquiries'), stem('enquiry'));
  assert.notEqual(stem('notes'), 'not');
});

test('landscaping missed calls maps to phone answering + booking, with a documented calendar signal', () => {
  const r = discover({ problem: 'I miss customer calls while working outside and need them answered and appointments booked.', profile: { industry: 'home', teamSize: '2-10', software: ['QuickBooks', 'Google Calendar'] } });
  assert.equal(r.status, 'completed');
  assert.deepEqual(r.intent.capabilities.filter(c => c.role === 'required').map(c => c.id).sort(), ['appointment-booking', 'phone-answering']);
  assert.ok(['frontdesk', 'smith', 'dialzara', 'rosie'].includes(ids(r)[0]));
  assert.ok(!r.intent.capabilities.some(c => capabilityById.get(c.id)!.area === 'marketing'), 'no advertising needs for a phone problem');
  assert.ok(r.candidates.every(c => !['marketing', 'sales'].includes(c.category.split(' ')[0].toLowerCase())), 'no marketing tools for a phone problem');
  const dialzara = r.candidates.find(c => c.toolId === 'dialzara')!;
  assert.ok(dialzara.stack.signals.some(s => s.app === 'Google Calendar' && s.status === 'documented'));
  assert.ok(r.excluded.some(x => x.toolId === 'housecall'), 'existing-customer-only add-on is gated out');
});

test('restaurant food waste is understood but reported as an honest catalogue gap, with no invented tools', () => {
  const r = discover({ problem: 'I overorder ingredients and throw away food each week.', profile: { industry: 'food' } });
  assert.equal(r.candidates.length, 0);
  assert.equal(r.gaps[0].capabilityId, 'inventory-forecasting');
  assert.match(r.gaps[0].message, /will not invent/);
});

test('channel-neutral enquiries ask Q9; answering or skipping resumes; a named channel never asks', () => {
  const problem = 'Customer inquiries get lost and I want automatic responses.';
  const asked = discover({ problem });
  assert.equal(asked.status, 'needs_clarification');
  assert.equal(asked.intent.clarification?.id, 'Q9');
  const web = discover({ problem, clarification: 'website' });
  assert.equal(web.status, 'completed');
  assert.ok(web.intent.capabilities.some(c => c.id === 'website-chat' && c.source === 'clarification'));
  const skipped = discover({ problem, clarification: 'skip' });
  assert.equal(skipped.status, 'completed');
  assert.ok(skipped.candidates.length > 0);
  assert.ok(skipped.intent.capabilities.every(c => c.role === 'optional'));
  const phone = discover({ problem: 'Customers call while I am on jobs and inquiries get lost; I want automatic responses.' });
  assert.notEqual(phone.status, 'needs_clarification');
});

test('explicit negation removes a capability, while "no time to post" is not treated as negation', () => {
  const r = discover({ problem: "I don't want a chatbot, I just need help with my books and receipts." });
  assert.ok(r.intent.excluded.some(c => c.id === 'website-chat'));
  assert.ok(!r.intent.capabilities.some(c => c.id === 'website-chat' || c.id === 'appointment-booking'));
  const posting = new RuleInterpreter().interpret({ problem: "I don't have time to post on Instagram." });
  assert.ok(posting.capabilities.some(c => c.id === 'social-content'));
});

test('free-only budget excludes reviewed paid plans and keeps unverified prices visible as warnings', () => {
  const r = discover({ problem: 'I never know what to post on Instagram for the cafe.', profile: { budget: 'free' } });
  assert.equal(ids(r)[0], 'buffer');
  assert.ok(r.excluded.some(x => x.toolId === 'predis' && /free plan/.test(x.reasons[0])));
  const unverified = r.candidates.find(c => c.evidenceLevel === 'product')!;
  assert.ok(unverified.warnings.some(w => /Price not verified/.test(w)));
  assert.equal(unverified.price.lowestKnownMonthly, null, 'unknown prices stay null, never 0');
});

test('budget ceiling uses the lowest reviewed plan and explains exclusions', () => {
  const r = discover({ problem: 'I miss calls while working on jobs.', profile: { budget: 'under-50' } });
  assert.ok(r.excluded.some(x => x.toolId === 'goodcall' && /above your Under \$50 budget/.test(x.reasons[0])));
  assert.ok(ids(r).includes('dialzara'), '$29 plan stays eligible');
});

test('software the owner already uses is surfaced first-class, and Housecall Pro users keep their add-on', () => {
  const r = discover({ problem: 'Phone calls go to voicemail while my techs are busy.', profile: { software: ['Housecall Pro'] } });
  const hc = r.candidates.find(c => c.toolId === 'housecall');
  assert.ok(hc && hc.stack.inStack);
  const books = discover({ problem: 'My bookkeeping is always behind.', profile: { software: ['QuickBooks'] } });
  assert.equal(ids(books)[0], 'quickbooks');
});

test('developer and builder platforms carry setup warnings and rank below owner-ready tools', () => {
  const r = discover({ problem: 'Calls go unanswered when I am busy.', profile: { teamSize: 'solo' } });
  const vapi = r.candidates.find(c => c.toolId === 'vapi')!;
  assert.ok(vapi.warnings.some(w => /developers/.test(w)));
  assert.ok(ids(r).indexOf('vapi') > ids(r).indexOf('goodcall'));
});

test('multi-need problems expose a coverage map for bundle building', () => {
  const r = discover({ problem: 'I want to write blog posts that show up on Google and also send a monthly newsletter.' });
  const caps = r.coverage.filter(c => c.role === 'required').map(c => c.capabilityId);
  assert.ok(caps.includes('seo-content') && caps.includes('email-marketing'));
  for (const c of r.coverage) for (const id of c.toolIds) assert.ok(r.candidates.some(x => x.toolId === id) || r.totalCandidates > r.candidates.length);
  assert.equal(typeof r.multiToolNeeded, 'boolean');
});

test('unmatched text returns no_match with guidance, and profile priorities are used only as labelled inference', () => {
  assert.equal(discover({ problem: 'help me grow please' }).status, 'no_match');
  const r = discover({ problem: 'not sure where to start honestly', profile: { priorities: ['finance'] } });
  assert.ok(r.intent.capabilities.length > 0 && r.intent.capabilities.every(c => c.source === 'profile' && c.role === 'optional'));
});

test('results are deterministic and every candidate carries sources and a check date', () => {
  const body = { problem: 'Customers keep asking the same questions on my website.', profile: { industry: 'retail' as const } };
  assert.deepEqual(discover(body), discover(body));
  for (const c of discover(body).candidates) { assert.ok(c.sources.length > 0); assert.match(c.checkedAt, /^\d{4}-\d{2}-\d{2}$/); }
});

test('API validates input, rejects unknown fields and non-JSON, and returns results', async () => {
  assert.equal((await req({ problem: 'short' })).status, 400);
  assert.equal((await req({ problem: 'I miss calls on jobs', hack: true })).status, 400);
  assert.equal((await req({ problem: 'I miss calls on jobs', profile: { budget: 'a million' } })).status, 400);
  assert.equal((await req({ problem: 'x'.repeat(2001) })).status, 400);
  assert.equal((await req({ problem: 'I miss calls on jobs' }, { 'Content-Type': 'text/plain' })).status, 415);
  const ok = await req({ problem: 'I miss calls on jobs', profile: { industry: 'home' } });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.mode, 'catalog');
  assert.ok(body.candidates.length > 0);
});

test('evaluation thresholds: tuning set fully passes and held-out set stays above floor', () => {
  const tuning = evaluateDiscovery('tuning');
  assert.equal(tuning.passed, tuning.cases, tuning.results.filter(r => !r.pass).map(r => `${r.id}: ${r.failures}`).join('\n'));
  const holdout = evaluateDiscovery('holdout');
  assert.ok(holdout.capabilityRecall >= 85, `held-out recall ${holdout.capabilityRecall}%`);
  assert.ok(holdout.top3HitRate >= 85, `held-out top-3 ${holdout.top3HitRate}%`);
});
