import { afterEach,test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React,{useState} from 'react';
import LocationFields from '../components/phase1/location-fields';
import {countryOptions,regionsFor,locationLabel} from '../lib/phase1/locations';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,sessionStorage:dom.window.sessionStorage,getComputedStyle:dom.window.getComputedStyle.bind(dom.window)}))Object.defineProperty(globalThis,key,{configurable:true,value});
let cleanup=()=>{};afterEach(()=>cleanup());
async function setup(element:React.ReactElement){const lib=await import('@testing-library/react');cleanup=lib.cleanup;const{default:userEvent}=await import('@testing-library/user-event');return {view:lib.render(element),user:userEvent.setup({document:dom.window.document})};}
function Form({initial={country:'',region:null}}:{initial?:{country:string;region:string|null}}){const [value,setValue]=useState(initial);return <><LocationFields label="Where does your business operate?" value={value} onChange={setValue}/><output>{JSON.stringify(value)}</output><button>Next field</button></>;}
test('countries have full names and states are disabled until a country is chosen',async()=>{
 assert.equal(countryOptions.length,249);const{view,user}=await setup(<Form/>);
 assert.equal((view.getByRole('combobox',{name:/State/}) as HTMLInputElement).disabled,true);
 await user.click(view.getByRole('combobox',{name:'Country'}));await user.type(view.getByRole('combobox',{name:'Country'}),'USA');
 await user.click(view.getByRole('option',{name:'United States'}));assert.equal((view.getByRole('combobox',{name:'Country'}) as HTMLInputElement).value,'United States');
 await user.click(view.getByRole('combobox',{name:/State/}));await user.type(view.getByRole('combobox',{name:/State/}),'Maryland');await user.click(view.getByRole('option',{name:'Maryland'}));
 assert.ok(view.getByRole('status').textContent?.includes('"region":"MD"'));
});
test('changing country resets the previous state and shows the new country regions',async()=>{
 const{view,user}=await setup(<Form initial={{country:'US',region:'MD'}}/>);
 assert.equal((view.getByRole('combobox',{name:/State/}) as HTMLInputElement).value,'Maryland');
 await user.click(view.getByRole('combobox',{name:'Country'}));await user.type(view.getByRole('combobox',{name:'Country'}),'Canada');await user.click(view.getByRole('option',{name:'Canada'}));
 assert.ok(view.getByRole('status').textContent?.includes('"region":null'));
 await user.click(view.getByRole('combobox',{name:/State/}));assert.ok(view.getByRole('option',{name:'Ontario'}));assert.equal(view.queryByRole('option',{name:'Maryland'}),null);
 await user.click(view.getByRole('option',{name:'Ontario'}));assert.ok(view.getByRole('status').textContent?.includes('"region":"ON"'));
});
test('keyboard selection prioritizes country codes and Escape closes the list',async()=>{
 const{view,user}=await setup(<Form/>);const input=view.getByRole('combobox',{name:'Country'});
 await user.click(input);await user.type(input,'US');await user.keyboard('{Enter}');assert.equal((input as HTMLInputElement).value,'United States');assert.equal(view.queryByRole('listbox'),null);
 await user.click(input);await user.type(input,'UK');await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');assert.equal((input as HTMLInputElement).value,'United Kingdom');
 await user.click(input);await user.type(input,'zzzz-no-country');assert.ok(view.getByText('No matching options.'));await user.keyboard('{Escape}');assert.equal(view.queryByRole('listbox'),null);assert.equal((input as HTMLInputElement).value,'United Kingdom');
});
test('stored custom regions remain editable and optional regions can be cleared',async()=>{
 const{view,user}=await setup(<Form initial={{country:'US',region:'My service area'}}/>);
 assert.equal((view.getByRole('combobox',{name:/State/}) as HTMLInputElement).value,'My service area');
 await user.click(view.getByRole('combobox',{name:/State/}));await user.click(view.getByRole('option',{name:'Other / not listed'}));await user.type(view.getByRole('textbox',{name:/State/}),'Regional service area');
 assert.ok(view.getByRole('status').textContent?.includes('Regional service area'));await user.click(view.getByRole('button',{name:'Choose from list'}));await user.click(view.getByRole('combobox',{name:/State/}));await user.click(view.getByRole('option',{name:'Not specified'}));
 assert.ok(view.getByRole('status').textContent?.includes('"region":null'));
});
test('region lists include international choices and profile summaries show full names',()=>{
 assert.ok(regionsFor('IN').some(r=>r.label==='Karnataka'));assert.ok(regionsFor('AU').some(r=>r.label==='New South Wales'));
 assert.equal(locationLabel('US','MD'),'United States · Maryland');assert.equal(locationLabel('CA','Ontario'),'Canada · Ontario');
 assert.equal(regionsFor('US').some(r=>['FM','MH','PW','AA','AE','AP'].includes(r.value)),false);
});
