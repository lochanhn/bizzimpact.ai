export async function api<T=any>(path:string,init:RequestInit={}):Promise<T>{
 const response=await fetch('/api/v1'+path,{...init,headers:{...(init.body?{'Content-Type':'application/json'}:{}),...init.headers},cache:'no-store',signal:AbortSignal.timeout(25000)});
 let body:any;try{body=await response.json();}catch{throw Error('The discovery service did not respond. Please try again.');}
 if(!response.ok)throw Error(typeof body.detail==='string'?body.detail:body.error??'Please check your answers and try again.');return body;
}
export async function startDemo(){await api('/demo',{method:'POST'});sessionStorage.removeItem('bizzimpact-phase1-business');window.location.assign('/onboarding');}
