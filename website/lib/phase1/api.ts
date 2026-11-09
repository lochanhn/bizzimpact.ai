export async function api<T=any>(path:string,init:RequestInit={}):Promise<T>{
 const response=await fetch('/api/v1'+path,{...init,headers:{...(init.body?{'Content-Type':'application/json'}:{}),...init.headers},cache:'no-store',signal:AbortSignal.timeout(25000)});
 let body:any;try{body=await response.json();}catch{throw Error('The discovery service did not respond. Please try again.');}
 if(!response.ok)throw Error(typeof body.detail==='string'?body.detail:body.error??'Please check your answers and try again.');return body;
}
function clearWorkspaceDrafts(){for(const key of Object.keys(sessionStorage))if(key==='bizzimpact-phase1-business'||key==='bizzimpact-approved-onboarding-v1'||key.startsWith('bizzimpact-search-draft:'))sessionStorage.removeItem(key);}
export async function startDemo(){await api('/demo',{method:'POST'});clearWorkspaceDrafts();window.location.replace('/dashboard');}
export async function startTrial(){await api('/trial',{method:'POST'});clearWorkspaceDrafts();window.location.replace('/dashboard');}
