import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import Home from '../app/page';
import { POST } from '../app/api/assess/route';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,sessionStorage:dom.window.sessionStorage,getComputedStyle:dom.window.getComputedStyle.bind(dom.window)})) Object.defineProperty(globalThis,key,{configurable:true,value});
const originalFetch=globalThis.fetch;
let cleanup:()=>void=()=>{};
afterEach(()=>{cleanup();sessionStorage.clear();globalThis.fetch=originalFetch;});
async function setup(){
 const lib=await import('@testing-library/react');cleanup=lib.cleanup;
 const {default:userEvent}=await import('@testing-library/user-event');
 globalThis.fetch=async (input,init)=>POST(new Request(`http://localhost${String(input)}`,init));
 return {view:lib.render(<Home/>),user:userEvent.setup({document:dom.window.document})};
}
test('owner can complete cafe questionnaire, inspect results, open guide and clear answers without AI',async()=>{
 const {view,user}=await setup();
 await user.click(view.getByRole('button',{name:'Find the right tools'}));
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
 await user.click(view.getByRole('button',{name:/Catch missed enquiries/}));
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
