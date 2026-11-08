import { cookies } from 'next/headers';
import { loggedRoute } from '@/lib/server/http';
import { login } from '@/lib/auth/handlers';
export const POST=loggedRoute('/api/auth/login',async(request,trace)=>{const response=await login(request,trace);(await cookies()).delete('bizzimpact-demo-session');return response;});
