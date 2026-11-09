'use client';
import { useEffect,useState } from 'react';
import { Check,LoaderCircle,Search } from 'lucide-react';

const finished=new Set(['completed','partial','failed','needs_clarification']);
const steps=['Understand your task','Find relevant tools','Review your matches'];
export function searchStep(status:string){return status==='enriching'?2:['catalog_search','web_search'].includes(status)?1:0;}
export default function SearchProgress({status='loading',startedAt,paused=false}:{status?:string;startedAt?:string;paused?:boolean}){
 const [openedAt]=useState(()=>Date.now());const [now,setNow]=useState(()=>Date.now());
 const done=finished.has(status);
 useEffect(()=>{if(done||paused)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[done,paused]);
 if(done)return null;
 const stage=searchStep(status);const parsed=startedAt?Date.parse(startedAt):NaN;const seconds=Math.max(0,Math.floor((now-(Number.isFinite(parsed)?parsed:openedAt))/1000));
 const heading=paused?'Waiting for a connection':status==='loading'?'Opening your search':stage===0?'Understanding your task':stage===1?'Searching for tools':'Reviewing your matches';
 const description=paused?'Your search may still be running. Retry the status check to see its progress.':status==='web_search'?'Looking through additional product pages.':stage===2?'Final step: checking the matches before showing your results.':stage===1?'Looking for tools that can help with your task.':'Reading your request and the business details you provided.';
 return <section className={`search-progress${paused?' is-paused':''}`} aria-label="Search progress">
  <div className="search-progress-heading"><span className="search-progress-icon" aria-hidden="true">{paused?<Search size={23}/>:<LoaderCircle className="search-spinner" size={25}/>}</span><div><h2 aria-live="polite">{heading}</h2><p>{description}</p></div></div>
  <div className="search-progress-track" role="progressbar" aria-label="Tool search" aria-valuetext={heading}><span/></div>
  <ol className="search-steps">{steps.map((label,index)=><li key={label} className={index<stage?'is-complete':index===stage?'is-current':''} aria-current={index===stage?'step':undefined}><span aria-hidden="true">{index<stage?<Check size={14}/>:index+1}</span>{label}{index<stage&&<span className="sr-only"> — complete</span>}</li>)}</ol>
  <div className="search-progress-footer"><span>{paused?'Updates paused':seconds>=60?`${Math.floor(seconds/60)}m ${seconds%60}s elapsed`:`${seconds}s elapsed`}</span><span>{seconds>=30&&!paused?'Still working — some searches take a little longer.':'Results will appear here when ready.'}</span></div>
  {!paused&&<div className="search-placeholder-grid" aria-hidden="true">{[0,1,2].map(i=><div className="search-placeholder" key={i}><span/><span/><span/></div>)}</div>}
 </section>;
}
