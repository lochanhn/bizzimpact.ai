// Allowlisted diagnostics. Never accept request bodies, free text or raw errors.
export type Event='request_completed'|'request_failed'|'auth_login'|'auth_signup'|'auth_logout'|'profile_saved';
export type LogFields={requestId?:string;route?:string;status?:number;durationMs?:number;reasonCode?:'internal_error'|'invalid_input'|'not_configured'|'not_authenticated'|'provider_rejected'|'rate_limited'|'origin_rejected';catalogVersion?:string;rulesVersion?:string;suitableCount?:number;checkCount?:number;excludedCount?:number;model?:string;inputTokens?:number;outputTokens?:number;costUsd?:number};
const textKeys=new Set(['requestId','route','catalogVersion','rulesVersion','model']);
const numberKeys=new Set(['status','durationMs','suitableCount','checkCount','excludedCount','inputTokens','outputTokens','costUsd']);
const reasonCodes=new Set(['internal_error','invalid_input','not_configured','not_authenticated','provider_rejected','rate_limited','origin_rejected']);
export function logRecord(event:Event,fields:LogFields){
 const safe:Record<string,unknown>={timestamp:new Date().toISOString(),event};
 for(const [key,value] of Object.entries(fields)){
  if(textKeys.has(key)&&typeof value==='string'&&/^[a-zA-Z0-9_./:\-]{1,140}$/.test(value))safe[key]=value;
  if(numberKeys.has(key)&&typeof value==='number'&&Number.isFinite(value)&&value>=0)safe[key]=value;
  if(key==='reasonCode'&&typeof value==='string'&&reasonCodes.has(value))safe[key]=value;
 }
 return safe;
}
export function logEvent(event:Event,fields:LogFields){if(process.env.NODE_ENV!=='test')console.info(JSON.stringify(logRecord(event,fields)));}
