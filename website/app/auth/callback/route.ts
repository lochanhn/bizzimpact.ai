import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authClient,siteUrl } from '@/lib/auth/server';
import { loggedRoute,HttpError } from '@/lib/server/http';
export const GET=loggedRoute('/auth/callback',async request=>{
 const code=new URL(request.url).searchParams.get('code');
 if(!code||code.length>2048)throw new HttpError(400,'The sign-in link is invalid. Return to /auth and try again.');
 const client=await authClient();const {error}=await client.auth.exchangeCodeForSession(code);
 if(!error)(await cookies()).delete('bizzimpact-demo-session');
 return NextResponse.redirect(new URL(error?'/auth?error=confirmation':'/dashboard',siteUrl()));
});
