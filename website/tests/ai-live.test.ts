import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateCandidates, parseCandidates, liveDiscover } from '../lib/discovery/live';
import { aiInterpret } from '../lib/discovery/ai-interpret';
import { chat, AiUnavailable } from '../lib/ai/openrouter';

const dir = mkdtempSync(path.join(tmpdir(), 'bizz-ai-'));
let n = 0;
beforeEach(() => {
  n++;
  Object.assign(process.env, { OPENROUTER_ENABLED: 'true', LIVE_WEB_ENABLED: 'true', OPENROUTER_API_KEY: 'test-key', AI_BUDGET_USD: '20',
    AI_LEDGER_PATH: path.join(dir, `ledger-${n}.json`), LIVE_STORE_PATH: path.join(dir, `store-${n}.json`) });
});
const reply = (content: string, annotations: string[] = [], cost = 0.008) => (async () => Response.json({
  choices: [{ message: { content, annotations: annotations.map(url => ({ type: 'url_citation', url_citation: { url, title: url } })) } }],
  usage: { prompt_tokens: 100, completion_tokens: 50, cost },
})) as unknown as typeof fetch;

test('live candidates must be grounded in cited results; invented products and catalogue duplicates are dropped', () => {
  const ann = [{ url: 'https://www.realtool.com/pricing', title: 'Real' }, { url: 'https://review-site.com/best-tools', title: 'Roundup' }];
  const raw = { candidates: [
    { name: 'RealTool', url: 'https://realtool.com', whatItDoes: 'x', pricing: '$29/mo', smallBusinessFit: 'y', sourceUrls: ['https://www.realtool.com/pricing'] },
    { name: 'Mentioned', url: 'https://mentioned.io', whatItDoes: 'x', pricing: null, smallBusinessFit: 'y', sourceUrls: ['https://review-site.com/best-tools'] },
    { name: 'Hallucinated', url: 'https://made-up.ai', whatItDoes: 'x', pricing: '$1', smallBusinessFit: 'y', sourceUrls: ['https://made-up.ai'] },
    { name: 'Insecure', url: 'http://realtool2.com', whatItDoes: 'x', pricing: null, smallBusinessFit: 'y', sourceUrls: [] },
    { name: 'Buffer', url: 'https://buffer.com', whatItDoes: 'x', pricing: null, smallBusinessFit: 'y', sourceUrls: [] },
  ] };
  const { kept, dropped } = validateCandidates(raw, ann, '2026-11-08T00:00:00Z');
  assert.deepEqual(kept.map(k => [k.name, k.evidence]), [['RealTool', 'vendor-page-cited'], ['Mentioned', 'third-party-mention']]);
  assert.equal(dropped, 3);
  assert.ok(kept.every(k => k.status === 'unverified'));
});

test('a reply cut off mid-list keeps the complete products', () => {
  const cut = '{"candidates":[{"name":"A","url":"https://a.com","whatItDoes":"x","pricing":null,"smallBusinessFit":"y","sourceUrls":["https://a.com"]},{"name":"B","url":"https://b.c';
  assert.equal((parseCandidates(cut) as { candidates: unknown[] }).candidates.length, 1);
});

test('live discovery: query carries no owner text, results are cached, and repeat searches are free', async () => {
  let calls = 0, sent = '';
  const f = (async (_u: string, init: RequestInit) => { calls++; sent = String(init.body); return reply('{"candidates":[{"name":"Stocky","url":"https://stocky.app","whatItDoes":"Forecasts orders","pricing":"$39/mo","smallBusinessFit":"Small cafes","sourceUrls":["https://stocky.app/pricing"]}]}', ['https://stocky.app/pricing'])(undefined as never); }) as unknown as typeof fetch;
  const first = await liveDiscover('inventory-forecasting', 'food', { fetchImpl: f });
  assert.equal(first.status, 'found');
  assert.equal(first.candidates[0].name, 'Stocky');
  assert.ok(/"plugins":\[\{"id":"web"/.test(sent));
  assert.ok(!/miss|throw away|I /.test(JSON.parse(sent).messages[1].content.split('\n')[0].slice(0, 5)), 'query built from capability, not owner words');
  const second = await liveDiscover('inventory-forecasting', 'food', { fetchImpl: f });
  assert.equal(second.cached, true);
  assert.equal(calls, 1);
});

test('spend cap blocks calls before any request is sent; disabled AI never calls out', async () => {
  let called = false;
  const f = (async () => { called = true; return reply('{}')(undefined as never); }) as unknown as typeof fetch;
  process.env.AI_BUDGET_USD = '0.01';
  await assert.rejects(chat({ purpose: 't', system: 's', user: 'u', fetchImpl: f }), (e: unknown) => e instanceof AiUnavailable && e.reason === 'budget');
  assert.equal(called, false);
  process.env.OPENROUTER_ENABLED = 'false';
  const r = await liveDiscover('route-dispatch', 'home', { fetchImpl: f });
  assert.equal(r.status, 'disabled');
  assert.equal(called, false);
});

test('provider failure degrades to a clear message instead of an error page', async () => {
  const f = (async () => new Response('down', { status: 503 })) as unknown as typeof fetch;
  const r = await liveDiscover('contract-review', 'home', { fetchImpl: f });
  assert.equal(r.status, 'error');
  assert.match(r.message, /did not respond/);
});

test('AI interpreter can only return IDs from our capability list', async () => {
  const f = reply('{"needs":[{"id":"phone-answering","role":"required","quote":"line rings out"},{"id":"teleportation","role":"required","quote":"x"},{"id":"phone-answering","role":"optional","quote":"dup"}]}');
  const intent = await aiInterpret('The office line just rings out.', f);
  assert.deepEqual(intent.capabilities.map(c => [c.id, c.role, c.source]), [['phone-answering', 'required', 'ai']]);
  assert.match(intent.notes[0], /fixed list/);
});
