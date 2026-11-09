import { afterEach,test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import OnboardingForm from '../components/phase1/onboarding-form';
import Landing from '../app/page';
import Dashboard from '../app/dashboard/page';
import { CandidateCard } from '../components/phase1/shared';
import { startDemo } from '../lib/phase1/api';
import { evidenceBackTarget } from '../lib/phase1/navigation';
import products from '../data/discovery-catalog.json';
import type { ToolRecord } from '../lib/phase1/types';
import { profileSchema,spec } from '../lib/phase1/profile';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,sessionStorage:dom.window.sessionStorage,getComputedStyle:dom.window.getComputedStyle.bind(dom.window)}))Object.defineProperty(globalThis,key,{configurable:true,value});
let cleanup=()=>{};const originalFetch=globalThis.fetch;
afterEach(()=>{cleanup();sessionStorage.clear();globalThis.fetch=originalFetch;});
async function setup(element:React.ReactElement){const lib=await import('@testing-library/react');cleanup=lib.cleanup;const{default:userEvent}=await import('@testing-library/user-event');return {view:lib.render(element),user:userEvent.setup({document:dom.window.document})};}
const context=()=>Response.json({demo:true,mode:'mock',synthetic:true});

test('approved three-screen onboarding saves required answers, exclusive software and omitted optionals',async()=>{
 let saved:any=null;let completed=false;
 globalThis.fetch=async(input,init)=>{
  const path=String(input);if(path.endsWith('/context'))return context();if(path.endsWith('/businesses')&&init?.method==='POST'){saved=JSON.parse(String(init.body));return Response.json({business_id:'11111111-1111-4111-8111-111111111111',profile:saved});}return Response.json([]);
 };
 const{view,user}=await setup(<OnboardingForm onSaved={()=>{completed=true;}}/>);
 await view.findByRole('heading',{name:'Tell us about your business'});
 await user.type(view.getByLabelText(spec.questions[0].label),'Home Services');await user.type(view.getByLabelText('Business subtype'),'Landscaping');
 await user.type(view.getByLabelText(spec.questions[1].label),'We maintain residential lawns.');
 await user.selectOptions(view.getByLabelText(spec.questions[3].label),'2_10');await user.click(view.getByRole('button',{name:'Next'}));
 await view.findByRole('heading',{name:'Understand your existing setup'});await user.type(view.getByLabelText('Country'),'US');
 await user.click(view.getByRole('button',{name:'None'}));
 await user.type(view.getByLabelText('Search software or add a custom tool'),'QuickBooks');await user.click(view.getByRole('button',{name:'Add'}));
 assert.equal(view.getByRole('button',{name:'None'}).getAttribute('aria-pressed'),'false');
 await user.click(view.getByRole('button',{name:'Not sure'}));assert.equal(view.queryByRole('button',{name:'Remove QuickBooks'}),null);
 await user.click(view.getByRole('button',{name:'Next'}));await view.findByRole('heading',{name:'Understand your priorities'});
 await user.click(view.getByRole('button',{name:'Save business profile'}));
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(completed,true);assert.equal(saved.customer_type,null);assert.equal(saved.monthly_budget_band,null);assert.deepEqual(saved.improvement_priorities,[]);assert.equal(saved.existing_software_status,'unknown');assert.deepEqual(saved.existing_software,[]);assert.equal(profileSchema.safeParse(saved).success,true);
});
test('required first-screen fields cannot be skipped',async()=>{
 globalThis.fetch=async input=>String(input).endsWith('/context')?context():Response.json([]);
 const{view,user}=await setup(<OnboardingForm/>);await view.findByRole('heading',{name:'Tell us about your business'});await user.click(view.getByRole('button',{name:'Next'}));assert.ok(view.getByRole('alert').textContent?.includes('Complete Q1'));assert.ok(view.getByRole('heading',{name:'Tell us about your business'}));
});
test('primary landing opens the dashboard and keeps scores out of Phase 1',async()=>{
 globalThis.fetch=async()=>Response.json({detail:'Not signed in'},{status:401});const{view}=await setup(<Landing/>);
 assert.equal(view.getByRole('link',{name:'Start with my business'}).getAttribute('href'),'/dashboard');assert.ok(view.getByRole('button',{name:'Try the synthetic demo'}));assert.equal(view.queryByText(/\/100/),null);
});
for(const demo of [false,true])test(`${demo?'demo':'signed-in'} users without profiles stay on the dashboard with an optional setup action`,async()=>{
 const calls:string[]=[];sessionStorage.setItem('bizzimpact-phase1-business','stale-business');
 globalThis.fetch=async input=>{const path=String(input);calls.push(path);return path.endsWith('/context')?Response.json({demo,synthetic:demo}):Response.json([]);};
 const {view}=await setup(<Dashboard/>);
 await view.findByRole('heading',{name:'Welcome to your dashboard.'});
 assert.equal(view.getByRole('link',{name:/Create business profile/}).getAttribute('href'),'/onboarding');
 assert.equal(view.getByRole('link',{name:/Browse the research catalogue/}).getAttribute('href'),'/catalog');
 assert.equal(view.getByRole('link',{name:'Back to the website'}).getAttribute('href'),'/');
 assert.equal(sessionStorage.getItem('bizzimpact-phase1-business'),null);
 assert.equal(calls.some(path=>path.endsWith('/discovery/baseline')),false);
 assert.equal(view.queryByRole('heading',{name:'Tell us about your business'}),null);
});
test('starting a guest session lands on the dashboard instead of the questionnaire',async()=>{
 let destination='';const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window')!;
 globalThis.fetch=async()=>Response.json({synthetic:true});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{replace:(path:string)=>{destination=path;}}}});
 try{await startDemo();assert.equal(destination,'/dashboard');}finally{Object.defineProperty(globalThis,'window',originalWindow);}
});
test('onboarding Back preserves entered answers and always offers a route to the dashboard',async()=>{
 globalThis.fetch=async input=>String(input).endsWith('/context')?context():Response.json([]);
 const {view,user}=await setup(<OnboardingForm/>);
 await view.findByRole('heading',{name:'Tell us about your business'});
 assert.equal(view.getByRole('link',{name:'Back to dashboard'}).getAttribute('href'),'/dashboard');
 assert.ok(view.getByRole('button',{name:'Back to dashboard'}));
 await user.type(view.getByLabelText(spec.questions[0].label),'Home Services');
 await user.type(view.getByLabelText('Business subtype'),'Landscaping');
 await user.type(view.getByLabelText(spec.questions[1].label),'We maintain residential lawns.');
 await user.selectOptions(view.getByLabelText(spec.questions[3].label),'2_10');
 await user.click(view.getByRole('button',{name:'Next'}));
 await user.type(view.getByLabelText('Country'),'US');await user.click(view.getByRole('button',{name:'None'}));
 await user.click(view.getByRole('button',{name:'Back'}));
 assert.equal((view.getByLabelText('Business subtype') as HTMLInputElement).value,'Landscaping');
 await user.click(view.getByRole('button',{name:'Next'}));
 assert.equal((view.getByLabelText('Country') as HTMLInputElement).value,'US');
 assert.equal(view.getByRole('button',{name:'None'}).getAttribute('aria-pressed'),'true');
});
test('evidence links retain their source and direct links fall back to the dashboard',async()=>{
 const runPath='/discovery/11111111-1111-4111-8111-111111111111';
 const {view}=await setup(<CandidateCard tool={products[0] as ToolRecord} returnTo={runPath}/>);
 const href=view.getByRole('link',{name:/View evidence/}).getAttribute('href')!;
 assert.equal(new URL(href,'http://localhost').searchParams.get('returnTo'),runPath);
 assert.deepEqual(evidenceBackTarget(runPath),{href:runPath,label:'Back to discovery results'});
 assert.deepEqual(evidenceBackTarget('/catalog'),{href:'/catalog',label:'Back to catalogue'});
 for(const value of [undefined,'https://elsewhere.invalid','//elsewhere.invalid','javascript:alert(1)','/discovery/../auth',['/catalog']]){
  assert.deepEqual(evidenceBackTarget(value),{href:'/dashboard',label:'Back to dashboard'});
 }
});
test('profile schema rejects optional-field contradictions and accepts custom subtypes',()=>{
 const profile={industry:{category:'Other',subtype:'Custom repair shop'},business_description:'We repair equipment.',employee_band:'solo',operating_region:{country:'us',region:null},existing_software_status:'none',existing_software:[],improvement_priorities:[],monthly_budget_band:null,customer_type:null,customer_contact_channels:null};
 assert.equal(profileSchema.parse(profile).operating_region.country,'US');assert.equal(profileSchema.safeParse({...profile,existing_software:[{raw_name:'Square'}]}).success,false);assert.equal(profileSchema.safeParse({...profile,improvement_priorities:['Not sure yet','Marketing']}).success,false);
});
