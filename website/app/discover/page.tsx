'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, ChevronDown, Download, ExternalLink, Info, Layers3, Search, ShieldCheck, Sprout } from 'lucide-react';
import type { Candidate, DiscoveryResult } from '@/lib/discovery/discover';
import { LiveSearch } from '@/components/live-search';
import { STRUGGLES, type AreaId } from '@/lib/intake/bank';

// Labels duplicated from the server contract so this client bundle stays small.
const INDUSTRY: Record<string, string> = { food: 'Food & Beverage', home: 'Home Services', retail: 'Retail & E-commerce', professional: 'Professional Services', health: 'Health & Wellness', education: 'Education', manufacturing: 'Manufacturing', other: 'Other' };
const TEAM: Record<string, string> = { solo: 'Just me', '2-10': '2–10', '11-50': '11–50', '51-249': '51–249', '250+': '250+' };
const BUDGET: Record<string, string> = { free: 'Free tools only', 'under-50': 'Under $50', '50-149': '$50–$149', '150-499': '$150–$499', '500+': '$500 or more', unknown: 'Not sure yet' };
const SOFTWARE_SUGGESTIONS = ['QuickBooks', 'Google Calendar', 'Square', 'Housecall Pro', 'Mailchimp', 'Canva', 'Shopify', 'Outlook'];
type Profile = { industry: string; teamSize: string; budget: string; software: string };
const EMPTY: Profile = { industry: '', teamSize: '', budget: '', software: '' };
const EXAMPLES: { label: string; problem: string; profile: Profile }[] = [
  { label: 'Landscaper missing calls', problem: 'I miss customer calls while working outside and need them answered and appointments booked.', profile: { industry: 'home', teamSize: '2-10', budget: '50-149', software: 'QuickBooks, Google Calendar' } },
  { label: 'Restaurant food waste', problem: 'I overorder ingredients and throw away food each week.', profile: { industry: 'food', teamSize: '11-50', budget: 'unknown', software: 'Square' } },
  { label: 'Cafe social posts', problem: 'I never know what to post on Instagram for the cafe and forget to post regularly.', profile: { industry: 'food', teamSize: '2-10', budget: 'free', software: 'Canva' } },
  { label: 'Unclear enquiry channel', problem: 'Customer inquiries get lost and I want automatic responses.', profile: { industry: 'retail', teamSize: 'solo', budget: 'under-50', software: '' } },
  { label: 'Books and receipts', problem: "I don't want a chatbot, I just need help with my books and a shoebox of receipts.", profile: { industry: 'home', teamSize: 'solo', budget: 'under-50', software: 'QuickBooks' } },
];
const STACK_LABEL = { 'in-your-stack': 'Already in your software', documented: 'Connection documented', 'needs-checking': 'Connection needs checking', 'not-on-plan': 'Not on reviewed plans' } as const;

function Bar({ value }: { value: number }) {
  return <span className="dx-bar" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>;
}

function CandidateCard({ c, rank }: { c: Candidate; rank: number }) {
  return (
    <article className="dx-card" aria-labelledby={`tool-${c.toolId}`}>
      <div className="dx-card-head">
        <span className="dx-rank" aria-hidden="true">{rank}</span>
        <div className="dx-card-title">
          <h3 id={`tool-${c.toolId}`}>{c.name}</h3>
          <small>{c.category}</small>
        </div>
        <div className="dx-match" aria-label={`Need match ${c.relevance} out of 100: ${c.relevanceLabel}`}>
          <strong>{c.relevanceLabel}</strong>
          <span><Bar value={c.relevance} /> {c.relevance}</span>
        </div>
      </div>
      <p className="dx-desc">{c.description}</p>
      <div className="dx-badges">
        <span className={`dx-badge ${c.evidenceLevel === 'plan' ? 'ok' : 'muted'}`}>{c.evidenceLevel === 'plan' ? <><ShieldCheck size={13} /> Plan details reviewed</> : <><Info size={13} /> Product page reviewed</>}</span>
        <span className={`dx-badge ${c.price.verified ? '' : 'muted'}`}>{c.price.label}</span>
        {c.stack.signals.map(s => <span key={s.app + s.status} className={`dx-badge ${s.status === 'in-your-stack' || s.status === 'documented' ? 'ok' : s.status === 'not-on-plan' ? 'warn' : 'muted'}`} title={s.detail}>{STACK_LABEL[s.status]}: {s.app}</span>)}
      </div>
      <ul className="dx-reasons">{c.reasons.map(r => <li key={r}><Check size={14} aria-hidden="true" /> {r}</li>)}</ul>
      {c.missing.length > 0 && <p className="dx-missing">Does not cover: {c.missing.map(m => m.label.toLowerCase()).join(', ')}</p>}
      {c.warnings.length > 0 && <ul className="dx-warnings">{c.warnings.map(w => <li key={w}><AlertTriangle size={14} aria-hidden="true" /> {w}</li>)}</ul>}
      <div className="dx-sources">
        {c.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>)}
        <span>Checked {c.checkedAt} · found in catalogue</span>
      </div>
    </article>
  );
}

export default function DiscoverPage() {
  const [problem, setProblem] = useState('');
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shown, setShown] = useState(6);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const set = (k: keyof Profile, v: string) => setProfile(p => ({ ...p, [k]: v }));
  const length = problem.trim().length;

  useEffect(() => { if (result) resultsHeading.current?.focus(); }, [result]);

  async function run(clarification?: string, override?: { problem: string; profile: Profile }) {
    const text = override?.problem ?? problem;
    const prof = override?.profile ?? profile;
    if (text.trim().length < 10) { setError('Please describe the problem in at least 10 characters.'); return; }
    setBusy(true); setError('');
    const software = prof.software.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
    const body = {
      problem: text,
      profile: {
        ...(prof.industry && { industry: prof.industry }), ...(prof.teamSize && { teamSize: prof.teamSize }),
        ...(prof.budget && { budget: prof.budget }), ...(software.length && { software }),
      },
      ...(clarification && { clarification }),
    };
    try {
      const response = await fetch('/api/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not run discovery.');
      setResult(data); setShown(6);
    } catch (e) {
      setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Discovery took too long. Please try again.');
    } finally { setBusy(false); }
  }

  function useExample(ex: typeof EXAMPLES[number]) { setProblem(ex.problem); setProfile(ex.profile); run(undefined, ex); }

  function downloadResult() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'bizzimpact-discovery-result.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Hand the needs found here to the full check-up (Review + Integration), pre-ticked for the owner to confirm. */
  function toFullPlan() {
    if (!result) return;
    const caps = result.intent.capabilities.filter(c => c.role === 'required').map(c => c.id);
    const struggles: string[] = [];
    for (const cap of caps) { const s = STRUGGLES.find(x => x.capabilities.includes(cap) && !x.show); if (s && !struggles.includes(s.id)) struggles.push(s.id); }
    const areas = [...new Set(struggles.map(id => STRUGGLES.find(x => x.id === id)!.area))].slice(0, 3) as AreaId[];
    const kept = struggles.filter(id => areas.includes(STRUGGLES.find(x => x.id === id)!.area));
    const software = profile.software.split(',').map(x => x.trim()).filter(Boolean);
    const draft = { industry: profile.industry || undefined, teamSize: profile.teamSize || undefined, budget: profile.budget || undefined,
      software, softwareStatus: 'listed', mustKeep: [], areas, struggles: kept, focus: kept[0], followups: {}, deepDive: {}, dataHandled: [], extra: problem.slice(0, 2000) };
    try { sessionStorage.setItem('bizzimpact-checkup-v1', JSON.stringify(draft)); } catch { /* storage unavailable */ }
    window.location.href = '/start';
  }

  const r = result;
  return (
    <>
      <a className="skip-link" href="#discover-main">Skip to content</a>
      <header><div className="nav-wrap">
        <a className="brand" href="/" aria-label="bizzimpact.ai home"><span className="brand-mark"><Sprout size={23} /></span><span>bizzimpact<span className="brand-ai">.ai</span></span></a>
        <nav aria-label="Main"><a className="dx-nav-link" href="/">Guided questions &amp; catalogue</a></nav>
      </div></header>

      <main id="discover-main" className="wrap dx">
        <section className="dx-intro">
          <div className="eyebrow"><span className="tiny-star">✦</span> DISCOVER</div>
          <h1>What would you like help with today?</h1>
          <p>Describe the problem in your own words. We’ll work out what kind of tool you need and find matching AI tools from our reviewed catalogue, with sources and unknowns shown.</p>
        </section>

        <form className="dx-form" onSubmit={e => { e.preventDefault(); run(); }} noValidate>
          <label className="field-label" htmlFor="dx-problem">Your problem</label>
          <textarea id="dx-problem" value={problem} maxLength={2000} rows={4} aria-describedby="dx-problem-help" aria-invalid={!!error && length < 10}
            placeholder="For example: I miss calls while I’m on jobs and lose customers." onChange={e => setProblem(e.target.value)} />
          <div id="dx-problem-help" className="dx-help"><span>Please leave out customer names and private details.</span><span>{length}/2000</span></div>

          <div className="dx-examples" aria-label="Example problems">
            <span>Try an example:</span>
            {EXAMPLES.map(ex => <button type="button" key={ex.label} className="pill" onClick={() => useExample(ex)} disabled={busy}>{ex.label}</button>)}
          </div>

          <details className="dx-profile" open={!!(profile.industry || profile.software)}>
            <summary>About your business <span>Optional, improves the results</span> <ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="dx-grid">
              <label>What kind of business?<select value={profile.industry} onChange={e => set('industry', e.target.value)}><option value="">Prefer not to say</option>{Object.entries(INDUSTRY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>How many people work there?<select value={profile.teamSize} onChange={e => set('teamSize', e.target.value)}><option value="">Prefer not to say</option>{Object.entries(TEAM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>Monthly budget for new AI tools<select value={profile.budget} onChange={e => set('budget', e.target.value)}><option value="">Prefer not to say</option>{Object.entries(BUDGET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>Software you already use<input value={profile.software} maxLength={400} placeholder="Comma separated, e.g. QuickBooks, Google Calendar" onChange={e => set('software', e.target.value)} /></label>
            </div>
            <div className="suggestions" aria-label="Common software">
              {SOFTWARE_SUGGESTIONS.map(s => <button type="button" key={s} className="pill" onClick={() => set('software', profile.software ? (profile.software.toLowerCase().includes(s.toLowerCase()) ? profile.software : `${profile.software}, ${s}`) : s)}>+ {s}</button>)}
            </div>
          </details>

          {error && <p className="dx-error" role="alert">{error}</p>}
          <button className="button primary large" type="submit" disabled={busy}>{busy ? 'Searching…' : <>Find matching tools <Search size={18} /></>}</button>
        </form>

        <section aria-live="polite" className="dx-results">
          {r && <>
            <h2 tabIndex={-1} ref={resultsHeading}>{r.status === 'needs_clarification' ? 'One quick question' : r.status === 'no_match' ? 'We need a little more detail' : `${r.totalCandidates} matching tool${r.totalCandidates === 1 ? '' : 's'}`}</h2>
            <p className="dx-mode"><Info size={15} aria-hidden="true" /> {r.modeNote}</p>

            {(r.intent.capabilities.length > 0 || r.intent.excluded.length > 0) && <div className="dx-understood">
              <h3>What we understood</h3>
              <ul>
                {r.intent.capabilities.map(c => <li key={c.id} className={c.role}>
                  <strong>{c.label}</strong> <em>{c.role === 'required' ? 'needed' : 'possibly relevant'}{c.source === 'profile' ? ' · from your priorities' : c.source === 'clarification' ? ' · from your answer' : ''}</em>
                  {c.source === 'text' && c.evidence.length > 0 && <small>because you wrote “{c.evidence.slice(0, 2).join('”, “')}”</small>}
                </li>)}
                {r.intent.excluded.map(c => <li key={c.id} className="excluded"><strong>{c.label}</strong> <em>not wanted</em><small>you wrote “{c.evidence[0]}”</small></li>)}
              </ul>
            </div>}

            {r.intent.clarification && <div className="dx-clarify" role="group" aria-labelledby="dx-q9">
              <h3 id="dx-q9">{r.intent.clarification.question}</h3>
              <p>{r.intent.clarification.why}</p>
              <div className="dx-options">
                {r.intent.clarification.options.map(o => <button type="button" key={o.value} className="pill" disabled={busy} onClick={() => run(o.value)}>{o.label}</button>)}
                <button type="button" className="text-button" disabled={busy} onClick={() => run('skip')}>Skip this question <ArrowRight size={14} /></button>
              </div>
            </div>}

            {r.notices.map(n => <p key={n} className="dx-notice"><Info size={15} aria-hidden="true" /> {n}</p>)}

            {r.gaps.map(g => <div key={g.capabilityId} className="dx-gap">
              <AlertTriangle size={18} aria-hidden="true" />
              <div><strong>{g.label}</strong><p>{g.plain}</p><p>{g.message}</p><LiveSearch capabilityId={g.capabilityId} label={g.label} industry={(r.profileSnapshot as { industry?: string }).industry ?? r.intent.industryHint} /></div>
            </div>)}

            {r.coverage.filter(c => c.role === 'required').length > 1 && <div className="dx-coverage">
              <h3><Layers3 size={16} aria-hidden="true" /> Your needs at a glance</h3>
              <table><thead><tr><th scope="col">Need</th><th scope="col">Matching tools</th></tr></thead>
                <tbody>{r.coverage.map(c => <tr key={c.capabilityId}><td>{c.label}{c.role === 'optional' && <small> (possibly relevant)</small>}</td><td>{c.toolIds.length || 'None yet'}</td></tr>)}</tbody></table>
              <p>{r.singleToolCovers ? 'At least one tool covers every need on its own.' : r.multiToolNeeded ? 'No single tool covers every need, so you may need a combination.' : 'Some needs have no matching tool yet.'}</p>
            </div>}

            {r.candidates.length > 0 && <>
              <p className="dx-legend"><strong>Need match</strong> shows how well a tool’s documented purpose fits what you described. It is not a quality rating or a recommendation.</p>
              <div className="dx-list">{r.candidates.slice(0, shown).map((c, i) => <CandidateCard key={c.toolId} c={c} rank={i + 1} />)}</div>
              {shown < r.candidates.length && <button type="button" className="button secondary" onClick={() => setShown(r.candidates.length)}>Show {r.candidates.length - shown} more</button>}
              {r.totalCandidates > r.candidates.length && <p className="dx-notice">Showing the {r.candidates.length} closest of {r.totalCandidates} matches.</p>}
            </>}

            {r.excluded.length > 0 && <details className="dx-excluded">
              <summary>{r.excluded.length} tool{r.excluded.length === 1 ? '' : 's'} left out because of your budget or software</summary>
              <ul>{r.excluded.map(x => <li key={x.toolId}><strong>{x.name}</strong>: {x.reasons.join(' ')}</li>)}</ul>
            </details>}

            <div className="dx-footer-actions">
              {r.intent.capabilities.some(c => c.role === 'required') && <button type="button" className="button primary" onClick={toFullPlan}>Turn this into a full AI plan <ArrowRight size={16} /></button>}
              <button type="button" className="text-button" onClick={downloadResult}><Download size={15} /> Download this result (for comparison and planning)</button>
              <span>{r.stats.eligible} of {r.stats.catalogSize} catalogue tools matched · taxonomy {r.taxonomyVersion} · engine {r.engineVersion}</span>
            </div>
          </>}
        </section>
      </main>
    </>
  );
}
