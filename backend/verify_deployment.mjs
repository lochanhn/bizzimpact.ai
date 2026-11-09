// Explicit paid HTTPS check using fictional profiles. No provider credentials needed.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
if(!process.argv.includes('--paid-authorized'))throw Error('Pass --paid-authorized; this starts real paid searches.');
const base=process.env.VERIFY_BASE_URL??'https://bizzimpact.3-92-95-188.sslip.io';
const scenarios=JSON.parse(readFileSync(new URL('./data/scenarios.json',import.meta.url))).cases;
const promptVersion=readFileSync(new URL('./app/prompts.py',import.meta.url),'utf8').match(/PROMPT_VERSION='([^']+)'/)[1];
const report={timestamp:new Date().toISOString(),base,fictional_profiles:true,paid_authorized:true,checks:[],cases:[]};
async function request(path,{cookie,body,method}={}){
 const response=await fetch(base+'/api/v1'+path,{method:method??(body!==undefined?'POST':'GET'),headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body!==undefined?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const data=await response.json();return {response,data};
}
async function session(kind){const {response,data}=await request('/'+kind,{method:'POST'});assert.equal(response.status,201,JSON.stringify(data));const name='bizzimpact-'+(kind==='trial'?'trial':'demo')+'-session';const cookie=response.headers.getSetCookie().find(c=>c.startsWith(name+'='));assert.ok(cookie);assert.match(cookie,/HttpOnly/i);assert.match(cookie,/Secure/i);assert.equal(data.token,undefined);return cookie.split(';')[0];}
async function business(cookie,index){const profile=structuredClone(scenarios[index].profile);profile.existing_software=profile.existing_software.map(s=>typeof s==='string'?{raw_name:s}:s);const {response,data}=await request('/businesses',{cookie,body:profile});assert.equal(response.status,201,JSON.stringify(data));return data.business_id;}
async function run(cookie,business_id,problem_text,force_web=false){
 const started=Date.now();const {response,data}=await request('/discovery/runs',{cookie,body:{business_id,problem_text,force_web,context:{constraints:'I must approve anything before it is sent or purchased.'}}});assert.equal(response.status,202,JSON.stringify(data));
 let result;
 for(let i=0;i<180;i++){const reply=await request('/discovery/runs/'+data.run_id,{cookie});assert.equal(reply.response.status,200);result=reply.data;if(['completed','partial','needs_clarification','failed'].includes(result.status))break;await new Promise(resolve=>setTimeout(resolve,1000));}
 assert.ok(['completed','partial','needs_clarification'].includes(result.status),JSON.stringify({status:result.status,code:result.error_code}));
 return {result,latency_seconds:(Date.now()-started)/1000};
}
const {data:availability}=await request('/availability');assert.equal(availability.live_trial,true);assert.equal(availability.live_web,true);report.checks.push('Live trial and bounded web lookup enabled');
const trial=await session('trial');
const {data:context}=await request('/context',{cookie:trial});assert.equal(context.trial,true);assert.equal(context.mode,'live');assert.equal(context.synthetic,false);
const invoiceBusiness=await business(trial,4);const {data:baseline}=await request('/discovery/baseline',{cookie:trial,body:{business_id:invoiceBusiness}});assert.equal(baseline.usage.model_calls,0);assert.equal(baseline.usage.search_calls,0);report.checks.push('Baseline uses zero paid calls');
let firstRun;
try{
 for(const [name,index,problem,web] of [['invoices',4,'Extract and match invoice details for my bookkeeper.',false],['calls',0,'I miss incoming phone calls and need appointments booked.',false],['inventory',2,'Use our sales history to forecast ingredient demand and plan stock purchases.',true]]){
  const id=name==='invoices'?invoiceBusiness:await business(trial,index);const {result,latency_seconds}=await run(trial,id,problem,web);firstRun??=result.run_id;
  assert.equal(result.synthetic,false);assert.ok(result.usage.model_calls>=1&&result.usage.model_calls<=5);assert.equal(result.quality_report.prompt_version,promptVersion);assert.equal(result.quality_report.model_id,'openai/gpt-4.1-mini');assert.equal(result.usage.search_calls,web?1:0);
  for(const tool of result.tools){const q=tool.quality;assert.ok(q);if(q.score!==null){assert.equal(q.assessment_status,'passed');assert.notEqual(tool.catalog_status,'provisional');assert.ok(q.evidence_ids.length>0);assert.ok(q.source_urls.length>0);assert.equal(q.score,Math.round((q.task_coverage_points+q.source_evidence_points+q.workflow_relevance_points)*10)/10);assert.ok(q.score>=0&&q.score<=100);for(const ref of q.evidence_ids){assert.ok(ref.startsWith(tool.tool_id+':e'));const claim=tool.evidence[Number(ref.split(':e')[1])];assert.ok(claim);assert.ok(q.source_urls.includes(claim.source_url));}}}
  const row={case:name,status:result.status,latency_seconds,usage:result.usage,quality_report:result.quality_report,tools:result.tools.map(t=>({tool_id:t.tool_id,name:t.name,catalog_status:t.catalog_status,quality:t.quality})),warnings:result.warnings};report.cases.push(row);console.log(JSON.stringify({case:name,status:row.status,tools:row.tools.length,scored:row.tools.filter(t=>t.quality.score!==null).length,usage:row.usage}));
  // This is a client-rendered route: HTTP can verify its shell, not execute React effects.
  if(result.tools.length){const tool=result.tools[0];const page=await fetch(base+'/tools/'+tool.tool_id+'?returnTo='+encodeURIComponent('/discovery/'+result.run_id),{headers:{Cookie:trial}});assert.equal(page.status,200);assert.ok((await page.text()).includes('Loading tool evidence'));}
 }
 const second=await session('trial');try{const denied=await request('/discovery/runs/'+firstRun,{cookie:second});assert.equal(denied.response.status,404);report.checks.push('Another trial cannot read the first trial run');}finally{await request('/trial/logout',{cookie:second,method:'POST'});}
 const unsupported=await run(trial,invoiceBusiness,'Physically carry heavy boxes from my truck into the warehouse.');assert.equal(unsupported.result.tools.length,0);assert.equal(unsupported.result.usage.search_calls,0);report.cases.push({case:'unsupported physical task',status:unsupported.result.status,usage:unsupported.result.usage,tools:[]});
 const capped=await request('/discovery/runs',{cookie:trial,body:{business_id:invoiceBusiness,problem_text:'Extract invoice details.'}});assert.equal(capped.response.status,429);report.checks.push('Fifth search rejected before paid work');
}finally{await request('/trial/logout',{cookie:trial,method:'POST'});}
const demo=await session('demo');try{const id=await business(demo,0);const {result}=await run(demo,id,'Answer incoming phone calls and book appointments.');assert.equal(result.synthetic,true);assert.equal(result.usage.model_calls,0);assert.equal(result.usage.search_calls,0);report.checks.push('Synthetic demo remains isolated and uses zero paid calls');}finally{await request('/demo/logout',{cookie:demo,method:'POST'});}
for(const url of [base,'https://3-92-95-188.sslip.io/']){const response=await fetch(url);assert.equal(response.status,200);report.checks.push(url+' returned HTTP 200');}
report.passed=true;const output=new URL('./evaluations/'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z-deployment.json',import.meta.url);writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('Passed. Report: '+fileURLToPath(output));
