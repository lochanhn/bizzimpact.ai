import { afterEach,test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import SearchProgress from '../components/phase1/search-progress';
import Catalogue from '../app/catalog/page';
import Discovery from '../app/discovery/[runId]/page';
import { profileSchema } from '../lib/phase1/profile';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,sessionStorage:dom.window.sessionStorage,getComputedStyle:dom.window.getComputedStyle.bind(dom.window)}))Object.defineProperty(globalThis,key,{configurable:true,value});
let cleanup=()=>{};const originalFetch=globalThis.fetch;
afterEach(()=>{cleanup();globalThis.fetch=originalFetch;});
async function setup(element:React.ReactElement){const lib=await import('@testing-library/react');cleanup=lib.cleanup;return lib.render(element);}
test('search stages follow backend status without inventing a percentage',async()=>{
 const view=await setup(<SearchProgress status="parsing"/>);
 assert.ok(view.getByRole('heading',{name:'Understanding your task'}));
 assert.equal(view.getByRole('progressbar').getAttribute('aria-valuenow'),null);
 assert.equal(view.container.querySelector('[aria-current="step"]')?.textContent,'1Understand your task');
 view.rerender(<SearchProgress status="web_search"/>);
 assert.ok(view.getByRole('heading',{name:'Searching for tools'}));assert.ok(view.getByText('Looking through additional product pages.'));
 assert.equal(view.container.querySelectorAll('.is-complete').length,1);
 view.rerender(<SearchProgress status="enriching"/>);
 assert.ok(view.getByText('Final step: checking the matches before showing your results.'));
 assert.equal(view.container.querySelectorAll('.is-complete').length,2);
});
test('a long-running first stage remains first while the elapsed clock advances',async()=>{
 const view=await setup(<SearchProgress status="parsing" startedAt={new Date(Date.now()-45000).toISOString()}/>);
 assert.ok(view.getByText(/Still working/));assert.ok(view.getByText(/4[5-9]s elapsed/));
 assert.equal(view.container.querySelector('[aria-current="step"]')?.textContent,'1Understand your task');
 await new Promise(resolve=>setTimeout(resolve,1100));assert.ok(view.getByText(/4[6-9]s elapsed/));
});
test('paused status stops the loading display and terminal states remove it',async()=>{
 const view=await setup(<SearchProgress status="enriching" paused/>);
 assert.ok(view.getByText('Updates paused'));assert.equal(view.container.querySelector('.search-spinner'),null);
 assert.equal(view.container.querySelector('.search-placeholder-grid'),null);
 for(const status of ['completed','partial','failed','needs_clarification']){view.rerender(<SearchProgress status={status}/>);assert.equal(view.queryByRole('progressbar'),null);}
});
test('catalogue cards no longer repeat the vendor-documentation badge',async()=>{
 globalThis.fetch=async()=>Response.json({synthetic:false});const view=await setup(<Catalogue/>);
 assert.ok(view.getByRole('heading',{name:'111 products. Evidence before promises.'}));
 assert.equal(view.queryByText(/Vendor-documented claims.*not independently tested/i),null);
 assert.equal(view.container.querySelector('.review-badge'),null);
});
test('polling moves from the last search stage to results and removes loading cards',async()=>{
 let reads=0;const id='11111111-1111-4111-8111-111111111111';
 const profile=profileSchema.parse({industry:{category:'Home Services',subtype:'Landscaping'},business_description:'We maintain gardens.',employee_band:'solo',operating_region:{country:'US'},existing_software_status:'none',existing_software:[]});
 globalThis.fetch=async input=>{const path=String(input);if(path.endsWith('/context'))return Response.json({synthetic:false});if(path.includes('/discovery/runs/')){reads++;return Response.json({run_id:id,status:reads===1?'enriching':'completed',requirements:null,tools:[],warnings:[],state_history:[{status:'parsing',at:new Date().toISOString()}],profile_snapshot:profile});}return Response.json({configured:false,user:null});};
 const params=Promise.resolve({runId:id});const lib=await import('@testing-library/react');cleanup=lib.cleanup;let view!:ReturnType<typeof lib.render>;
 await lib.act(async()=>{view=lib.render(<React.Suspense fallback={<p>Opening…</p>}><Discovery params={params}/></React.Suspense>);await params;});
 await view.findByRole('heading',{name:'Reviewing your matches'});
 await view.findByRole('heading',{name:/Tools for your task/},{timeout:4000});
 assert.equal(view.queryByRole('progressbar'),null);assert.equal(view.container.querySelector('.search-placeholder-grid'),null);assert.equal(reads,2);
});
