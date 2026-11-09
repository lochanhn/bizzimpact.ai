import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import DiscoverPage from '../app/discover/page';
import { POST } from '../app/api/discover/route';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:3000/discover' });
for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, sessionStorage: dom.window.sessionStorage, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) }))
  Object.defineProperty(globalThis, key, { configurable: true, value });
const originalFetch = globalThis.fetch;
let cleanup: () => void = () => {};
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
async function setup() {
  const lib = await import('@testing-library/react'); cleanup = lib.cleanup;
  const { default: userEvent } = await import('@testing-library/user-event');
  globalThis.fetch = async (input, init) => { const headers=new Headers(init?.headers);headers.set('Origin','http://localhost');return POST(new Request(`http://localhost${String(input)}`, {...init,headers})); };
  return { view: lib.render(<DiscoverPage />), user: userEvent.setup({ document: dom.window.document }), lib };
}

test('owner describes a problem in their own words and sees explained, source-linked matches', async () => {
  const { view, user, lib } = await setup();
  await user.click(view.getByRole('button', { name: /Find matching tools/ }));
  assert.ok(view.getByRole('alert').textContent?.includes('at least 10 characters'));
  await user.type(view.getByLabelText('Your problem'), 'I miss calls while I am out on jobs and lose customers.');
  await user.click(view.getByRole('button', { name: /Find matching tools/ }));
  await lib.waitFor(() => assert.ok(view.getByRole('heading', { name: /\d+ matching tools?$/ })));
  assert.ok(view.getByText('What we understood'));
  assert.ok(view.getAllByText('AI phone answering').length >= 1);
  assert.ok(view.getByText(/Review the reasons and checks/));
  assert.equal(/Need match \d+|out of 100/i.test(view.container.textContent??''),false);
  assert.ok(view.getAllByRole('link', { name: /opens in a new tab/ }).length > 0);
});

test('ambiguous enquiry example asks Q9 and can be skipped; food waste shows an honest gap', async () => {
  const { view, user, lib } = await setup();
  await user.click(view.getByRole('button', { name: 'Unclear enquiry channel' }));
  await lib.waitFor(() => assert.ok(view.getByText('How do customers usually reach your business?')));
  await user.click(view.getByRole('button', { name: /Skip this question/ }));
  await lib.waitFor(() => assert.ok(view.getByRole('heading', { name: /\d+ matching tools?$/ })));
  await user.click(view.getByRole('button', { name: 'Restaurant food waste' }));
  await lib.waitFor(() => assert.ok(view.getByText(/will not invent one/)));
});

test('own-words results hand off to the full check-up with matching struggles pre-ticked', async () => {
  const { view, user, lib } = await setup();
  await user.click(view.getByRole('button', { name: 'Landscaper missing calls' }));
  await lib.waitFor(() => assert.ok(view.getByRole('button', { name: /Turn this into a full AI plan/ })));
  await user.click(view.getByRole('button', { name: /Turn this into a full AI plan/ }));
  const draft = JSON.parse(dom.window.sessionStorage.getItem('bizzimpact-checkup-v1') ?? '{}');
  assert.deepEqual(draft.areas, ['service']);
  assert.ok(draft.struggles.includes('C1') && draft.struggles.includes('C2'));
  assert.equal(draft.focus, 'C1');
  assert.equal(draft.industry, 'home');
  assert.deepEqual(draft.software, ['QuickBooks', 'Google Calendar']);
});
