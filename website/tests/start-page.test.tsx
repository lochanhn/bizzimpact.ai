import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import StartPage from '../app/start/page';
import { POST } from '../app/api/plan/route';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:3000/start' });
for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, sessionStorage: dom.window.sessionStorage, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) }))
  Object.defineProperty(globalThis, key, { configurable: true, value });
const originalFetch = globalThis.fetch;
let cleanup: () => void = () => {};
afterEach(() => { cleanup(); sessionStorage.clear(); globalThis.fetch = originalFetch; });
async function setup() {
  const lib = await import('@testing-library/react'); cleanup = lib.cleanup;
  const { default: userEvent } = await import('@testing-library/user-event');
  globalThis.fetch = async (input, init) => { const headers=new Headers(init?.headers);headers.set('Origin','http://localhost');return POST(new Request(`http://localhost${String(input)}`, {...init,headers})); };
  return { view: lib.render(<StartPage />), user: userEvent.setup({ document: dom.window.document }), lib };
}

test('owner answers the check-up step by step and gets a plan, comparison and adoption steps', async () => {
  const { view, user, lib } = await setup();
  await user.click(view.getByRole('button', { name: /Continue/ }));
  assert.match(view.getByRole('alert').textContent ?? '', /kind of business/);
  await user.click(view.getByRole('button', { name: 'Home Services' }));
  await user.click(view.getByRole('button', { name: '2–10' }));
  await user.click(view.getByRole('button', { name: /Continue/ }));
  await user.click(view.getByRole('button', { name: 'Google Calendar' }));
  await user.click(view.getByRole('button', { name: /I can follow clear steps/ }));
  await user.click(view.getByRole('button', { name: 'Me' }));
  await user.click(view.getByRole('button', { name: /Continue/ }));
  await user.click(view.getByRole('button', { name: /Customer service, calls & bookings/ }));
  await user.click(view.getByRole('button', { name: /Continue/ }));
  await user.click(view.getByLabelText(/I miss phone calls/));
  await user.click(view.getByRole('button', { name: /Continue/ }));
  assert.ok(view.getByText('When a customer calls or writes, what should happen?'), 'triggered follow-up shown');
  await user.click(view.getByRole('button', { name: /Continue/ }));
  await user.click(view.getByRole('button', { name: '$50–$149' }));
  await user.click(view.getByRole('button', { name: /Customer names/ }));
  await user.click(view.getByRole('button', { name: /Send messages/ }));
  await user.click(view.getByRole('button', { name: /Continue/ }));
  assert.ok(view.getByRole('heading', { name: 'Review' }));
  await user.click(view.getByRole('button', { name: /See my AI plan/ }));
  await lib.waitFor(() => assert.ok(view.getByRole('heading', { name: 'Your AI plan' })));
  assert.ok(view.getByRole('heading', { name: /Recommended plan/ }));
  assert.ok(view.getByRole('heading', { name: /Compare tools/ }));
  assert.ok(view.getByText(/How we weighted this for you/));
  assert.ok(view.getByRole('heading', { name: /Get started/ }));
});

test('filled-in example jumps to review and produces a landscaping plan with local advisor links', async () => {
  const { view, user, lib } = await setup();
  await user.click(view.getByRole('button', { name: /filled-in example/ }));
  assert.ok(view.getByText(/Landscaping \/ lawn care/));
  await user.click(view.getByRole('button', { name: /See my AI plan/ }));
  await lib.waitFor(() => assert.ok(view.getByRole('heading', { name: 'Your AI plan' })));
  assert.ok(view.getByText('Top picks side by side'));
  assert.ok(view.getByText(/Free, neutral local help/));
  assert.ok(view.getAllByText(/Rosie/).length > 0);
});
test('new plan journey keeps dashboard return navigation and the shared country picker',async()=>{
 const {view,user}=await setup();assert.equal(view.getByRole('link',{name:'Back to dashboard'}).getAttribute('href'),'/dashboard');
 await user.click(view.getByRole('combobox',{name:'Country'}));await user.type(view.getByRole('combobox',{name:'Country'}),'Canada');await user.click(view.getByRole('option',{name:'Canada'}));
 await user.click(view.getByRole('combobox',{name:/State/}));assert.ok(view.getByRole('option',{name:'Ontario'}));assert.equal(view.queryByRole('option',{name:'Maryland'}),null);
});
