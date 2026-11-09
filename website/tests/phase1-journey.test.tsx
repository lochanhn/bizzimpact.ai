import { afterEach,test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';
import OnboardingForm from '../components/phase1/onboarding-form';
import Landing from '../app/page';
import Dashboard from '../app/dashboard/page';
import DiscoveryForm from '../components/phase1/discovery-form';
import { CandidateCard,QualityDetails,GetStartedButton,PhaseHeader } from '../components/phase1/shared';
import { startDemo,openWorkspace } from '../lib/phase1/api';
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
 await user.type(view.getByLabelText(spec.questions[0].label),'Home Services');await user.type(view.getByLabelText('What kind of work do you do?'),'Landscaping');
 await user.type(view.getByLabelText(spec.questions[1].label),'We maintain residential lawns.');
 await user.selectOptions(view.getByLabelText(spec.questions[3].label),'2_10');await user.click(view.getByRole('button',{name:'Next'}));
 await view.findByRole('heading',{name:'Understand your existing setup'});await user.click(view.getByRole('combobox',{name:'Country'}));await user.type(view.getByRole('combobox',{name:'Country'}),'United States');await user.click(view.getByRole('option',{name:'United States'}));
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
 const{view,user}=await setup(<OnboardingForm/>);await view.findByRole('heading',{name:'Tell us about your business'});await user.click(view.getByRole('button',{name:'Next'}));assert.ok(view.getByRole('alert').textContent?.includes('business type'));assert.ok(view.getByRole('heading',{name:'Tell us about your business'}));
});
test('homepage has one clear starting action and no trial or credit messaging',async()=>{
 globalThis.fetch=async()=>Response.json({detail:'Not signed in'},{status:401});const{view}=await setup(<Landing/>);
 assert.equal(view.getAllByRole('link',{name:/Start your AI check-up/}).length,1);assert.equal(view.getByRole('link',{name:/Start your AI check-up/}).getAttribute('href'),'/start');assert.equal(view.getAllByRole('button',{name:'Sign in / save my profile'}).length,1);assert.equal(/Try AI|synthetic demo|shared.*credits|No paid calls|No AI experience/i.test(view.container.textContent??''),false);assert.equal(view.queryByRole('link',{name:'Start with my business'}),null);for(const link of view.container.querySelectorAll('a[href^="/"]'))assert.notEqual(link.getAttribute('target'),'_blank');
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
 await user.type(view.getByLabelText('What kind of work do you do?'),'Landscaping');
 await user.type(view.getByLabelText(spec.questions[1].label),'We maintain residential lawns.');
 await user.selectOptions(view.getByLabelText(spec.questions[3].label),'2_10');
 await user.click(view.getByRole('button',{name:'Next'}));
 await user.click(view.getByRole('combobox',{name:'Country'}));await user.type(view.getByRole('combobox',{name:'Country'}),'United States');await user.click(view.getByRole('option',{name:'United States'}));await user.click(view.getByRole('button',{name:'None'}));
 await user.click(view.getByRole('button',{name:'Back'}));
 assert.equal((view.getByLabelText('What kind of work do you do?') as HTMLInputElement).value,'Landscaping');
 await user.click(view.getByRole('button',{name:'Next'}));
 assert.equal((view.getByRole('combobox',{name:'Country'}) as HTMLInputElement).value,'United States');
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
test('customer questions use everyday language while keeping existing stored IDs',async()=>{
 globalThis.fetch=async input=>String(input).endsWith('/context')?context():Response.json([]);
 const {view,user}=await setup(<OnboardingForm/>);
 await view.findByRole('heading',{name:'Tell us about your business'});
 const customers=view.getByRole('combobox',{name:/Who usually buys from you/});
 await user.selectOptions(customers,'b2b');
 assert.equal((customers as HTMLSelectElement).selectedOptions[0].textContent,'Other businesses');
 assert.equal(/B2B|B2C/.test(view.container.textContent??''),false);
 await user.type(view.getByLabelText(/Tell us a little about your customers/),'Local repair shops');
 assert.equal(JSON.parse(sessionStorage.getItem('bizzimpact-approved-onboarding-v1')!).draft.customer_description,'Local repair shops');
});
function searchBusiness(id='11111111-1111-4111-8111-111111111111'){
 return {business_id:id,industry_subtype:'Landscaping',profile:profileSchema.parse({industry:{category:'Home Services',subtype:'Landscaping'},business_description:'We maintain gardens.',employee_band:'solo',operating_region:{country:'US'},existing_software_status:'none',existing_software:[]})};
}
test('owners review and edit workflow details before a single discovery request is sent',async()=>{
 const sent:any[]=[];let started='';
 globalThis.fetch=async(_input,init)=>{sent.push(JSON.parse(String(init?.body)));return Response.json({run_id:'test-run'});};
 const {view,user}=await setup(<DiscoveryForm business={searchBusiness()} synthetic={false} onStarted={id=>{started=id;}}/>);
 await user.type(view.getByLabelText('What task would you like help with?'),'I miss incoming phone calls.');
 await user.click(view.getByText('Add details for a more focused search (optional)'));
 await user.type(view.getByLabelText(/How do you handle this today/),'Voicemail at the end of the day.');
 await user.type(view.getByLabelText(/What would you like to happen instead/),'Collect details and ask me to approve bookings.');
 await user.type(view.getByLabelText(/What must a tool work with or avoid/),'Keep QuickBooks.');
 await user.click(view.getByRole('button',{name:'Review my search'}));
 assert.ok(view.getByRole('heading',{name:'Review your search request'}));assert.equal(sent.length,0);
 await user.click(view.getByRole('button',{name:'Edit request'}));
 assert.equal((view.getByLabelText('What task would you like help with?') as HTMLTextAreaElement).value,'I miss incoming phone calls.');
 await user.click(view.getByRole('button',{name:'Review my search'}));
 await user.click(view.getByRole('button',{name:'Search for candidate tools'}));
 assert.equal(sent.length,1);assert.equal(started,'test-run');assert.deepEqual(sent[0].context,{current_workflow:'Voicemail at the end of the day.',desired_outcome:'Collect details and ask me to approve bookings.',constraints:'Keep QuickBooks.'});
});
test('search drafts survive returning to the dashboard and remain separate by business',async()=>{
 globalThis.fetch=async()=>{throw new Error('Draft editing must not make a request.');};
 const {view,user}=await setup(<DiscoveryForm business={searchBusiness()} synthetic={false}/>);
 await user.type(view.getByLabelText('What task would you like help with?'),'Help with invoices each week.');
 view.unmount();
 const next=await setup(<DiscoveryForm business={searchBusiness()} synthetic={false}/>);
 assert.equal((next.view.getByLabelText('What task would you like help with?') as HTMLTextAreaElement).value,'Help with invoices each week.');
 next.view.rerender(<DiscoveryForm business={searchBusiness('22222222-2222-4222-8222-222222222222')} synthetic={false}/>);
 assert.equal((next.view.getByLabelText('What task would you like help with?') as HTMLTextAreaElement).value,'');
});
test('workspace entry uses one plain label without promotional helper text',async()=>{
 globalThis.fetch=async()=>Response.json({live_trial:true});
 const {view}=await setup(<GetStartedButton/>);
 await view.findByRole('button',{name:'Get started'});
 assert.equal(view.queryByText(/No signup required|shared AI credits/),null);
});
test('new guest workspace opens in the same tab and preserves browser Back',async()=>{
 let destination='';const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window')!;
 const calls:string[]=[];globalThis.fetch=async input=>{const path=String(input);calls.push(path);return path.endsWith('/context')?Response.json({},{status:401}):Response.json({live_trial:true});};sessionStorage.setItem('bizzimpact-search-draft:old','private draft');
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{assign:(path:string)=>{destination=path;}}}});
 try{await openWorkspace();assert.equal(destination,'/dashboard');assert.deepEqual(calls,['/api/v1/context','/api/v1/availability','/api/v1/trial']);assert.equal(sessionStorage.getItem('bizzimpact-search-draft:old'),null);}finally{Object.defineProperty(globalThis,'window',originalWindow);}
});
test('score UI exposes all weights and marks the index as experimental',async()=>{
 const {view}=await setup(<QualityDetails quality={{rubric_version:'evidence-match-v1',score:100,task_coverage_points:50,source_evidence_points:25,workflow_relevance_points:25,assessment_status:'passed',explanation:'Supports the requested tasks.',evidence_ids:[],source_urls:[],checks:[],limitations:['Exact integrations need verification.']}}/>);
 assert.ok(view.getByText('Match score: 100/100'));
 assert.ok(view.getByText('Requested task coverage: 50/50'));
 assert.ok(view.getByText(/Experimental rubric/));
});
test('returning to an existing workspace preserves the session and unfinished search',async()=>{
 const calls:string[]=[];let destination='';const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window')!;
 globalThis.fetch=async input=>{calls.push(String(input));return Response.json({trial:true,mode:'live'});};sessionStorage.setItem('bizzimpact-search-draft:mine','unfinished search');
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{assign:(path:string)=>{destination=path;}}}});
 try{await openWorkspace();assert.equal(destination,'/dashboard');assert.deepEqual(calls,['/api/v1/context']);assert.equal(sessionStorage.getItem('bizzimpact-search-draft:mine'),'unfinished search');}finally{Object.defineProperty(globalThis,'window',originalWindow);}
});
test('guest navigation has no trial banner or end-trial control',async()=>{
 globalThis.fetch=async()=>Response.json({trial:true,demo:false,synthetic:false});const {view}=await setup(<PhaseHeader/>);
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(/AI trial|shared project|four searches|End AI/i.test(view.container.textContent??''),false);
 assert.ok(view.getByRole('link',{name:'Dashboard'}));assert.ok(view.getByRole('link',{name:'Sign in'}));
});
test('Get started switches an old fictional demo session to real recommendations',async()=>{
 const calls:string[]=[];let destination='';const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window')!;
 globalThis.fetch=async input=>{const path=String(input);calls.push(path);return Response.json(path.endsWith('/context')?{demo:true,synthetic:true}:{live_trial:true});};
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{assign:(path:string)=>{destination=path;}}}});
 try{await openWorkspace();assert.equal(destination,'/dashboard');assert.deepEqual(calls,['/api/v1/context','/api/v1/availability','/api/v1/trial']);}finally{Object.defineProperty(globalThis,'window',originalWindow);}
});
test('live review requires explicit confirmation and can request additional source checking',async()=>{
 const sent:any[]=[];globalThis.fetch=async(_input,init)=>{sent.push(JSON.parse(String(init?.body)));return Response.json({run_id:'live-run'});};
 const {view,user}=await setup(<DiscoveryForm business={searchBusiness()} synthetic={false} live trial onStarted={()=>{}}/>);
 await user.type(view.getByLabelText('What task would you like help with?'),'Handle incoming phone calls.');
 assert.equal(view.queryByText(/shared project AI credits|temporary trial|four searches/i),null);
 await user.click(view.getByRole('button',{name:'Review my search'}));assert.equal(sent.length,0);
 await user.click(view.getByRole('checkbox',{name:/Also check current vendor pages/}));
 await user.click(view.getByRole('button',{name:'Search for candidate tools'}));
 assert.equal(sent.length,1);assert.equal(sent[0].force_web,true);
});
