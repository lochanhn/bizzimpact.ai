'use client';
import { useEffect,useState } from 'react';
import { ArrowRight,ExternalLink,Sprout } from 'lucide-react';
import { AccountControl } from '@/components/auth-provider';
import { api,openWorkspace } from '@/lib/phase1/api';
import { capabilityLabels } from '@/lib/phase1/profile';
import type { ToolRecord,MatchQuality } from '@/lib/phase1/types';
export function PhaseHeader(){
 const [synthetic,setSynthetic]=useState(false);
 useEffect(()=>{api<{synthetic:boolean}>('/context').then(c=>setSynthetic(c.synthetic)).catch(()=>{});},[]);
 return <><header className="phase-nav wrap"><a className="brand" href="/"><span className="brand-mark"><Sprout size={22}/></span>bizzimpact<span className="brand-ai">.ai</span></a><nav aria-label="Main navigation"><a href="/dashboard">Dashboard</a><a href="/profile">Business profile</a><a href="/catalog">Tool catalogue</a><AccountControl/></nav></header>{synthetic&&<p className="sample-notice" role="status">Sample workspace · example results</p>}</>;
}
export function GetStartedButton({label='Get started'}:{label?:string}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 return <div className="workspace-entry"><button className="button primary" disabled={busy} onClick={async()=>{setBusy(true);try{await openWorkspace();}catch(e){setError(e instanceof Error?e.message:'Could not open your dashboard.');setBusy(false);}}}>{busy?'Opening your dashboard…':label}<ArrowRight size={16}/></button>{error&&<p className="error" role="alert">{error}</p>}</div>;
}
export function QualityDetails({quality}:{quality:MatchQuality}){
 return <section className="match-quality"><strong>{quality.score===null?'More information needed':`Match score: ${quality.score}/100`}</strong>{quality.explanation&&<p>{quality.explanation}</p>}<details><summary>How this match was assessed</summary><ul><li>Requested task coverage: {quality.task_coverage_points}/50</li><li>Source completeness for matched tasks: {quality.source_evidence_points}/25</li><li>AI workflow relevance: {quality.workflow_relevance_points??'Not approved'}/25</li></ul><p>Experimental rubric. This is not a success probability, a product reliability rating, or a price/integration guarantee.</p>{quality.source_urls.map(url=><a className="source-out" href={url} key={url} target="_blank" rel="noreferrer">Evidence source <ExternalLink size={12}/></a>)}<ul>{quality.limitations.map(text=><li key={text}>{text}</li>)}</ul></details></section>;
}
export function CandidateCard({tool,returnTo='/dashboard'}:{tool:ToolRecord;returnTo?:string}){return <article className="catalog-card"><div className="catalog-card-top"><span className="tool-mark">{tool.name.slice(0,1)}</span>{(tool.synthetic||tool.catalog_status==='provisional')&&<span className="status">{tool.synthetic?'Sample result':'Needs review'}</span>}</div><h2>{tool.name}</h2><p>{tool.short_description}</p>{tool.quality&&<QualityDetails quality={tool.quality}/>}<div className="cap-tags">{tool.matched_capabilities.map(c=><span key={c}>{capabilityLabels[c]??c.replaceAll('_',' ')}</span>)}</div><a className="text-button" href={`/tools/${tool.tool_id}?returnTo=${encodeURIComponent(returnTo)}`}>View evidence & unknowns <ArrowRight size={15}/></a>{!tool.synthetic&&<a className="source-out" href={tool.official_url} rel="noreferrer" target="_blank">Source page <ExternalLink size={12}/></a>}</article>;}
