import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccountHandlers } from '../lib/auth/handlers';
import { authClient,authConfig } from '../lib/auth/server';
import { defaults } from '../lib/assessment';
import { HttpError,loggedRoute } from '../lib/server/http';
import { logRecord } from '../lib/server/logger';
import { GET as sessionGET } from '../app/api/auth/session/route';
import { POST as loginPOST } from '../app/api/auth/login/route';
import { GET as profileGET } from '../app/api/account/profile/route';
const trace=()=>({requestId:'11111111-1111-4111-8111-111111111111',details:{}});
const request=(action:string,data:unknown,origin='http://localhost')=>new Request(`http://localhost/api/auth/${action}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
function fixtures(){
 const rows=new Map<string,{answers:unknown;updated_at:string}>();let owner='owner-a';let selectedOwner='';let passwordReceived='';
 const client={auth:{
  getUser:async()=>({data:{user:{id:owner,email:'owner@example.invalid'}},error:null}),
  signInWithPassword:async(data:{password:string})=>{passwordReceived=data.password;return {error:null};},
  signUp:async()=>({data:{session:null},error:null}),signOut:async()=>({error:null}),
 },from:()=>({select:()=>({eq:(_key:string,value:string)=>{selectedOwner=value;return {maybeSingle:async()=>({data:rows.get(value)??null,error:null})};}}),upsert:async(data:{user_id:string;answers:unknown})=>{rows.set(data.user_id,{answers:data.answers,updated_at:new Date().toISOString()});return {error:null};}})};
 const asClient=client as unknown as Awaited<ReturnType<typeof authClient>>;
 const handlers=createAccountHandlers({authConfig:()=>({url:'https://example.supabase.co',key:'publishable-placeholder'}),authClient:async()=>asClient,authenticated:async()=>({client:asClient,user:{id:owner} as never}),siteUrl:()=> 'http://localhost'});
 return {handlers,rows,owner:(value:string)=>{owner=value;},selected:()=>selectedOwner,password:()=>passwordReceived};
}
test('unconfigured auth gives explicit status and private APIs stay inaccessible',async()=>{
 const previous=[process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY];
 delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 try{
  assert.equal(authConfig(),null);
  const status=await sessionGET(new Request('http://localhost/api/auth/session'));assert.deepEqual(await status.json(),{configured:false,user:null});
  const login=await loginPOST(request('login',{email:'owner@example.invalid',password:'example-password'}));assert.equal(login.status,503);
  const profile=await profileGET(new Request('http://localhost/api/account/profile'));assert.equal(profile.status,503);
  assert.ok(login.headers.get('X-Request-Id'));assert.equal(login.headers.get('Cache-Control'),'no-store');
 }finally{for(const [i,key] of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'].entries()){if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];}}
});
test('auth mutations reject a different or absent Origin before credentials reach the provider',async()=>{
 const f=fixtures();await assert.rejects(()=>f.handlers.login(request('login',{email:'owner@example.invalid',password:'password123'},'https://elsewhere.invalid'),trace()),(e:unknown)=>e instanceof HttpError&&e.status===403);assert.equal(f.password(),'');
});
test('login validates credentials and returns no password/token payload',async()=>{
 const f=fixtures();await assert.rejects(()=>f.handlers.login(request('login',{email:'invalid',password:'x'}),trace()),(e:unknown)=>e instanceof HttpError&&e.status===400);
 const response=await f.handlers.login(request('login',{email:'owner@example.invalid',password:'password123'}),trace());assert.deepEqual(await response.json(),{ok:true});assert.equal(f.password(),'password123');
});
test('signup honestly requests confirmation rather than inventing a signed-in account',async()=>{
 const f=fixtures();const response=await f.handlers.signup(request('signup',{email:'owner@example.invalid',password:'password123'}),trace());assert.equal((await response.json()).confirmationRequired,true);
});
test('saved profile identity is server-verified and users query only their own row',async()=>{
 const f=fixtures();await f.handlers.saveProfile(request('profile',defaults),trace());assert.ok(f.rows.has('owner-a'));
 let response=await f.handlers.getProfile();assert.deepEqual((await response.json()).profile.answers,defaults);assert.equal(f.selected(),'owner-a');
 f.owner('owner-b');response=await f.handlers.getProfile();assert.equal((await response.json()).profile,null);assert.equal(f.selected(),'owner-b');
 await assert.rejects(()=>f.handlers.saveProfile(request('profile',{...defaults,user_id:'owner-a'}),trace()),(e:unknown)=>e instanceof HttpError&&e.status===400);assert.equal(f.rows.size,1);
});
test('log formatting drops arbitrary bodies, passwords, emails, tokens and raw errors',()=>{
 const record=logRecord('request_completed',{route:'/api/assess',status:200,durationMs:12,reasonCode:'invalid_input',password:'never-record',email:'owner@example.invalid',body:{problem:'private business text'},token:'secret-token',error:new Error('provider secret')} as never);
 const encoded=JSON.stringify(record);for(const value of ['never-record','owner@','private business text','secret-token','provider secret'])assert.ok(!encoded.includes(value));assert.equal(record.status,200);assert.equal(record.route,'/api/assess');
});
test('unexpected errors produce a safe response with a trace ID instead of raw provider text',async()=>{
 const route=loggedRoute('/api/test',()=>{throw Error('provider message with a private token');});const response=await route(new Request('http://localhost/api/test'));
 assert.equal(response.status,500);const text=await response.text();assert.ok(!text.includes('private token'));assert.ok(response.headers.get('X-Request-Id'));
});
test('auth attempt backstop is bounded',async()=>{
 const f=fixtures();for(let i=0;i<20;i++)await f.handlers.login(request('login',{email:'owner@example.invalid',password:'password123'}),trace());
 await assert.rejects(()=>f.handlers.login(request('login',{email:'owner@example.invalid',password:'password123'}),trace()),(e:unknown)=>e instanceof HttpError&&e.status===429);
});
