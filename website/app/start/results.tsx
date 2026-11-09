'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Download, ExternalLink, Info, Layers3, ShieldCheck } from 'lucide-react';
import type { PlanResult } from '@/lib/pipeline';
import type { ToolReview } from '@/lib/review/review';
import { LiveSearch } from '@/components/live-search';
import { planToCsv, planToIcs, planToWebhookPayload } from '@/lib/integration/exports';

const GRADE_CLASS: Record<string, string> = { 'built-in': 'ok', native: 'ok', 'via-zapier': '', 'not-supported': 'warn', unknown: 'muted' };

function Bar({ value }: { value: number | null }) {
  return <span className="dx-bar" aria-hidden="true"><span style={{ width: `${value ?? 0}%`, opacity: value === null ? 0 : 1 }} /></span>;
}

function ReviewCard({ r, rank }: { r: ToolReview; rank?: number }) {
  return <article className="dx-card st-review" aria-labelledby={`rv-${r.toolId}`}>
    <div className="dx-card-head">
      {rank && <span className="dx-rank" aria-hidden="true">{rank}</span>}
      <div className="dx-card-title"><h3 id={`rv-${r.toolId}`}>{r.name}</h3><small>{r.category} · {r.quadrant}</small></div>
      <div className="st-scores">
        <div><small>Fit for you</small><strong>{r.fit ?? '—'}</strong></div>
        <div><small>Confidence</small><strong className={`st-conf ${r.confidence.toLowerCase()}`}>{r.confidence}</strong></div>
      </div>
    </div>
    {r.gates.length > 0 && <ul className="dx-warnings">{r.gates.map(g => <li key={g}><AlertTriangle size={14} aria-hidden="true" /> {g}</li>)}</ul>}
    <div className="dx-badges st-trustrow">
      <span className={`st-shield ${r.security.level}`}><ShieldCheck size={13} aria-hidden="true" /> {r.security.label}</span>
      <span className="dx-badge">Setup: tier {r.ici.tier} of 4 · {r.ici.label}{r.ici.cited ? '' : ' (estimated)'}</span>
      <span className={`dx-badge ${r.owners.reports ? 'ok' : 'muted'}`}>{r.owners.reports ? `${r.owners.label} · at least ${r.owners.fixedAtLeast ?? 0}% say fixed` : 'No owner results yet'}</span>
    </div>
    <details className="st-check-list st-sec"><summary>Security &amp; privacy details</summary><ul>{r.security.points.map(p => <li key={p}>{p}</li>)}</ul>
      {r.security.citations.length > 0 && <p className="dx-sources">{r.security.citations.map(c => <a key={c.url + c.label} href={c.url} target="_blank" rel="noopener noreferrer">{c.label} <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>)}</p>}</details>
    {r.missingLinks.length > 0 && <ul className="dx-warnings">{r.missingLinks.map(m => <li key={m}><AlertTriangle size={14} aria-hidden="true" /> {m}</li>)}</ul>}
    <table className="st-pillars"><caption className="sr-only">How {r.name} scores for you</caption><tbody>
      {r.pillars.map(p => <tr key={p.id}><th scope="row">{p.label}</th><td><Bar value={p.score} /> <span className="st-num">{p.score ?? 'n/a'}</span></td><td>{p.reason}</td></tr>)}
    </tbody></table>
    <div className="dx-badges">
      <span className={`dx-badge ${r.cost.monthly !== null ? '' : 'muted'}`}>{r.cost.label}</span>
      {r.requirementsMet && <span className="dx-badge">Meets {r.requirementsMet} requirements</span>}
      {r.compatibility.items.map(i => <span key={i.app} className={`dx-badge ${GRADE_CLASS[i.grade]}`} title={i.action ?? ''}>{i.app}: {i.label}</span>)}
    </div>
    {r.cost.assumptions.length > 0 && <p className="dx-missing">{r.cost.assumptions.join(' ')}</p>}
    {r.checkBeforeBuying.length > 0 && <details className="st-check-list"><summary>Check before you buy ({r.checkBeforeBuying.length})</summary><ul>{r.checkBeforeBuying.map(c => <li key={c}>{c}</li>)}</ul></details>}
    <div className="dx-sources">{r.discovery.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label} <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>)}<span>Checked {r.discovery.checkedAt} · {r.discovery.evidenceLevel === 'plan' ? 'plan details reviewed' : 'product page reviewed only'}</span></div>
  </article>;
}

export function Results({ r, headingRef, onEdit, onRestart }: { r: PlanResult; headingRef: React.RefObject<HTMLHeadingElement | null>; onEdit: () => void; onRestart: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const { brief, discovery, review, integration } = r;
  const top = review.reviews.filter(x => x.status === 'top-pick');
  const more = review.reviews.filter(x => x.status === 'worth-a-look');
  const out = review.reviews.filter(x => x.status === 'not-suitable');
  const plan = integration.recommended;
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'bizzimpact-ai-plan.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="st-results">
    <div className="eyebrow"><span className="tiny-star">✦</span> YOUR AI PLAN · {brief.business.industryLabel.toUpperCase()}</div>
    <h1 tabIndex={-1} ref={headingRef}>Your AI plan</h1>
    <p className="st-lead">For your #1 problem: <strong>“{brief.focus.label}”</strong>{brief.needs.length > brief.focus.capabilities.length && <> and {brief.needs.length - brief.focus.capabilities.length} related need{brief.needs.length - brief.focus.capabilities.length > 1 ? 's' : ''}</>}.</p>
    <nav className="st-toc" aria-label="Sections"><a href="#plan">1. Your plan</a><a href="#connect">Connect</a><a href="#compare">2. Compare tools</a><a href="#adopt">3. Get started</a><a href="#checkin">4. Share results</a><a href="#unknowns">5. What we don’t know</a></nav>

    {/* ── Integration: recommended plan ── */}
    <section id="plan" className="st-section" aria-labelledby="plan-h">
      <h2 id="plan-h"><Layers3 size={20} aria-hidden="true" /> Recommended plan</h2>
      {plan ? <div className="st-plan">
        <div className="st-stack-head">
          <div><span className="st-kicker">Your AI stack</span><strong className="st-stack-cost">{plan.costLabel.replace(/ \+ \d+ prices? to confirm$/, '')}</strong>
            <span className="st-stack-sub">{plan.tools.length} tool{plan.tools.length > 1 ? 's' : ''} · covers {plan.covers.length} of {plan.covers.length + plan.missing.length} needs{plan.withinBudget === true ? ' · within budget' : plan.withinBudget === false ? ' · over budget' : ''}{plan.unknownCosts ? ` · ${plan.unknownCosts} price${plan.unknownCosts > 1 ? 's' : ''} to confirm` : ''}</span></div>
          <ul className="st-why">{plan.why.map(w => <li key={w}><Check size={14} aria-hidden="true" /> {w}</li>)}</ul>
        </div>
        <ul className="st-plan-tools">{plan.tools.map(t => <li key={t.toolId}><strong>{t.name}</strong><span>{t.covers.join(' · ')}</span><em>{t.cost}</em></li>)}</ul>
        <h3>How it fits with your software</h3>
        <ul className="dx-reasons">{[...plan.dataFlow, ...plan.viaZapier].map(f => <li key={f}><ArrowRight size={14} aria-hidden="true" /> {f}</li>)}</ul>
        {plan.missing.length > 0 && <p className="dx-missing">Not covered yet: {plan.missing.join(', ')}</p>}
        {integration.alternative && <p className="st-alt"><strong>{integration.alternative.label}:</strong> {integration.alternative.tools.map(t => t.name).join(' + ')} · {integration.alternative.costLabel}</p>}
      </div> : <p className="dx-notice"><Info size={15} aria-hidden="true" /> {integration.notes[0] ?? 'No plan could be built from reviewed tools.'}</p>}
      {(plan ? integration.notes : integration.notes.slice(1)).map(n => <p key={n} className="dx-notice"><Info size={15} aria-hidden="true" /> {n}</p>)}
      {discovery.gaps.map(g => <div key={g.capabilityId} className="dx-gap"><AlertTriangle size={18} aria-hidden="true" /><div><strong>{g.label}</strong><p>{g.plain}</p><p>{g.message}</p><LiveSearch capabilityId={g.capabilityId} label={g.label} industry={brief.business.industry} /></div></div>)}
    </section>

    <Connect r={r} />

    {/* ── Review: compare ── */}
    <section id="compare" className="st-section" aria-labelledby="compare-h">
      <h2 id="compare-h"><ShieldCheck size={20} aria-hidden="true" /> Compare tools for your #1 problem</h2>
      <div className="st-weights"><strong>How we weighted this for you:</strong> {review.weights.filter(w => w.weight > 0).map(w => `${w.label} ${w.weight}%`).join(' · ')}<ul>{review.weightReasons.map(x => <li key={x}>{x}</li>)}</ul>
        <p><strong>Fit</strong> is how well a tool suits your business. <strong>Confidence</strong> is how much of that we could verify; unknown facts lower confidence and are never guessed. <a href="/methodology">How we rate</a></p></div>
      {review.notes.map(n => <p key={n} className="dx-notice"><Info size={15} aria-hidden="true" /> {n}</p>)}
      {top.length > 1 && <div className="st-compare-wrap"><table className="st-compare"><caption>Top picks side by side</caption>
        <thead><tr><th scope="col">Tool</th>{top.map(t => <th scope="col" key={t.toolId}>{t.name}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Fit for you</th>{top.map(t => <td key={t.toolId}>{t.fit}</td>)}</tr>
          <tr><th scope="row">Confidence</th>{top.map(t => <td key={t.toolId}>{t.confidence}</td>)}</tr>
          <tr><th scope="row">Monthly cost</th>{top.map(t => <td key={t.toolId}>{t.cost.label}</td>)}</tr>
          <tr><th scope="row">Your requirements</th>{top.map(t => <td key={t.toolId}>{t.requirementsMet ?? '—'}</td>)}</tr>
          <tr><th scope="row">Your software</th>{top.map(t => <td key={t.toolId}>{t.compatibility.summary}</td>)}</tr>
          {(['security', 'ease'] as const).map(id => <tr key={id}><th scope="row">{top[0].pillars.find(p => p.id === id)!.label}</th>{top.map(t => <td key={t.toolId}>{t.pillars.find(p => p.id === id)!.score ?? 'n/a'}</td>)}</tr>)}
        </tbody></table></div>}
      <div className="dx-list">{top.map((t, i) => <ReviewCard key={t.toolId} r={t} rank={i + 1} />)}</div>
      {more.length > 0 && <>
        <h3 className="st-sub">Worth a look ({more.length})</h3>
        <p className="dx-notice">These address your needs but have lower confidence or fit. Check them before buying.</p>
        <div className="dx-list">{more.slice(0, showAll ? more.length : 4).map(t => <ReviewCard key={t.toolId} r={t} />)}</div>
        {more.length > 4 && !showAll && <button type="button" className="button secondary" onClick={() => setShowAll(true)}>Show {more.length - 4} more</button>}
      </>}
      {out.length > 0 && <details className="dx-excluded"><summary>{out.length} tool{out.length > 1 ? 's' : ''} not suitable for you</summary><ul>{out.map(t => <li key={t.toolId}><strong>{t.name}</strong>: {t.gates.join(' ')}</li>)}</ul></details>}
    </section>

    {/* ── Integration: adoption ── */}
    <section id="adopt" className="st-section" aria-labelledby="adopt-h">
      <h2 id="adopt-h"><Check size={20} aria-hidden="true" /> Get started</h2>
      {integration.timeline.length > 0 && <ol className="st-timeline">{integration.timeline.map(t => <li key={t}>{t}</li>)}</ol>}
      <p className="st-success"><strong>How you’ll know it worked:</strong> {integration.successMeasure}. {integration.checkIn}</p>
      {integration.adoption.map(a => <details key={a.toolId} className="st-adopt" open={a.order === 1}>
        <summary><span className="dx-rank">{a.order}</span> {a.name} <em>{a.effort}</em></summary>
        <ol>{a.steps.map(s => <li key={s.title + s.detail}><strong>{s.title}.</strong> {s.detail}</li>)}</ol>
      </details>)}
      {integration.advisor && <div className="st-advisor"><strong>Free, neutral local help</strong><p>{integration.advisor.reason}{brief.business.state ? ` Advisors serve ${brief.business.state}.` : ''} These are public programmes; they do not sell software.</p>
        <ul>{integration.advisor.links.map(l => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.label} <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></div>}
    </section>

    <CheckIn token={r.planToken} tools={r.checkInTools} />

    <section id="unknowns" className="st-section" aria-labelledby="unk-h">
      <h2 id="unk-h"><Info size={20} aria-hidden="true" /> What we don’t know yet</h2>
      {brief.unknowns.length ? <ul className="st-unknowns">{brief.unknowns.map(u => <li key={u.field}>{u.effect}</li>)}</ul> : <p className="dx-notice">You answered everything that affects your results.</p>}
      <p className="dx-mode"><Info size={15} aria-hidden="true" /> {discovery.modeNote} Prices and features come from vendor pages; we have not tested tools in vendor accounts.</p>
    </section>

    <div className="dx-footer-actions">
      <button type="button" className="text-button" onClick={onEdit}>Edit my answers</button>
      <button type="button" className="text-button" onClick={download}><Download size={15} /> Download my plan</button>
      <button type="button" className="text-button" onClick={onRestart}>Start over</button>
      <span>Questionnaire {brief.questionnaireVersion} · discovery {discovery.engineVersion} · review {review.reviewVersion} · integration {integration.integrationVersion}</span>
    </div>
  </div>;
}

function CheckIn({ token, tools }: { token: string; tools: { toolId: string; name: string }[] }) {
  const [toolId, setToolId] = useState(tools[0]?.toolId ?? '');
  const [adopted, setAdopted] = useState('');
  const [fixed, setFixed] = useState('');
  const [hours, setHours] = useState('');
  const [days, setDays] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (!tools.length) return null;
  const pills = <T extends string>(opts: Record<T, string>, value: string, set: (v: T) => void, name: string) => <div className="st-options" role="group" aria-label={name}>{(Object.entries(opts) as [T, string][]).map(([k, v]) => <button type="button" key={k} className={`pill st-pill ${value === k ? 'active' : ''}`} aria-pressed={value === k} onClick={() => set(k)}>{v}</button>)}</div>;
  async function send() {
    setErr(''); setMsg('');
    if (!adopted) { setErr('Tell us whether you used it.'); return; }
    if (adopted !== 'no' && !fixed) { setErr('Tell us whether it fixed the problem.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/outcomes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, toolId, adopted, ...(fixed && { fixed }), ...(hours && { hoursSaved: hours }), ...(days && { daysToValue: days }) }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not save your result.');
      setMsg(body.message); setAdopted(''); setFixed(''); setHours(''); setDays('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save your result.'); } finally { setBusy(false); }
  }
  return <section id="checkin" className="st-section" aria-labelledby="ci-h">
    <h2 id="ci-h"><Check size={20} aria-hidden="true" /> Tried one of these? Tell owners like you</h2>
    <p className="dx-notice"><Info size={15} aria-hidden="true" /> Only owners who received a plan from us can report, once per tool. Results from businesses like yours count most, and nobody can pay to change them. In the product, check-ins open 14 days after your plan; this demo opens them now.</p>
    <div className="st-checkin">
      <label className="st-field">Which tool?<select value={toolId} onChange={e => setToolId(e.target.value)}>{tools.map(t => <option key={t.toolId} value={t.toolId}>{t.name}</option>)}</select></label>
      <fieldset className="st-group"><legend>Did you use it?</legend>{pills({ yes: 'Yes, still using it', tried: 'Tried it, stopped', no: 'Did not use it' }, adopted, setAdopted, 'Did you use it?')}</fieldset>
      {adopted && adopted !== 'no' && <>
        <fieldset className="st-group"><legend>Did it fix the problem?</legend>{pills({ yes: 'Yes', partly: 'Partly', no: 'No' }, fixed, setFixed, 'Did it fix the problem?')}</fieldset>
        <fieldset className="st-group"><legend>Hours saved per week <span className="st-optional">Optional</span></legend>{pills({ '0': 'None', '1-2': '1–2', '3-5': '3–5', '6+': '6+' }, hours, setHours, 'Hours saved')}</fieldset>
        <fieldset className="st-group"><legend>Days until it was useful <span className="st-optional">Optional</span></legend>{pills({ '1': 'Same day', '2-7': '2–7', '8-30': '8–30', '30+': '30+' }, days, setDays, 'Days until useful')}</fieldset>
      </>}
      {err && <p className="dx-error" role="alert">{err}</p>}
      {msg && <p className="dx-notice" role="status"><Check size={15} aria-hidden="true" /> {msg}</p>}
      <button type="button" className="button primary" disabled={busy} onClick={send}>{busy ? 'Saving…' : 'Share my result'}</button>
    </div>
  </section>;
}

const CONN_CLASS: Record<string, string> = { 'built-in': 'ok', native: 'ok', zapier: '', manual: 'muted' };
function save(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Connect({ r }: { r: PlanResult }) {
  const [url, setUrl] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const recipes = r.integration.recipes;
  if (!r.integration.recommended) return null;
  async function send() {
    setBusy(true); setErr(''); setMsg('');
    try {
      const res = await fetch('/api/integrations/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim(), payload: planToWebhookPayload(r) }), signal: AbortSignal.timeout(15000) });
      const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Could not send.'); setMsg(body.message);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not send.'); } finally { setBusy(false); }
  }
  const auto = recipes.filter(x => x.connection !== 'manual').length;
  return <section id="connect" className="st-section" aria-labelledby="connect-h">
    <h2 id="connect-h"><Layers3 size={20} aria-hidden="true" /> Connect it to your tools</h2>
    <p className="dx-notice"><Info size={15} aria-hidden="true" /> {auto} of {recipes.length} workflows can run automatically with software you already use. We plan the workflows; the tools themselves (or Zapier/Make) run them, so we never hold your passwords.</p>
    <ul className="cn-list">{recipes.map(x => <li key={x.id} className="cn-item">
      <div className="cn-head"><strong>{x.title}</strong><span className={`dx-badge ${CONN_CLASS[x.connection]}`}>{x.connectionLabel}</span></div>
      <p>{x.plain}</p>
      {x.humanApproval && <p className="dx-missing">✋ {x.humanApproval}</p>}
      {x.guardrail && <p className="dx-missing">$ {x.guardrail}</p>}
      {(x.evidence || x.zapierUrl) && <div className="dx-sources">
        {x.evidence && <a href={x.evidence.url} target="_blank" rel="noopener noreferrer">{x.evidence.label} <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>}
        {x.zapierUrl && <a href={x.zapierUrl} target="_blank" rel="noopener noreferrer">Set it up on Zapier <ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>}
      </div>}
    </li>)}</ul>
    <div className="cn-actions">
      <button type="button" className="button secondary" onClick={() => save('bizzimpact-ai-plan.ics', planToIcs(r), 'text/calendar;charset=utf-8')}><Download size={15} /> Add timeline to my calendar</button>
      <button type="button" className="button secondary" onClick={() => save('bizzimpact-ai-plan.csv', planToCsv(r), 'text/csv;charset=utf-8')}><Download size={15} /> Open in Excel / Google Sheets</button>
      <button type="button" className="button secondary" onClick={() => save('bizzimpact-workflows.json', JSON.stringify(recipes, null, 2), 'application/json')}><Download size={15} /> Workflow recipes (JSON)</button>
    </div>
    <div className="cn-hook">
      <label className="st-field" htmlFor="cn-url">Send this plan to my Zapier or Make <span className="st-optional">Optional · creates tasks, sheet rows or reminders in apps you already use</span></label>
      <p className="dx-missing">In Zapier, create a Zap with “Webhooks by Zapier → Catch Hook” (in Make, a “Custom webhook”) and paste its URL here. We send the plan once and store nothing.</p>
      <div className="st-custom"><input id="cn-url" value={url} maxLength={500} placeholder="https://hooks.zapier.com/hooks/catch/…" onChange={e => setUrl(e.target.value)} />
        <button type="button" className="button primary" disabled={busy || !url.trim()} onClick={send}>{busy ? 'Sending…' : 'Send plan'}</button></div>
      {err && <p className="dx-error" role="alert">{err}</p>}
      {msg && <p className="dx-notice" role="status"><Check size={15} aria-hidden="true" /> {msg}</p>}
    </div>
  </section>;
}
