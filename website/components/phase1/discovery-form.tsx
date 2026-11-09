'use client';
import { useEffect,useState } from 'react';
import { ArrowLeft,ArrowRight,LoaderCircle } from 'lucide-react';
import { api } from '@/lib/phase1/api';
import type { Business,DiscoveryContext } from '@/lib/phase1/types';

type Draft={problem:string;current_workflow:string;desired_outcome:string;constraints:string};
const blank:Draft={problem:'',current_workflow:'',desired_outcome:'',constraints:''};
const keyFor=(id:string)=>'bizzimpact-search-draft:'+id;
export default function DiscoveryForm({business,synthetic,live=false,trial=false,onStarted}:{business:Business;synthetic:boolean;live?:boolean;trial?:boolean;onStarted?:(id:string)=>void}){
 const [draft,setDraft]=useState<Draft>(blank);const [loadedFor,setLoadedFor]=useState('');
 const [reviewing,setReviewing]=useState(false);const [forceWeb,setForceWeb]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{
  let next=blank;
  try{const saved=JSON.parse(sessionStorage.getItem(keyFor(business.business_id))??'null');if(saved&&Object.keys(blank).every(k=>typeof saved[k]==='string'))next=saved;}catch{}
  setDraft(next);setLoadedFor(business.business_id);setReviewing(false);setForceWeb(false);setBusy(false);setError('');
 },[business.business_id]);
 useEffect(()=>{if(loadedFor===business.business_id)try{sessionStorage.setItem(keyFor(business.business_id),JSON.stringify(draft));}catch{}},[draft,loadedFor,business.business_id]);
 const food=business.profile.industry.category==='Food & Beverage';
 const fields=[
  {id:'current_workflow',label:'How do you handle this today?',placeholder:food?'For example: We count stock in a spreadsheet every Friday.':'For example: Calls go to voicemail and I call people back after work.'},
  {id:'desired_outcome',label:'What would you like to happen instead?',placeholder:food?'For example: Suggest what to order before we run out.':'For example: Collect the caller’s details and request a time for me to approve.'},
  {id:'constraints',label:'What must a tool work with or avoid?',placeholder:'For example: Keep QuickBooks, require my approval, or use only public business information.'},
 ] as const;
 function change(key:keyof Draft,value:string){setDraft(v=>({...v,[key]:value}));setError('');}
 async function submit(event:React.FormEvent){
  event.preventDefault();setError('');
  const problem=draft.problem.trim();
  if(problem.length<10||problem.length>2000){setError('Describe the task in 10–2000 characters.');return;}
  if(fields.some(f=>draft[f.id].length>500)){setError('Keep each optional answer to 500 characters or fewer.');return;}
  if(!reviewing){setReviewing(true);return;}
  setBusy(true);
  const context:DiscoveryContext={current_workflow:draft.current_workflow.trim()||null,desired_outcome:draft.desired_outcome.trim()||null,constraints:draft.constraints.trim()||null};
  try{const run=await api<{run_id:string}>('/discovery/runs',{method:'POST',body:JSON.stringify({business_id:business.business_id,problem_text:problem,context,force_web:forceWeb})});if(onStarted)onStarted(run.run_id);else window.location.assign('/discovery/'+run.run_id);}
  catch(e){setError(e instanceof Error?e.message:'Could not start discovery.');setBusy(false);}
 }
 return <section className="problem-section"><form onSubmit={submit} aria-busy={busy}>
  {reviewing?<><h2>Review your search request</h2><p>For your {business.profile.industry.subtype.toLowerCase()} business. You can edit anything before searching.</p><dl><dt><strong>The task you want help with</strong></dt><dd>{draft.problem}</dd>{fields.map(f=><div key={f.id}><dt><strong>{f.label}</strong></dt><dd>{draft[f.id]||'Not provided — we’ll keep this unknown.'}</dd></div>)}</dl>{live&&<label className="checkbox"><input type="checkbox" checked={forceWeb} onChange={e=>setForceWeb(e.target.checked)}/>Also check current vendor pages</label>}<p className="note">We’ll look for tools with evidence for the task. Your budget, connections and other requirements still need checking before you choose one.</p><div className="problem-footer"><button type="button" className="text-button" disabled={busy} onClick={()=>setReviewing(false)}><ArrowLeft size={15}/>Edit request</button><button type="submit" className="button primary" disabled={busy}>{busy?<><LoaderCircle className="search-spinner" size={16} aria-hidden="true"/>Starting your search…</> : <>Search for candidate tools<ArrowRight size={16}/></>}</button></div></>:<>
   <label className="field-label" htmlFor="problem">What task would you like help with?</label>
   <textarea id="problem" required minLength={10} maxLength={2000} value={draft.problem} onChange={e=>change('problem',e.target.value)} placeholder={food?'For example: We throw away produce and sometimes run out of popular ingredients.':'For example: I miss calls while working and lose track of who needs a reply.'}/>
   <details><summary>Add details for a more focused search (optional)</summary><p>Answer what you know. You can leave these blank.</p>{fields.map(f=><div key={f.id}><label className="field-label" htmlFor={f.id}>{f.label}<span>Optional</span></label><textarea id={f.id} maxLength={500} value={draft[f.id]} onChange={e=>change(f.id,e.target.value)} placeholder={f.placeholder}/></div>)}</details>
   <div className="problem-footer"><small>Leave out customer names, passwords and private records.</small><button type="submit" className="button primary">Review my search<ArrowRight size={16}/></button></div>
  </>}
  {error&&<p className="error" role="alert">{error}</p>}
 </form>{synthetic&&<p className="input-help">Sample results use fictional products.</p>}</section>;
}
