import { z } from 'zod';
import questionnaire from '../../data/onboarding-spec.json';
import { locationLabel } from './locations';
export const spec=questionnaire;
export const priorities=questionnaire.questions.find(q=>q.id==='Q7')!.options!;
export const channels=questionnaire.questions.find(q=>q.id==='Q9')!.options!;
export const priorityLabels:Record<string,string>=questionnaire.questions.find(q=>q.id==='Q7')!.option_labels!;
export const capabilityLabels:Record<string,string>={ai_voice_receptionist:'Answer phone calls',lead_capture:'Capture new customer requests',automated_followup:'Follow up with customers',appointment_scheduling:'Book appointments',quote_generation:'Prepare quotes',demand_forecasting:'Forecast demand',inventory_optimization:'Plan stock and purchasing',invoice_automation:'Handle invoices',marketing_content:'Create marketing content',customer_support_chat:'Answer questions through chat',workflow_automation:'Connect repetitive tasks'};
const customerLabels:Record<string,string>=Object.fromEntries(['b2c','b2b','both','government','other'].map((id,i)=>[id,questionnaire.questions.find(q=>q.id==='Q3')!.options![i]]));
const teamLabels:Record<string,string>=Object.fromEntries(['solo','2_10','11_50','51_250','250_plus'].map((id,i)=>[id,questionnaire.questions.find(q=>q.id==='Q4')!.options![i]]));
const budgetLabels:Record<string,string>=Object.fromEntries(['free','under_50','50_150','150_500','over_500','unknown'].map((id,i)=>[id,questionnaire.questions.find(q=>q.id==='Q8')!.options![i]]));
export const profileSchema=z.object({
 industry:z.object({category:z.string().trim().min(1).max(100),subtype:z.string().trim().min(1).max(100),raw_custom:z.string().max(100).nullable().optional()}),
 business_description:z.string().trim().min(1).max(500),customer_type:z.enum(['b2c','b2b','both','government','other']).nullable().default(null),customer_description:z.string().trim().max(300).nullable().default(null),employee_band:z.enum(['solo','2_10','11_50','51_250','250_plus']),
 operating_region:z.object({country:z.string().regex(/^[A-Za-z]{2}$/).transform(v=>v.toUpperCase()),region:z.string().max(100).nullable().default(null)}),
 existing_software_status:z.enum(['selected','none','unknown']),existing_software:z.array(z.object({raw_name:z.string().trim().min(1).max(100),canonical_id:z.string().nullable().optional()})).max(30),
 improvement_priorities:z.array(z.string()).max(3).default([]),monthly_budget_band:z.enum(['free','under_50','50_150','150_500','over_500','unknown']).nullable().default(null),customer_contact_channels:z.array(z.string()).max(8).nullable().default(null),
}).strict().superRefine((p,c)=>{
 if((p.existing_software_status==='selected')!==!!p.existing_software.length)c.addIssue({code:'custom',path:['existing_software'],message:'Choose software, None, or Not sure exclusively.'});
 if(new Set(p.existing_software.map(s=>s.raw_name.toLowerCase())).size!==p.existing_software.length)c.addIssue({code:'custom',path:['existing_software'],message:'Remove duplicate software.'});
 if(p.improvement_priorities.some(x=>!priorities.includes(x))||p.improvement_priorities.includes('Not sure yet')&&p.improvement_priorities.length>1)c.addIssue({code:'custom',path:['improvement_priorities'],message:'Choose up to three priorities; Not sure yet is exclusive.'});
});
export type Profile=z.infer<typeof profileSchema>;
export const blankProfile={industry:{category:'',subtype:''},business_description:'',customer_type:null,customer_description:null,employee_band:'',operating_region:{country:'',region:null},existing_software_status:'',existing_software:[],improvement_priorities:[],monthly_budget_band:null,customer_contact_channels:null};
export const BUSINESS_KEY='bizzimpact-phase1-business';
export const profileSummary=(p:Profile)=>[`${p.industry.category} · ${p.industry.subtype}`,p.business_description,`Team size: ${teamLabels[p.employee_band]??p.employee_band}`,`Region: ${locationLabel(p.operating_region.country,p.operating_region.region)}`,`Software: ${p.existing_software_status==='selected'?p.existing_software.map(s=>s.raw_name).join(', '):p.existing_software_status==='none'?'None':'Not sure'}`,`Priorities: ${p.improvement_priorities.map(v=>priorityLabels[v]??v).join(', ')||'Not provided'}`,`Budget: ${p.monthly_budget_band?budgetLabels[p.monthly_budget_band]:'Not provided'}`,`Customers: ${p.customer_description||customerLabels[p.customer_type??'']||'Not provided'}`];
