import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { HttpError } from '../server/http';
export function authConfig(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
 if(!url||!key)return null;
 try{if(new URL(url).protocol!=='https:')return null;}catch{return null;}
 return {url,key};
}
// Route Handlers only: all session refreshes can write their outgoing cookies.
// No browser SDK is used, so the auth cookies can be HttpOnly.
export async function authClient(){
 const config=authConfig();if(!config)throw new HttpError(503,'Accounts are not connected yet. Follow the Supabase setup instructions, or continue as a guest.','not_configured');
 const store=await cookies();
 return createServerClient(config.url,config.key,{
  global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(12000)})},
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll:()=>store.getAll(),setAll:values=>{for(const {name,value,options} of values)store.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});}},
 });
}
export async function authenticated(){
 const client=await authClient();const {data,error}=await client.auth.getUser();
 if(error||!data.user)throw new HttpError(401,'Sign in to open your saved workspace.','not_authenticated');
 return {client,user:data.user};
}
export function siteUrl(){
 const value=process.env.SITE_URL??(process.env.NODE_ENV!=='production'?'http://localhost:3000':null);
 if(!value)throw new HttpError(503,'Configure SITE_URL before creating accounts.','not_configured');
 const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new HttpError(503,'SITE_URL is not configured correctly.','not_configured');
 if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new HttpError(503,'SITE_URL must use HTTPS in production.','not_configured');
 return url.origin;
}
