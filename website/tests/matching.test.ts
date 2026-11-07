import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessmentSchema, defaults, type Answers } from '../lib/assessment';
import { assess } from '../lib/match';
import { tools } from '../lib/catalog';
import { POST } from '../app/api/assess/route';
const sample=(change:Partial<Answers>={}):Answers=>({...defaults,...change});
const find=(answers:Answers,id:string)=>{const r=assess(answers);return [...r.suitable,...r.check,...r.excluded].find(t=>t.toolId===id)!;};

test('free manual cafe drafting has a documented Buffer candidate and transparent score',()=>{
 const r=assess(sample({budget:'free',volume:1,volumeUnit:'pieces'}));
 assert.equal(r.suitable[0].toolId,'buffer');assert.equal(r.suitable[0].score,100);assert.equal(r.suitable[0].cost,0);
 assert.equal(r.suitable[0].criteria.reduce((n,c)=>n+c.points,0),100);
});
test('annual plans cannot qualify without explicit annual-payment consent',()=>{
 const r=assess(sample({output:'image',budget:'amount',monthlyBudget:30,annual:false}));
 const p=r.excluded.find(m=>m.toolId==='predis');assert.ok(p);assert.match(p.reasons.join(' '),/annual payment/);
});
test('an annual payment uses exact yearly total divided by 12',()=>{
 const p=find(sample({output:'image',annual:true,budget:'unknown'}),'predis');
 assert.equal(p.planId,'predis-core');assert.equal(tools.find(t=>t.id==='predis')!.plans[0].price.annual,230);
 assert.equal(tools.find(t=>t.id==='predis')!.plans[0].price.monthly,230/12);
});
test('a cheap voice plan cannot bypass mandatory confirmed booking',()=>{
 const p=find(sample({task:'calls',action:'booking',destination:'google',budget:'unknown'}),'dialzara');
 assert.notEqual(p.status,'suitable');assert.equal(p.planId,'dialzara-pro');assert.ok(p.checks.some(c=>c.includes('booking')));
});
test('an unsupported named integration cannot be a documented match',()=>{
 const r=assess(sample({task:'calls',destination:'other',integrationName:'My legacy CRM'}));
 assert.equal(r.suitable.length,0);assert.ok(r.check.every(m=>m.score===null));
});
test('Goodcall calculates unique-customer overage without converting calls',()=>{
 const p=find(sample({task:'calls',volume:120,volumeUnit:'customers'}),'goodcall');assert.equal(p.cost,94.8);
 const unknown=find(sample({task:'calls',volume:120,volumeUnit:'calls'}),'goodcall');assert.equal(unknown.cost,null);
});
test('unknown usage plus firm budget requires checking for metered plans',()=>{
 const p=find(sample({task:'calls',budget:'amount',monthlyBudget:100}),'goodcall');assert.equal(p.status,'check');assert.equal(p.score,null);
});
test('free-base voice plan does not count as safely free without overage controls',()=>{
 const p=find(sample({task:'calls',budget:'free',volume:10,volumeUnit:'calls'}),'smith');assert.equal(p.status,'check');assert.equal(p.score,null);
});
test('known voice usage above free plan allowance fails free-only budget',()=>{
 const p=find(sample({task:'calls',budget:'free',volume:40,volumeUnit:'calls'}),'smith');assert.equal(p.status,'excluded');
});
test('Housecall Pro is excluded for a business that does not already use it',()=>{
 const p=find(sample({task:'calls',software:'None'}),'housecall');assert.equal(p.status,'excluded');
 const existing=find(sample({task:'calls',software:'Housecall Pro'}),'housecall');assert.equal(existing.existing,true);
});
test('Canva Free cannot satisfy required scheduling',()=>{
 const p=find(sample({budget:'free',publishing:'schedule'}),'canva');assert.equal(p.status,'excluded');
});
test('unknown budget does not earn budget points or complete evidence',()=>{
 const p=find(sample(),'buffer');assert.equal(p.score,80);assert.equal(p.criteria.find(c=>c.label==='Budget')!.known,false);
});
test('unknown generated-content allowance cannot pass a firm monthly volume budget',()=>{
 const p=find(sample({budget:'free',volume:100,volumeUnit:'pieces'}),'buffer');assert.equal(p.status,'check');
});
test('unsupported tasks return an honest empty result',()=>{
 for(const a of [sample({task:'other'}),sample({output:'email'})]){const r=assess(a);assert.equal(r.suitable.length,0);assert.ok(r.message);}
});
test('ranking and one selected plan per tool are reproducible',()=>{
 const a=sample({task:'calls',annual:true,volume:10,volumeUnit:'minutes'});const r=assess(a);
 assert.deepEqual(r,assess(a));const ids=[...r.suitable,...r.check,...r.excluded].map(m=>m.toolId);assert.equal(new Set(ids).size,ids.length);
});
test('input schema rejects forged scores, invalid enums, negative budget and mismatched units',()=>{
 assert.equal(assessmentSchema.safeParse({...sample(),score:100}).success,false);
 assert.equal(assessmentSchema.safeParse({...sample(),budget:'magic'}).success,false);
 assert.equal(assessmentSchema.safeParse({...sample(),monthlyBudget:-1}).success,false);
 assert.equal(assessmentSchema.safeParse({...sample(),volume:2,volumeUnit:'minutes'}).success,false);
 assert.equal(assessmentSchema.safeParse({...sample(),budget:'amount',monthlyBudget:null}).success,false);
});
test('every catalogue plan has official evidence, a cost label and a usable guide',()=>{
 assert.equal(tools.length,11);const ids=new Set<string>();
 for(const t of tools){assert.ok(t.sources.every(s=>new URL(s.url).protocol==='https:'));assert.ok(t.steps.length>=3);assert.ok(t.test&&t.rollback&&t.caveat);for(const p of t.plans){assert.ok(!ids.has(p.id));ids.add(p.id);assert.ok(p.price.label&&p.price.note);}}
});
test('API validates JSON and never accepts a supplied ranking',async()=>{
 const send=(body:string,type='application/json')=>POST(new Request('http://localhost/api/assess',{method:'POST',headers:{'Content-Type':type},body}));
 assert.equal((await send('not json')).status,400);assert.equal((await send('{}','text/plain')).status,415);
 assert.equal((await send(JSON.stringify({...sample(),score:100}))).status,400);
 assert.equal((await send('x'.repeat(17000))).status,413);
 const response=await send(JSON.stringify(sample({budget:'free',volume:1,volumeUnit:'pieces'})));assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
 const value=await response.json();assert.equal(value.suitable[0].toolId,'buffer');assert.equal(value.rulesVersion,'1.0.0');
});
