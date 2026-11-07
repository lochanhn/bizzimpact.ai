import { z } from 'zod';

export const assessmentSchema = z.object({
  business: z.enum(['cafe', 'hvac', 'landscaping', 'other']),
  task: z.enum(['calls', 'chat', 'marketing', 'other']),
  problem: z.string().max(1000).default(''),
  software: z.string().trim().max(120).default('Not sure'),
  budget: z.enum(['free', 'amount', 'unknown']),
  monthlyBudget: z.number().finite().min(0).max(100000).nullable().default(null),
  annual: z.boolean().default(false),
  action: z.enum(['capture', 'faq', 'request', 'booking', 'unknown']).default('capture'),
  destination: z.enum(['manual', 'google', 'outlook', 'calendly', 'other', 'unknown']).default('manual'),
  integrationName: z.string().trim().max(100).default(''),
  output: z.enum(['text', 'image', 'video', 'email', 'unknown']).default('text'),
  channel: z.enum(['facebook', 'instagram', 'other', 'print', 'unknown']).default('facebook'),
  publishing: z.enum(['manual', 'schedule', 'unknown']).default('manual'),
  volume: z.number().finite().int().min(0).max(1000000).nullable().default(null),
  volumeUnit: z.enum(['calls', 'minutes', 'customers', 'conversations', 'pieces', 'unknown']).default('unknown'),
}).strict().superRefine((value, ctx) => {
  if (value.budget === 'amount' && value.monthlyBudget === null) ctx.addIssue({code:'custom', path:['monthlyBudget'], message:'Enter your monthly budget.'});
  if (value.task === 'marketing' && value.volume !== null && !['pieces','unknown'].includes(value.volumeUnit)) ctx.addIssue({code:'custom', path:['volumeUnit'], message:'Marketing volume must be pieces or unknown.'});
  if (value.task === 'calls' && value.volume !== null && !['calls','minutes','customers','unknown'].includes(value.volumeUnit)) ctx.addIssue({code:'custom', path:['volumeUnit'], message:'Use calls, minutes or unique customers.'});
  if (value.task === 'chat' && value.volume !== null && !['conversations','unknown'].includes(value.volumeUnit)) ctx.addIssue({code:'custom', path:['volumeUnit'], message:'Use chat conversations.'});
});
export type Answers = z.infer<typeof assessmentSchema>;
export const defaults: Answers = {
  business:'cafe', task:'marketing', problem:'', software:'None', budget:'unknown', monthlyBudget:null, annual:false,
  action:'capture', destination:'manual', integrationName:'', output:'text', channel:'facebook', publishing:'manual', volume:null, volumeUnit:'unknown',
};
export const businessLabels = { cafe:'Cafe or restaurant', hvac:'HVAC services', landscaping:'Landscaping', other:'Another business' };
export const taskLabels = { calls:'Missed phone calls', chat:'Website enquiries', marketing:'Marketing content', other:'Another problem' };
export function summaryLines(a: Answers): string[] {
  const budget = a.budget==='free'?'Free only':a.budget==='unknown'?'Not sure':`$${a.monthlyBudget}/month`;
  return [businessLabels[a.business], taskLabels[a.task], `Current software: ${a.software}`, `Budget: ${budget}; annual payment ${a.annual?'accepted':'not accepted'}`,
    ...(a.task==='marketing'?[`Output: ${a.output}; destination: ${a.channel}`,`Publishing: ${a.publishing}`]:[`Action: ${a.action}`, `Handoff: ${a.destination}${a.integrationName?` (${a.integrationName})`:''}`]),
    `Volume: ${a.volume===null?'Not sure':`${a.volume} ${a.volumeUnit}/month`}`];
}
