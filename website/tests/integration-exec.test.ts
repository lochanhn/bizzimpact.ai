import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPlan } from '../lib/pipeline';
import { allowedWebhook, planToCsv, planToIcs, planToWebhookPayload } from '../lib/integration/exports';
import { RECIPE_SCHEMA } from '../lib/integration/recipes';
import { ZAPIER, LINKS } from '../lib/integration/graph';
import { POST } from '../app/api/integrations/webhook/route';
import type { Answers } from '../lib/intake/brief';

const landscaper: Answers = { industry: 'home', teamSize: '2-10', state: 'MD', software: ['QuickBooks', 'Google Calendar', 'Jobber'], mustKeep: ['Jobber'], techComfort: 'steps', setupBy: 'me',
  areas: ['service', 'marketing'], struggles: ['C1', 'C2', 'M1'], focus: 'C1', followups: { X2: 'request', X4: 'google', X5: ['emergencies'], X8: ['facebook', 'instagram'], X9: 'schedule' },
  deepDive: { W2: { value: 40, per: 'week' } }, budget: '50-149', annual: 'no', dataHandled: ['contacts'], autonomy: 'send', advisor: 'yes' };
const cafe: Answers = { industry: 'food', teamSize: '2-10', software: ['Square', 'Canva', 'QuickBooks'], techComfort: 'avoid', setupBy: 'nobody', areas: ['money', 'marketing'],
  struggles: ['F2', 'M1', 'M7'], focus: 'F2', followups: { X10: 'quickbooks', X11: 'me', X8: ['instagram'], X9: 'schedule' }, budget: 'under-50', dataHandled: ['financial'], autonomy: 'organise' };

test('recipes: concrete workflows into the owner’s own apps, with connection method, evidence and human approval', () => {
  const p = runPlan(landscaper);
  const rs = p.integration.recipes;
  assert.ok(rs.length >= 2);
  for (const r of rs) { assert.equal(r.schema, RECIPE_SCHEMA); assert.ok(r.plain.startsWith('When ') || r.plain.startsWith('New ')); assert.ok(['built-in', 'native', 'zapier', 'manual'].includes(r.connection)); }
  assert.ok(rs.some(r => r.action.app === 'Jobber' || r.action.app === 'Google Calendar'), 'phone tool feeds the owner’s field-service or calendar app');
  assert.ok(rs.some(r => r.humanApproval?.includes('confirm')), 'bookings stay requests when the owner chose “request”');
  assert.ok(rs.filter(r => r.connection !== 'manual').every(r => r.evidence || r.zapierUrl || r.connection === 'zapier'), 'automated recipes carry evidence');
  const c = runPlan(cafe).integration.recipes;
  assert.ok(c.some(r => /Dext/.test(r.title) && r.action.app === 'QuickBooks'), 'receipts flow into the owner’s accounting software');
});

test('Zapier listings are verified, and directory links point to real app pages', () => {
  assert.ok(Object.keys(ZAPIER.tools).length >= 30 && Object.keys(ZAPIER.apps).length >= 20);
  for (const l of LINKS.filter(l => l.source.label === 'Zapier app directory')) assert.match(l.source.url, /^https:\/\/zapier\.com\/apps\/[a-z0-9-]+\/integrations$/);
});

test('calendar file is valid iCalendar with the timeline and a 30-day check-in', () => {
  const ics = planToIcs(runPlan(landscaper), new Date('2026-11-09T12:00:00Z'));
  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, (ics.match(/END:VEVENT/g) ?? []).length);
  assert.match(ics, /DTSTART;VALUE=DATE:20261109/);
  assert.match(ics, /SUMMARY:30-day check-in/);
  assert.ok(ics.split('\r\n').every(l => l.length <= 75), 'lines folded');
});

test('spreadsheet export neutralises formula injection and quotes fields', () => {
  const p = runPlan(landscaper);
  p.integration.recipes[0].plain = '=HYPERLINK("http://evil")';
  const csv = planToCsv(p);
  assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`));
  assert.match(csv.split('\r\n')[0], /^Section,Tool,Detail/);
});

test('webhook payload contains the plan but no personal data', () => {
  const payload = planToWebhookPayload(runPlan(landscaper));
  const text = JSON.stringify(payload);
  assert.ok(payload.tasks.length > 0 && payload.workflows.length > 0);
  assert.ok(!('answersRaw' in payload) && !text.includes('planToken'));
});

test('webhook hand-off only reaches the owner’s own Zapier/Make endpoints (no SSRF)', async () => {
  for (const bad of ['http://hooks.zapier.com/hooks/catch/1/a', 'https://evil.com/x', 'https://hooks.zapier.com.evil.com/x', 'https://127.0.0.1/x', 'https://169.254.169.254/latest', 'https://user:pw@hooks.zapier.com/x', 'https://hooks.zapier.com:8443/x', 'not a url'])
    assert.equal(allowedWebhook(bad), null, bad);
  for (const good of ['https://hooks.zapier.com/hooks/catch/123/abc/', 'https://hook.us1.make.com/abc123', 'https://hook.eu2.make.com/xyz']) assert.ok(allowedWebhook(good), good);
  const original = globalThis.fetch; let sentTo = '';
  globalThis.fetch = (async (u: string | URL) => { sentTo = String(u); return new Response('ok'); }) as typeof fetch;
  try {
    const call = (url: string) => POST(new Request('http://localhost/api/integrations/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, payload: { a: 1 } }) }));
    assert.equal((await call('https://evil.com/steal')).status, 400);
    assert.equal(sentTo, '', 'nothing sent for disallowed hosts');
    const ok = await call('https://hooks.zapier.com/hooks/catch/123/abc/');
    assert.equal(ok.status, 200);
    assert.equal(sentTo, 'https://hooks.zapier.com/hooks/catch/123/abc/');
  } finally { globalThis.fetch = original; }
});
