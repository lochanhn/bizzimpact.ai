import { loggedRoute } from '@/lib/server/http';
import { signup } from '@/lib/auth/handlers';
import { cookies } from 'next/headers';
export const POST=loggedRoute('/api/auth/signup',async(request,trace)=>{const response=await signup(request,trace);const jar=await cookies();jar.delete('bizzimpact-demo-session');jar.delete('bizzimpact-trial-session');return response;});
