import type { Answers } from './assessment';
import { tools, CATALOG_VERSION, type Capability, type Plan, type Tool } from './catalog';
export const RULES_VERSION='1.1.0';
export type Criterion={label:string;points:number;max:number;reason:string;known:boolean};
export type Match={toolId:string;planId:string;status:'suitable'|'check'|'excluded';score:number|null;criteria:Criterion[];reasons:string[];checks:string[];cost:number|null;costLabel:string;existing:boolean};
export type AssessmentResult={catalogVersion:string;rulesVersion:string;suitable:Match[];check:Match[];excluded:Match[];message:string|null};
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
function evaluate(a:Answers,tool:Tool,plan:Plan):Match {
 const reasons:string[]=[], checks:string[]=[], failures:string[]=[];
 if(tool.reviewLevel==='product')checks.push('Product features were reviewed, but the AI-eligible plan and required capabilities are not confirmed.');
 const requireCapability=(key:Capability,label:string)=>{
  const state=plan.capabilities[key]??'unknown';
  if(state==='no') failures.push(`${label} is not supported on this plan.`);
  else if(state==='unknown') checks.push(`Confirm ${label.toLowerCase()} on this exact plan.`);
  return state==='yes';
 };
 const existing=a.software.toLowerCase().includes(tool.name.toLowerCase()) || (tool.existingOnly!==undefined && a.software.toLowerCase().includes(tool.existingOnly));
 if(tool.existingOnly && !existing) {
  if(a.software.toLowerCase()==='not sure') checks.push('Confirm whether you already use Housecall Pro.');
  else failures.push('Requires an existing Housecall Pro subscription.');
 }
 let taskKnown=false, channelPoints=0,channelKnown=false,workflowKnown=false;
 if(a.task==='marketing') {
  if(a.output==='unknown') checks.push('Choose a required output before confirming a fit.');
  else if(a.output==='email') failures.push('Email-only workflows are outside this catalogue.');
  else taskKnown=requireCapability(a.output,`AI ${a.output} output`);
  if(a.publishing==='unknown') checks.push('Confirm whether manual publishing is acceptable.');
  else if(a.publishing==='schedule') {
   const scheduler=requireCapability('schedule','Scheduling');
   if(a.channel==='facebook'||a.channel==='instagram') {channelKnown=requireCapability(a.channel,`${a.channel} publishing`);channelPoints=channelKnown&&scheduler?25:0;}
   else if(a.channel==='print') failures.push('Social scheduling cannot publish printed materials.');
   else checks.push('Confirm support for the exact publishing channel and account type.');
   workflowKnown=scheduler;
  } else {
   channelKnown=a.channel!=='unknown'; channelPoints=channelKnown?((a.channel==='facebook'||a.channel==='instagram')&&plan.capabilities[a.channel]==='yes'?25:12.5):0;
   workflowKnown=true;
   if(!channelKnown) checks.push('Choose a destination so the manual output can be checked.');
  }
 } else {
  if(a.action==='unknown') checks.push('Choose what the enquiry tool must do.');
  else taskKnown=requireCapability(a.action,`${a.action==='booking'?'Confirmed appointment booking':a.action==='capture'?'Enquiry capture':a.action==='faq'?'FAQ answers':'Appointment requests'}`);
  channelKnown=true;channelPoints=25;
  if(a.destination==='manual') workflowKnown=true;
  else if(a.destination==='unknown') checks.push('Confirm where enquiry details or bookings should go.');
  else if(a.destination==='other') checks.push(`Confirm the required ${a.integrationName||'named software'} connection and exact action.`);
  else workflowKnown=requireCapability(a.destination,`${a.destination} integration`);
  if(a.action==='booking'&&a.destination==='manual') checks.push('Confirmed booking needs a named booking system and tested appointment action.');
 }
 const p=plan.price;
 if((p.annual||p.requiresAnnual)&&!a.annual) failures.push('Requires an annual payment you have not accepted.');
 let cost:number|null=p.monthly;
 let costKnown=cost!==null&&!p.extraUnknown;
 if(p.unit) {
  if(a.volume===null||a.volumeUnit!==p.unit){costKnown=false;checks.push(`Usage is billed in ${p.unit}; your matching monthly volume is not known.`);}
  else if(p.included!==undefined&&a.volume>p.included){
   if(p.overage!==undefined&&cost!==null) cost+= (a.volume-p.included)*p.overage;
   else {costKnown=false;checks.push('Cost above the included allowance is not established.');}
  }
 }
 if(p.extraUnknown){checks.push('Confirm mandatory fees, usage charges and the relevant allowance.');}
 if(a.task==='marketing'&&a.volume!==null&&a.volume>1&&(['buffer','canva'].includes(tool.id)||p.allowanceUnknown)){
  costKnown=false; checks.push('Confirm that the AI generation allowance covers your planned monthly output.');
 }
 if(a.budget==='free') {
  if(p.freeOngoing===false || (cost!==null&&cost>0)) failures.push('Not an ongoing free plan for this usage.');
  else if(p.freeOngoing!==true){costKnown=false;checks.push('An ongoing free AI entitlement is not established.');}
  else if(p.overage!==undefined) {costKnown=false;checks.push('Confirm a hard stop before paid overages; a free base price is not a spending cap.');}
 }
 if(a.budget==='amount'&&a.monthlyBudget!==null&&cost!==null&&cost>a.monthlyBudget) failures.push(`The known price ${money(cost)}/month exceeds your budget.`);
 if(a.budget!=='unknown'&&!costKnown) checks.push('The relevant ongoing total is not confirmed within your budget.');
 // Unknown price does not block a budget-unspecified shortlist, but remains visible.
 const nonBlockingCostChecks=a.budget==='unknown';
 const blocking=checks.filter(c=>!(nonBlockingCostChecks&&(c.startsWith('Usage is billed')||c.startsWith('Cost above')||c.startsWith('Confirm mandatory fees')||c.startsWith('Confirm that the AI generation'))));
 const budgetPoints=a.budget==='unknown'?0:costKnown?20:0;
 const criteria:Criterion[]=[
  {label:'Task',points:taskKnown?40:0,max:40,known:taskKnown,reason:taskKnown?'Requested action is documented.':'Requested action is not confirmed.'},
  {label:'Channel',points:channelPoints,max:25,known:channelKnown,reason:channelPoints===25?'Exact channel is documented.':channelPoints>0?'You accept a manual copy/download route.':'Exact destination is not confirmed.'},
  {label:'Budget',points:budgetPoints,max:20,known:a.budget!=='unknown'&&costKnown,reason:a.budget==='unknown'?'Budget is not specified.':costKnown?'Relevant known price fits your stated budget.':'Relevant total or allowance needs checking.'},
  {label:'Workflow',points:workflowKnown?15:0,max:15,known:workflowKnown,reason:workflowKnown?(a.task==='marketing'&&a.publishing==='manual'||a.task!=='marketing'&&a.destination==='manual'?'You accept a manual handoff.':'Required workflow is documented.'):'Required workflow needs confirmation.'},
 ];
 if(taskKnown) reasons.push(a.task==='marketing'?`Supports your requested ${a.output} workflow.`:`Documents ${a.action==='capture'?'enquiry capture':a.action==='booking'?'booking':a.action==='faq'?'FAQ responses':'appointment requests'}.`);
 if(existing) reasons.push('Relevant to software you already use.');
 if(a.budget==='unknown')checks.push('Set a budget before deciding whether this is affordable.');
 if(a.task!=='marketing')checks.push('Verify carrier/site compatibility and any external setup charges before buying.');
 const status=failures.length?'excluded':blocking.length?'check':'suitable';
 const displayCost=costKnown?cost:null;
 return {toolId:tool.id,planId:plan.id,status,score:status==='suitable'?criteria.reduce((sum,c)=>sum+c.points,0):null,criteria,reasons:failures.length?failures:reasons,checks:[...new Set(checks)],cost:displayCost,costLabel:costKnown&&cost!==null?`${money(cost)}/month${p.annual||p.requiresAnnual?' equivalent · annual payment required':''} for the stated usage`:p.label,existing};
}
export function assess(a:Answers):AssessmentResult {
 const response:AssessmentResult={catalogVersion:CATALOG_VERSION,rulesVersion:RULES_VERSION,suitable:[],check:[],excluded:[],message:null};
 if(a.task==='other'||a.task==='marketing'&&a.output==='email') return {...response,message:'This first version covers phone enquiries, website enquiries and social content. We do not have enough evidence to recommend a tool for this task yet.'};
 const order=(a:Match,b:Match)=>(b.score??-1)-(a.score??-1)||(a.cost??Infinity)-(b.cost??Infinity)||a.planId.localeCompare(b.planId);
 for(const tool of tools.filter(t=>(t.assessmentTasks?t.assessmentTasks.includes(a.task as 'calls'|'chat'|'marketing'):t.task===a.task)&&(!(a.task==='marketing'&&a.output!=='unknown'&&a.output!=='email')||!t.assessmentOutputs||t.assessmentOutputs.includes(a.output)))){
  const plans=tool.plans.map(plan=>evaluate(a,tool,plan));
  const suitable=plans.filter(p=>p.status==='suitable').sort(order);
  const check=plans.filter(p=>p.status==='check').sort((a,b)=>a.checks.length-b.checks.length||a.planId.localeCompare(b.planId));
  const best=suitable[0]??check[0]??plans.sort((a,b)=>a.planId.localeCompare(b.planId))[0];
  if(best) response[best.status==='suitable'?'suitable':best.status==='check'?'check':'excluded'].push(best);
 }
 response.suitable.sort((a,b)=>order(a,b)||a.toolId.localeCompare(b.toolId));
 response.check.sort((a,b)=>a.checks.length-b.checks.length||a.toolId.localeCompare(b.toolId));
 return response;
}
