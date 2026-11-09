import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import Home from '../app/page';
import AuthPage from '../app/auth/page';
import { AuthProvider } from '../components/auth-provider';
import { POST } from '../app/api/assess/route';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,sessionStorage:dom.window.sessionStorage,getComputedStyle:dom.window.getComputedStyle.bind(dom.window)})) Object.defineProperty(globalThis,key,{configurable:true,value});
const originalFetch=globalThis.fetch;
let cleanup:()=>void=()=>{};
afterEach(()=>{cleanup();sessionStorage.clear();globalThis.fetch=originalFetch;});
async function setup(element:React.ReactElement=<Home/>){
 const lib=await import('@testing-library/react');cleanup=lib.cleanup;
 const {default:userEvent}=await import('@testing-library/user-event');
 globalThis.fetch=async (input,init)=>String(input)==='/api/auth/session'?Response.json({configured:false,user:null}):POST(new Request(`http://localhost${String(input)}`,init));
 return {view:lib.render(element),user:userEvent.setup({document:dom.window.document})};
}
test('owner can complete cafe questionnaire, inspect results, open guide and clear answers without AI',async()=>{
 const {view,user}=await setup();
 await user.click(view.getByRole('button',{name:/Quick plan check/}));
 assert.ok(view.getByText('Question 1 of 8'));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.click(view.getByRole('button',{name:/Free tools only/}));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.click(view.getByRole('button',{name:'Continue'}));
 await user.type(view.getByLabelText('Approximate number per month'),'1');
 await user.selectOptions(view.getByLabelText('What are you counting?'),'pieces');
 await user.click(view.getByRole('button',{name:'Review answers'}));
 assert.ok(view.getByRole('heading',{name:'Does this sound like you?'}));
 await user.click(view.getByRole('button',{name:'Show my options'}));
 await view.findByRole('heading',{name:'Your next step, a little clearer.'});
 assert.ok(view.getByRole('heading',{name:'Buffer'}));
 const guideButtons=view.getAllByRole('button',{name:'View setup guide'});await user.click(guideButtons[0]);
 assert.ok(view.getByRole('dialog'));assert.ok(view.getByRole('heading',{name:'Getting started with Buffer'}));
 await user.keyboard('{Escape}');assert.equal(view.queryByRole('dialog'),null);
 assert.ok(sessionStorage.getItem('bizzimpact-assessment-v1'));
 await user.click(view.getByRole('button',{name:'Clear my saved answers'}));
 assert.equal(sessionStorage.getItem('bizzimpact-assessment-v1'),null);
});
test('HVAC fictional example produces a Goodcall plan and a concrete setup checklist',async()=>{
 const {view,user}=await setup();
 await user.click(view.getByRole('button',{name:/HVAC missed enquiries/}));
 assert.ok(view.getByText('Current software: None'));
 await user.click(view.getByRole('button',{name:'Show my options'}));
 await view.findByRole('heading',{name:'Your next step, a little clearer.'});
 assert.ok(view.getByRole('heading',{name:'Goodcall'}));
 await user.click(view.getAllByRole('button',{name:'View setup guide'})[0]);
 assert.ok(view.getByRole('heading',{name:'Getting started with Goodcall'}));
 assert.ok(view.getByRole('button',{name:'Blank enquiry CSV'}));
});
test('catalogue search, empty state and reset operate on the actual reviewed catalogue',async()=>{
 const {view,user}=await setup();await user.click(view.getByRole('button',{name:'Explore tools'}));
 const search=view.getByRole('textbox',{name:'Search tools'});
 await user.type(search,'Canva');assert.ok(view.getByRole('heading',{name:'Canva Magic Write'}));assert.equal(view.queryByRole('heading',{name:'Goodcall'}),null);
 await user.clear(search);await user.type(search,'no-such-tool');assert.ok(view.getByText('No tools match this search.'));
 await user.click(view.getByRole('button',{name:'Clear filters'}));assert.ok(view.getByRole('heading',{name:'Goodcall'}));
});

test('expanded catalogue loads incrementally and can filter research depth and category',async()=>{
 const {view,user}=await setup();await user.click(view.getByRole('button',{name:'Explore tools'}));
 assert.ok(view.getByText('Showing 24 of 111 matching tools'));
 await user.click(view.getByRole('button',{name:/Show more tools \(87 remaining\)/}));assert.ok(view.getByText('Showing 48 of 111 matching tools'));
 await user.click(view.getByRole('button',{name:/Bookkeeping & finance 5/}));assert.ok(view.getByRole('heading',{name:'QuickBooks Intuit Intelligence'}));assert.ok(view.getByText('Showing 5 of 5 matching tools'));
 await user.selectOptions(view.getByRole('combobox',{name:'Review depth'}),'plan');assert.ok(view.getByText('No tools match this search.'));
 await user.click(view.getByRole('button',{name:'Clear filters'}));assert.ok(view.getByText('Showing 24 of 111 matching tools'));
});
test('a newly researched tool has source-linked notes and an honest pre-setup checklist',async()=>{
 const {view,user}=await setup();await user.click(view.getByRole('button',{name:'Explore tools'}));
 await user.type(view.getByRole('textbox',{name:'Search tools'}),'Notion');
 assert.ok(view.getByRole('heading',{name:'Notion AI'}));
 await user.click(view.getByRole('button',{name:'Research & details'}));
 assert.ok(view.getByRole('heading',{name:'Research notes for Notion AI'}));
 assert.ok(view.getByRole('heading',{name:'Before setup: research checklist'}));
 assert.ok(view.getByRole('link',{name:'Official product documentation'}).getAttribute('href')?.includes('notion.com'));
 assert.ok(view.getByText(/outside the current questionnaire matching scope/));
});

test('filtered catalogue export includes every filtered row, not only the visible page',async()=>{
 const {view,user}=await setup();let captured:Blob|undefined;
 const create=URL.createObjectURL;const click=dom.window.HTMLAnchorElement.prototype.click;
 URL.createObjectURL=(blob:Blob)=>{captured=blob;return 'blob:catalogue-test';};
 dom.window.HTMLAnchorElement.prototype.click=function(){};
 try {
  await user.click(view.getByRole('button',{name:'Explore tools'}));
  await user.click(view.getByRole('button',{name:'Download filtered catalogue'}));
  assert.ok(captured);const all=await captured.text();assert.equal(all.split('\r\n').length,112);assert.ok(all.includes('QuickBooks Intuit Intelligence'));
  await user.click(view.getByRole('button',{name:/Bookkeeping & finance 5/}));
  await user.click(view.getByRole('button',{name:'Download filtered catalogue'}));
  assert.equal((await captured!.text()).split('\r\n').length,6);
 }finally{URL.createObjectURL=create;dom.window.HTMLAnchorElement.prototype.click=click;}
});

test('account screen makes missing configuration clear and preserves guest access',async()=>{
 const {view,user}=await setup(<AuthProvider><AuthPage/></AuthProvider>);
 await view.findByText('Accounts aren’t connected yet.');
 assert.equal((view.getByLabelText('Email') as HTMLInputElement).disabled,true);
 assert.equal((view.getByLabelText('Password') as HTMLInputElement).disabled,true);
 assert.equal(view.getByRole('link',{name:/Continue as a guest/}).getAttribute('href'),'/');
 await user.click(view.getByRole('button',{name:'Create account'}));
 assert.ok(view.getByRole('heading',{name:'Let’s get you set up.'}));
});
