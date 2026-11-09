import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { logEvent, type LogFields } from './logger';
export class HttpError extends Error{constructor(public status:number,message:string,public reasonCode:LogFields['reasonCode']='invalid_input'){super(message);}}
export async function readJSON(request:Request,maxBytes=16000):Promise<unknown>{
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new HttpError(415,'Send a JSON request.');
 const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
 if(reader)try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maxBytes){await reader.cancel();throw new HttpError(413,'This request is too large.');}chunks.push(part.value);}}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'The request could not be read.');}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'The request could not be read.');}
}
const LOOPBACK=new Set(['localhost','127.0.0.1','[::1]']);
function sameLoopback(a:string,b:string){try{const x=new URL(a),y=new URL(b);return x.protocol===y.protocol&&x.port===y.port&&LOOPBACK.has(x.hostname)&&LOOPBACK.has(y.hostname);}catch{return false;}}
export function requireSameOrigin(request:Request){
 let expectedOrigin=new URL(request.url).origin;
 // TLS ends at the proxy, so the internal request URL may be HTTP.
 // Use the configured public origin rather than trusting forwarded headers.
 if(process.env.NODE_ENV==='production'){
  try{const site=new URL(process.env.SITE_URL??'');if(site.protocol!=='https:'||site.username||site.password)throw new Error();expectedOrigin=site.origin;}
  catch{throw new HttpError(503,'Configure an HTTPS SITE_URL before accepting submissions.','not_configured');}
 }
 const origin=request.headers.get('origin');
 if(origin===expectedOrigin)return;
 // Development only: localhost, 127.0.0.1 and [::1] are the same machine (same protocol and port).
 if(process.env.NODE_ENV!=='production'&&origin&&sameLoopback(origin,expectedOrigin))return;
 throw new HttpError(403,'Please submit this action from the website.','origin_rejected');
}
export type Trace={requestId:string;details:LogFields};
export function loggedRoute(route:string,handler:(request:Request,trace:Trace)=>Promise<Response>|Response){
 return async(request:Request)=>{
  const started=performance.now();const trace:Trace={requestId:randomUUID(),details:{}};let response:Response;
  try{response=await handler(request,trace);}catch(error){
   const known=error instanceof HttpError;
   response=NextResponse.json({error:known?error.message:'Something went wrong. Please try again.',requestId:trace.requestId},{status:known?error.status:500});
   trace.details.reasonCode=known?error.reasonCode:'internal_error';
  }
  response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Request-Id',trace.requestId);response.headers.set('Cache-Control','no-store');
  logEvent(response.status>=500?'request_failed':'request_completed',{...trace.details,requestId:trace.requestId,route,status:response.status,durationMs:Math.round(performance.now()-started)});
  return response;
 };
}
