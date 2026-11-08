import { z } from 'zod';
import { NextResponse } from 'next/server';
import { authClient as realClient,authConfig as realConfig,authenticated as realAuthenticated,siteUrl as realSiteUrl } from './server';
import { readJSON,requireSameOrigin,HttpError,type Trace } from '../server/http';
import { logEvent } from '../server/logger';
import { assessmentSchema } from '../assessment';
type Dependencies={authClient:typeof realClient;authConfig:typeof realConfig;authenticated:typeof realAuthenticated;siteUrl:typeof realSiteUrl};
export function createAccountHandlers(deps:Dependencies={authClient:realClient,authConfig:realConfig,authenticated:realAuthenticated,siteUrl:realSiteUrl}){
const {authClient,authConfig,authenticated,siteUrl}=deps;
const credentials=z.object({email:z.email().max(254),password:z.string().min(8).max(128)}).strict();
// Local per-process backstop; Supabase's own account/IP controls are also required.
const attempts=new Map<string,{count:number;until:number}>();
function authLimit(action:string){const now=Date.now();const item=attempts.get(action);if(!item||item.until<=now){attempts.set(action,{count:1,until:now+60000});return;}if(item.count>=20)throw new HttpError(429,'Too many account attempts. Please wait a minute.','rate_limited');item.count++;}
async function session(){
 if(!authConfig())return NextResponse.json({configured:false,user:null});
 const client=await authClient();const {data,error}=await client.auth.getUser();
 if(error||!data.user)return NextResponse.json({configured:true,user:null});
 return NextResponse.json({configured:true,user:{id:data.user.id,email:data.user.email??null}});
}
async function login(request:Request,trace:Trace){
 requireSameOrigin(request);authLimit('login');const parsed=credentials.safeParse(await readJSON(request,3000));
 if(!parsed.success)throw new HttpError(400,'Enter a valid email and a password of 8–128 characters.');
 const client=await authClient();const {error}=await client.auth.signInWithPassword(parsed.data);
 if(error)throw new HttpError(error.status===429?429:401,error.status===429?'Too many sign-in attempts. Try again later.':'Sign-in failed. Check your details and confirm your email.','provider_rejected');
 logEvent('auth_login',{requestId:trace.requestId,status:200});return NextResponse.json({ok:true});
}
async function signup(request:Request,trace:Trace){
 requireSameOrigin(request);authLimit('signup');const parsed=credentials.safeParse(await readJSON(request,3000));
 if(!parsed.success)throw new HttpError(400,'Enter a valid email and a password of 8–128 characters.');
 const client=await authClient();const {data,error}=await client.auth.signUp({...parsed.data,options:{emailRedirectTo:`${siteUrl()}/auth/callback`}});
 if(error)throw new HttpError(error.status===429?429:400,error.status===429?'Account email limit reached. Please try later.':'Account creation could not be completed. Please try again.','provider_rejected');
 logEvent('auth_signup',{requestId:trace.requestId,status:200});return NextResponse.json({ok:true,confirmationRequired:!data.session,message:'If this address can be registered, check your inbox to confirm it. If you already have an account, sign in.'});
}
async function logout(request:Request,trace:Trace){
 requireSameOrigin(request);const client=await authClient();const {error}=await client.auth.signOut({scope:'local'});
 if(error)throw new HttpError(503,'Sign-out could not be completed. Please try again.','provider_rejected');
 logEvent('auth_logout',{requestId:trace.requestId,status:200});return NextResponse.json({ok:true});
}
async function getProfile(){
 const {client,user}=await authenticated();
 const {data,error}=await client.from('business_profiles').select('answers,updated_at').eq('user_id',user.id).maybeSingle();
 if(error)throw new HttpError(503,'Saved profiles are unavailable. Check the database migration.','provider_rejected');
 const parsed=data?assessmentSchema.safeParse(data.answers):null;
 if(parsed&&!parsed.success)throw new HttpError(409,'The saved assessment format is outdated. Please create a new assessment.');
 return NextResponse.json({profile:parsed?.success?{answers:parsed.data,updatedAt:data!.updated_at}:null});
}
async function saveProfile(request:Request,trace:Trace){
 requireSameOrigin(request);const {client,user}=await authenticated();
 const parsed=assessmentSchema.safeParse(await readJSON(request));if(!parsed.success)throw new HttpError(400,'Please check the assessment before saving.');
 const {error}=await client.from('business_profiles').upsert({user_id:user.id,answers:parsed.data},{onConflict:'user_id'});
 if(error)throw new HttpError(503,'The profile could not be saved. Check the database migration.','provider_rejected');
 logEvent('profile_saved',{requestId:trace.requestId,status:200});return NextResponse.json({ok:true});
}

return {session,login,signup,logout,getProfile,saveProfile};
}
export const {session,login,signup,logout,getProfile,saveProfile}=createAccountHandlers();
