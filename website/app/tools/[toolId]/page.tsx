'use client';
import { use,useEffect,useState } from 'react';
import { ArrowLeft,ExternalLink } from 'lucide-react';
import { api } from '@/lib/phase1/api';
import { evidenceBackTarget } from '@/lib/phase1/navigation';
import type { ToolRecord,Run } from '@/lib/phase1/types';
import { PhaseHeader,QualityDetails } from '@/components/phase1/shared';

export default function Tool({params,searchParams}:{params:Promise<{toolId:string}>;searchParams:Promise<{returnTo?:string|string[]}>}){
 const{toolId}=use(params);const back=evidenceBackTarget(use(searchParams).returnTo);const[tool,setTool]=useState<ToolRecord|null>(null);const[error,setError]=useState('');
 useEffect(()=>{let active=true;setTool(null);setError('');(async()=>{try{if(back.href.startsWith('/discovery/')){const run=await api<Run>('/discovery/runs/'+back.href.split('/').at(-1));const candidate=run.tools.find(t=>t.tool_id===toolId);if(candidate){if(active)setTool(candidate);return;}}const product=await api<ToolRecord>('/tools/'+toolId);if(active)setTool(product);}catch(e){if(active)setError(e instanceof Error?e.message:'Could not load this tool.');}})();return()=>{active=false;};},[toolId,back.href]);
 return <><PhaseHeader/><main className="workspace wrap"><a className="text-button" href={back.href}><ArrowLeft size={15}/>{back.label}</a>{error?<p className="error" role="alert">{error}</p>:!tool?<p className="note" role="status">Loading tool details…</p>:<><div className="eyebrow">TOOL GUIDE</div><h1>{tool.name}</h1><p>{tool.short_description}</p>
 {tool.guidance&&<><section className="profile-summary"><div><h2>Why it may help</h2><p>{tool.guidance.why_it_may_help}</p>{tool.guidance.covers.length>0&&<p><strong>Useful for:</strong> {tool.guidance.covers.join(', ')}</p>}</div></section><h2 className="section-title">How to get started</h2><ol>{tool.guidance.setup_steps.map(step=><li key={step}>{step}</li>)}</ol><h2 className="section-title">Before you choose it</h2><ul>{tool.guidance.verify_before_buying.map(check=><li key={check}>{check}</li>)}</ul></>}
 {!tool.guidance&&tool.quality&&<QualityDetails quality={tool.quality}/>}
 {tool.synthetic?<div className="note">Synthetic demonstration product. Not a real vendor.</div>:<a className="button secondary source-button" href={tool.official_url} target="_blank" rel="noreferrer">Visit official website<ExternalLink size={15}/></a>}
 <h2 className="section-title">What it can help with</h2><div className="cap-tags">{tool.matched_capabilities.length?tool.matched_capabilities.map(c=><span key={c}>{c.replaceAll('_',' ')}</span>):<span>No supported capability has been identified yet.</span>}</div>
 <h2 className="section-title">Research sources</h2><div className="evidence-list">{tool.evidence.map((e,i)=><article key={i}><div><strong>{e.claim_key.replaceAll('_',' ')}</strong></div><p>{typeof e.claim_value==='string'?e.claim_value:JSON.stringify(e.claim_value)}</p>{e.source_url?<a href={e.source_url} target="_blank" rel="noreferrer">View source <ExternalLink size={12}/></a>:<small>Sample result; no vendor source.</small>}{e.evidence_excerpt&&<blockquote>{e.evidence_excerpt}</blockquote>}{e.observed_at&&<small>Checked {new Date(e.observed_at).toLocaleDateString()}</small>}</article>)}</div></>}</main></>;
}
