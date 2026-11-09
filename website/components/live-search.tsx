'use client';

import { useState } from 'react';
import { ExternalLink, Globe, Info, LoaderCircle } from 'lucide-react';
import type { LiveResult } from '@/lib/discovery/live';

/** "Search the web" for a need our reviewed catalogue does not cover yet. */
export function LiveSearch({ capabilityId, label, industry }: { capabilityId: string; label: string; industry?: string | null }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [result, setResult] = useState<LiveResult | null>(null);
  const [error, setError] = useState('');
  async function run() {
    setState('busy'); setError('');
    try {
      const res = await fetch('/api/discover/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capabilityId, industry: industry ?? null }), signal: AbortSignal.timeout(60000) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Live search failed.');
      setResult(body); setState('done');
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Live search took too long. Please try again.'); setState('idle'); }
  }
  if (state !== 'done') return <div className="lv">
    <button type="button" className="button secondary" onClick={run} disabled={state === 'busy'}>{state==='busy'?<LoaderCircle className="search-spinner" size={16} aria-hidden="true"/>:<Globe size={16} aria-hidden="true"/>} {state === 'busy' ? 'Searching the web…' : `Search the web for ${label.toLowerCase()} tools`}</button>
    {error && <p className="dx-error" role="alert">{error}</p>}
  </div>;
  const r = result!;
  return <div className="lv" aria-live="polite">
    <p className="dx-notice"><Info size={15} aria-hidden="true" /> {r.message}</p>
    {r.candidates.length > 0 && <ul className="lv-list">{r.candidates.map(c => <li key={c.url} className="lv-item">
      <div className="lv-head"><strong>{c.name}</strong><span className="dx-badge warn">Found live · not yet verified</span><span className="dx-badge muted">{c.evidence === 'vendor-page-cited' ? 'Vendor page cited' : 'Mentioned in a cited article'}</span></div>
      <p>{c.whatItDoes}</p>
      <p className="dx-missing">{c.smallBusinessFit}{c.pricing ? ` · Pricing as stated: ${c.pricing}` : ' · Pricing not stated in sources'}</p>
      <div className="dx-sources"><a href={c.url} target="_blank" rel="noopener noreferrer nofollow">Official site <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
        {c.sources.filter(s => s.url !== c.url).map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.title || 'Source'} <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>)}</div>
    </li>)}</ul>}
  </div>;
}
