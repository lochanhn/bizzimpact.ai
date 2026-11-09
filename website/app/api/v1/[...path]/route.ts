import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authClient,authConfig } from '@/lib/auth/server';
import { HttpError,loggedRoute,requireSameOrigin } from '@/lib/server/http';
const TOKEN='bizzimpact-demo-session';
const TRIAL='bizzimpact-trial-session';
async function proxy(request:Request,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;const endpoint=path.join('/');
 if(path.some(p=>!/^[-a-zA-Z0-9]+$/.test(p)))throw new HttpError(400,'Invalid API path.');
 if(!['GET','POST','PUT'].includes(request.method))throw new HttpError(405,'Method not supported.');
 if(request.method!=='GET')requireSameOrigin(request);
 const target=new URL(process.env.DISCOVERY_BACKEND_URL??'http://127.0.0.1:8001');
 if(!['http:','https:'].includes(target.protocol)||target.username||target.password)throw new HttpError(503,'Discovery backend URL is not configured.');
 target.pathname='/api/v1/'+endpoint;target.search='';const jar=await cookies();let token=jar.get(TRIAL)?.value??jar.get(TOKEN)?.value;
 const isPublic=endpoint==='onboarding/schema'||endpoint==='availability'||/^tools\/[a-f0-9-]{36}$/.test(endpoint)||endpoint==='demo'||endpoint==='trial';
 if(!token&&!isPublic){
  if(!authConfig())throw new HttpError(401,'Sign in or get started to open your workspace.','not_authenticated');
  const client=await authClient();const {data,error}=await client.auth.getUser();
  if(error||!data.user)throw new HttpError(401,'Sign in or get started to open your workspace.','not_authenticated');
  const session=await client.auth.getSession();token=session.data.session?.access_token;
 }
 const raw=request.method==='GET'?undefined:await request.text();if(raw&&Buffer.byteLength(raw)>16000)throw new HttpError(413,'Request too large.');
 let response:Response;
 try{response=await fetch(target,{method:request.method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:raw,cache:'no-store',signal:AbortSignal.timeout(25000)});}catch{throw new HttpError(503,'The service is unavailable. Please try again shortly.','not_configured');}
 const body=await response.json();
 if((endpoint==='demo'||endpoint==='trial')&&request.method==='POST'&&response.ok){const live=endpoint==='trial';jar.delete(live?TOKEN:TRIAL);jar.set(live?TRIAL:TOKEN,body.token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:7200});return NextResponse.json({synthetic:!live,trial:live,expires_in:body.expires_in},{status:201});}
 if(endpoint==='demo/logout'&&response.ok)jar.delete(TOKEN);
 if(endpoint==='trial/logout'&&response.ok)jar.delete(TRIAL);
 return NextResponse.json(body,{status:response.status});
}
export async function GET(request:Request,context:{params:Promise<{path:string[]}>}){return loggedRoute('/api/v1/proxy',(r)=>proxy(r,context))(request);}
export const POST=GET;
export const PUT=GET;
