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
export function requireSameOrigin(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)throw new HttpError(403,'Please submit this action from the website.','origin_rejected');
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
