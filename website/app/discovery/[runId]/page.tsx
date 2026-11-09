'use client';
import { use,useEffect,useState } from 'react';
import { ArrowLeft,ArrowRight,RefreshCw } from 'lucide-react';
import { api } from '@/lib/phase1/api';
import { channels,profileSummary,capabilityLabels } from '@/lib/phase1/profile';
import type { Run } from '@/lib/phase1/types';
import { CandidateCard,PhaseHeader } from '@/components/phase1/shared';
import SearchProgress from '@/components/phase1/search-progress';
const terminal=new Set(['completed','partial','failed','needs_clarification']);
const statusLabels:Record<string,string>={queued:'Finding tools for you',parsing:'Finding tools for you',needs_clarification:'One optional clarification',catalog_search:'Finding tools for you',web_search:'Finding tools for you',enriching:'Finding tools for you',completed:'Discovery complete',partial:'Partial results available',failed:'Discovery could not finish'};
export default function Discovery({params}:{params:Promise<{runId:string}>}){
 const{runId}=use(params);const[run,setRun]=useState<Run|null>(null);const[error,setError]=useState('');const[answer,setAnswer]=useState<string[]>([]);const[busy,setBusy]=useState(false);const[retry,setRetry]=useState(0);
 useEffect(()=>{setRun(null);setError('');},[runId]);
 useEffect(()=>{
  let active=true;let timer:ReturnType<typeof setTimeout>;let failures=0;const started=Date.now();
  async function poll(){
   try{
    const result=await api<Run>('/discovery/runs/'+runId);if(!active)return;
    failures=0;setRun(result);setError('');
    if(!terminal.has(result.status))timer=setTimeout(poll,Date.now()-started>60000?2500:1000);
   }catch{
    if(!active)return;failures++;
    setError(failures<3?'Connection interrupted. Reconnecting…':'Could not refresh your search. Retry to check its progress.');
    if(failures<3)timer=setTimeout(poll,3000);
   }
  }
  void poll();return()=>{active=false;clearTimeout(timer);};
 },[runId,retry]);
 async function clarify(skip:boolean){if(!skip&&!answer.length){setError('Choose a channel or skip this question.');return;}setBusy(true);try{await api('/discovery/runs/'+runId+'/clarification',{method:'POST',body:JSON.stringify(skip?{skip:true}:{answer:answer.join(', ')})});setRetry(v=>v+1);}catch(e){setError(e instanceof Error?e.message:'Could not continue discovery.');}finally{setBusy(false);}}
 return <><PhaseHeader/><main className="workspace wrap"><a className="text-button" href="/dashboard"><ArrowLeft size={15}/>Back to dashboard</a><div className="results-heading"><div><div className="eyebrow">PROBLEM-SPECIFIC DISCOVERY</div><h1>{run?statusLabels[run.status]??run.status:'Finding tools for you'}</h1><p>{run?.requirements?.problem_summary??'We’re finding tools for the task you described.'}</p></div></div>{error&&<div className="error" role="alert">{error}<button className="text-button" onClick={()=>setRetry(v=>v+1)}>Retry status <RefreshCw size={14}/></button></div>}
 <SearchProgress key={runId} status={run?.status} startedAt={run?.state_history[0]?.at} paused={!!error}/>
 {run&&<>{run.status==='needs_clarification'&&<section className="clarification-panel"><h2>{run.clarification_question}</h2><p>Optional. This helps distinguish phone, website and messaging tools.</p><fieldset className="priority-fieldset"><legend className="sr-only">Customer contact channels</legend>{channels.map(c=><label className="checkbox" key={c}><input type="checkbox" checked={answer.includes(c)} onChange={()=>setAnswer(v=>v.includes(c)?v.filter(x=>x!==c):[...v,c])}/>{c}</label>)}</fieldset><div className="review-actions"><button className="button secondary" disabled={busy} onClick={()=>clarify(true)}>Skip and continue</button><button className="button primary" disabled={busy} onClick={()=>clarify(false)}>Continue<ArrowRight size={16}/></button></div></section>}
 {run.warnings.map((w,i)=><p className="note" key={i}>{w}</p>)}{run.requirements&&<section className="profile-summary"><div><h2>What we understood</h2><p>Tasks to help with: {run.requirements.required_capabilities.map(c=>capabilityLabels[c]??c).join(', ')||'Not confidently mapped'}</p><p>Review these tasks before choosing a tool.</p>{run.discovery_context&&<>{run.discovery_context.current_workflow&&<p><strong>Today:</strong> {run.discovery_context.current_workflow}</p>}{run.discovery_context.desired_outcome&&<p><strong>Desired result:</strong> {run.discovery_context.desired_outcome}</p>}{run.discovery_context.constraints&&<p><strong>Requirements to verify:</strong> {run.discovery_context.constraints}</p>}</>}<a className="text-button" href="/dashboard">Refine my request <ArrowLeft size={15}/></a></div></section>}
 {['completed','partial','failed'].includes(run.status)&&<><div className="results-label"><h2>Tools for your task <span>{run.tools.length}</span></h2><small>Review features and sources before choosing</small></div>{run.tools.length?<div className="catalog-grid">{run.tools.map(t=><CandidateCard key={t.tool_id} tool={t} returnTo={'/discovery/'+runId}/>)}</div>:<div className="empty-state"><p>No matching tools were found. Try describing a more specific task.</p></div>}</>}
 <details className="excluded"><summary>Business context used for this search</summary>{profileSummary(run.profile_snapshot).map(line=><p key={line}>{line}</p>)}</details></>}
 </main></>;
}
