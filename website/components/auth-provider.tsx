'use client';
import { createContext,useContext,useEffect,useState,useCallback } from 'react';
type Session={configured:boolean;user:{id:string;email:string|null}|null};
type AuthContext=Session&{loading:boolean;error:string;refresh:()=>Promise<void>};
const Context=createContext<AuthContext>({configured:false,user:null,loading:false,error:'',refresh:async()=>{}});
export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session>({configured:false,user:null});const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const refresh=useCallback(async()=>{
  try{const response=await fetch('/api/auth/session',{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error();const data=await response.json();setSession(data);setError('');}
  catch{setSession({configured:false,user:null});setError('Account status is unavailable. Guest access still works.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 return <Context.Provider value={{...session,loading,error,refresh}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
export function AccountControl(){
 const {user,loading,refresh}=useAuth();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function signout(){setBusy(true);setError('');try{
  const response=await fetch('/api/auth/logout',{method:'POST',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Sign-out failed. Please retry.');
  sessionStorage.removeItem('bizzimpact-assessment-v1');await refresh();window.location.assign('/');
 }catch(e){setError(e instanceof Error?e.message:'Sign-out failed.');}finally{setBusy(false);}}
 return <div className="account-control">{user?<><a href="/dashboard">My workspace</a><button onClick={signout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button></>:<a href="/auth">{loading?'Account…':'Sign in'}</a>}{error&&<span role="alert">{error}</span>}</div>;
}
export function SaveProfileButton({answers}:{answers:unknown}){
 const {user}=useAuth();const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{setStatus('');},[answers]);
 if(!user)return <a className="text-button" href="/auth">Sign in to save answers across devices</a>;
 async function save(){setBusy(true);try{const response=await fetch('/api/account/profile',{method:'PUT',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json'},body:JSON.stringify(answers)});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not save your answers.');setStatus('Saved to your private workspace.');}catch(e){setStatus(e instanceof Error?e.message:'Could not save.');}finally{setBusy(false);}}
 return <div className="save-profile"><button className="button secondary" onClick={save} disabled={busy}>{busy?'Saving…':'Save answers to my workspace'}</button><small role="status">{status||'Only save information you want kept in your account.'}</small></div>;
}
