import { cookies } from 'next/headers';
import { loggedRoute } from '@/lib/server/http';
import { login } from '@/lib/auth/handlers';
export const POST=loggedRoute('/api/auth/login',async(request,trace)=>{const response=await login(request,trace);const jar=await cookies();jar.delete('bizzimpact-demo-session');jar.delete('bizzimpact-trial-session');return response;});
