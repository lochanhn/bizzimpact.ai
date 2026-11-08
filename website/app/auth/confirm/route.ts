import { NextResponse } from 'next/server';
import { authClient } from '@/lib/auth/server';
import { loggedRoute,HttpError } from '@/lib/server/http';
export const GET=loggedRoute('/auth/confirm',async request=>{
 const url=new URL(request.url),token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
 if(!token_hash||token_hash.length<16||token_hash.length>512||!['email','signup'].includes(type??''))throw new HttpError(400,'The confirmation link is invalid. Return to /auth and try again.');
 const client=await authClient();const {error}=await client.auth.verifyOtp({token_hash,type:type as 'email'|'signup'});
 return NextResponse.redirect(new URL(error?'/auth?error=confirmation':'/dashboard',request.url));
});
