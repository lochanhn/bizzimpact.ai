import { tools } from '../lib/catalog';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { v5 } from './uuid-v5';
const map:Record<string,string>={capture:'lead_capture',booking:'appointment_scheduling',text:'marketing_content',image:'marketing_content',video:'marketing_content'};
const entries=tools.map(tool=>{
 const featureSource=tool.sources.find(s=>/workflow|product|documentation|Magic Write/i.test(s.label))??tool.sources[0];
 const caps=new Set<string>();if(tool.task==='calls')caps.add('ai_voice_receptionist');if(tool.task==='chat')caps.add('customer_support_chat');
 if(tool.task==='marketing'&&(!tool.assessmentTasks||tool.assessmentTasks.includes('marketing')))caps.add('marketing_content');
 if(tool.task==='operations')caps.add('workflow_automation');if(['dext','vic','ramp'].includes(tool.id))caps.add('invoice_automation');
 for(const plan of tool.plans)for(const [key,value] of Object.entries(plan.capabilities))if(value==='yes'&&map[key])caps.add(map[key]);
 const evidence=[{claim_key:'ai_feature',claim_value:tool.description,source_url:featureSource.url,observed_at:'2026-11-07T12:00:00Z',verification_state:'vendor_documented'},...Array.from(caps).map(cap=>({claim_key:'capability',claim_value:cap,source_url:featureSource.url,observed_at:'2026-11-07T12:00:00Z',verification_state:'vendor_documented'}))];
 for(const p of tool.plans)if(p.price.monthly!==null){const source=tool.sources.find(s=>/pricing|plans/i.test(s.label))??tool.sources[0];evidence.push({claim_key:'pricing',claim_value:JSON.stringify({plan:p.name,base_monthly_usd:p.price.monthly,annual_commitment:!!(p.price.annual||p.price.requiresAnnual),note:p.price.note}),source_url:source.url,observed_at:'2026-11-07T12:00:00Z',verification_state:'vendor_documented'});}
 return {tool_id:v5(tool.id),slug:tool.id,name:tool.name,official_url:featureSource.url,short_description:tool.description,ai_classification:'ai_enabled',catalog_status:'seeded',matched_capabilities:Array.from(caps),retrieval_channels:['catalog'],discovery_status:'candidate',evidence,issues:[tool.caveat,'Vendor documentation is not an independent product test.','Specific integrations and total price require checking.'],synthetic:false};
});
writeFileSync(resolve(import.meta.dirname,'../../backend/data/researched-catalog.json'),JSON.stringify(entries,null,2)+'\n');
writeFileSync(resolve(import.meta.dirname,'../data/discovery-catalog.json'),JSON.stringify(entries,null,2)+'\n');
console.log(`Exported ${entries.length} evidence-linked discovery records without scores.`);
