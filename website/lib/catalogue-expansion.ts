import records from '../data/catalogue-expansion.json';
import type { Tool, Category, Price, Plan } from './catalog';
export type Research = {
 sourceId:string; checkedAt:string; sourceTitle:string; evidenceSummary:string; smallBusinessFit:string;
 integrationNotes:string; limitations:string[]; pricingStatus:string; pricingNote:string;
 reviewScope:string; retrievalMethod:string; existingSoftware:string|null;
};
const colors:Record<Category,string>={marketing:'#e7dbf6',calls:'#e7efca',chat:'#dceaff',productivity:'#f6e5ca',operations:'#d6eeee',sales:'#e3e6fb',finance:'#e6ebd2'};
const outputCoverage:Record<string,('text'|'image'|'video')[]>={
 jasper:['text'],anyword:['text'],wordtune:['text'],quillbot:['text'],
 'adobe-express':['image','video'],photoroom:['image','video'],pixelcut:['image'],pebblely:['image'],flair:['image'],adcreative:['text','image','video'],creatopy:['image','video'],pencil:['image','video'],
 lumen5:['video'],invideo:['video'],pictory:['video'],descript:['video'],veed:['video'],kapwing:['video'],runway:['video'],synthesia:['video'],heygen:['video'],opusclip:['video'],
 hootsuite:['text','image'],socialbee:['text'],ocoya:['text','image','video'],publer:['text'],metricool:['text'],flick:['text'],contentstudio:['text'],
};
function plansFor(id:string,note:string):Plan[]{
 if(id==='wordtune')return [{id:'wordtune-basic',name:'Basic',price:{monthly:0,freeOngoing:true,allowanceUnknown:true,label:'Free · limited daily AI use',note},capabilities:{text:'yes',schedule:'unknown'}}];
 if(id==='rosie')return [{id:'rosie-professional',name:'Professional',price:{monthly:49,unit:'minutes',included:250,extraUnknown:true,label:'$49 / month',note},capabilities:{capture:'yes',faq:'yes',booking:'no',request:'unknown'}},{id:'rosie-scale',name:'Scale',price:{monthly:149,unit:'minutes',included:1000,extraUnknown:true,label:'$149 / month',note:'1,000 minutes/month; direct calendar booking listed, but exact calendar support and extra-minute rate need checking.'},capabilities:{capture:'yes',faq:'yes',booking:'yes',request:'unknown'}}];
 if(id==='photoroom')return [{id:'photoroom-pro',name:'Pro · annual billing',price:{monthly:7.5,requiresAnnual:true,extraUnknown:true,label:'$7.50 / month · annual billing',note},capabilities:{image:'yes',text:'unknown',video:'no',schedule:'unknown'}}];
 const price:Price={monthly:null,label:'AI plan price needs checking',note};
 return [{id:`${id}-research`,name:'Product research · plan not confirmed',price,capabilities:{}}];
}
function checklist(name:string,category:Category):string[]{
 return [`Open ${name}’s official product page and confirm that the described AI feature solves your specific task.`,
 'Check the AI-eligible plan, currency, billing commitment, included usage, overages and any required base subscription before signing up.',
 category==='calls'?'Ask the provider about your carrier, call forwarding, human handoff and the exact booking action; test with a temporary route first.':category==='chat'?'Confirm the actual channel: website chat, email and social messaging are different. Check knowledge sources and human handoff.':category==='finance'?'Identify who will review the output and approve accounting changes. Check the supported accounting edition and import/export route.':'Confirm the exact app connection or export route you need; a generic integration logo is not proof of a supported action.',
 'Use a small fictional example to check correctness, required permissions and time spent correcting the result before using real business data.'];
}
export const expandedTools:Tool[]=records.map(record=>{
 const category=record.category as Category;const research:Research={sourceId:record.sourceId,checkedAt:record.checkedAt,sourceTitle:record.sourceTitle,evidenceSummary:record.evidenceSummary,smallBusinessFit:record.smallBusinessFit,integrationNotes:record.integrationNotes,limitations:record.limitations,pricingStatus:record.pricingStatus,pricingNote:record.pricingNote,reviewScope:record.reviewScope,retrievalMethod:record.retrievalMethod,existingSoftware:record.existingSoftware};
 const isPlan=record.reviewLevel==='plan';
 return {id:record.id,name:record.name,task:category,monogram:record.name.replace(/[^a-z]/gi,'').slice(0,2),color:colors[category],tagline:record.description,description:record.description,
  reviewLevel:isPlan?'plan':'product',assessmentTasks:record.assessmentTasks as Tool['assessmentTasks'],assessmentOutputs:outputCoverage[record.id],research,
  sources:[{label:'Official product documentation',url:record.sourceUrl},...('pricingUrl'in record?[{label:'Official pricing · selected details reviewed',url:record.pricingUrl as string}]:[])],
  plans:plansFor(record.id,record.pricingNote),steps:checklist(record.name,category),
  test:category==='finance'?'Use a made-up document or sandbox. Have the responsible person review extracted values and any suggested accounting action.':category==='productivity'?'Try a non-sensitive sample. For meeting tools, get permission first and check transcript accuracy and recording settings.':'Test one fictional example and review the output, permissions and human fallback. No account-level test was performed for this catalogue.',
  rollback:'This is a pre-setup research checklist. No account or connection has been created here. Before a real trial, establish the provider’s cancellation, disconnect and data-removal steps.',
  caveat:record.limitations.join(' ')};
});
