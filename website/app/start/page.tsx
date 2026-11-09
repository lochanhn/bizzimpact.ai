'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Info, Sprout, LoaderCircle } from 'lucide-react';
import {
  ADVISOR, ANNUAL, AREAS, AREA_ORDER, AUTONOMY, BUDGETS, CUSTOMERS, DATA_HANDLED, DEEP_DIVE, INDUSTRIES, INDUSTRY_SOFTWARE,
  SETUP_BY, SOFTWARE_GROUPS, TEAM_SIZES, TECH_COMFORT, TIMELINE, triggeredFollowups, visibleStruggles,
  type AreaId, type IndustryId,
} from '@/lib/intake/bank';
import type { Answers } from '@/lib/intake/brief';
import type { PlanResult } from '@/lib/pipeline';
import { Results } from './results';
import LocationFields from '@/components/phase1/location-fields';
import { locationLabel } from '@/lib/phase1/locations';

type Draft = {
  industry?: IndustryId; subtype?: string; description?: string; customers?: string; teamSize?: string; country?: string; state?: string;
  software: string[]; softwareStatus: 'listed' | 'none' | 'not-sure'; mustKeep: string[]; techComfort?: string; setupBy?: string;
  areas: AreaId[]; struggles: string[]; focus?: string; followups: Record<string, string | string[]>;
  deepDive: { W1?: string; W2?: { value: number; per: 'day' | 'week' | 'month' }; W3?: string; W4?: string; W5?: string };
  budget?: string; annual?: string; dataHandled: string[]; autonomy?: string; timeline?: string; advisor?: string; extra?: string;
};
const EMPTY: Draft = { country: 'US', software: [], softwareStatus: 'listed', mustKeep: [], areas: [], struggles: [], followups: {}, deepDive: {}, dataHandled: [] };
const KEY = 'bizzimpact-checkup-v1';
const STEPS = ['Your business', 'Your current setup', 'Where it hurts', 'What exactly', 'A few details', 'Budget & guardrails', 'Review'];
const DEMO: Draft = {
  industry: 'home', subtype: 'Landscaping / lawn care', customers: 'b2c', teamSize: '2-10', state: 'MD',
  software: ['QuickBooks', 'Google Calendar', 'Jobber'], softwareStatus: 'listed', mustKeep: ['Jobber'], techComfort: 'steps', setupBy: 'me',
  areas: ['service', 'marketing'], struggles: ['C1', 'C2', 'M1'], focus: 'C1',
  followups: { X2: 'request', X3: ['hours', 'busy'], X4: 'google', X5: ['emergencies'], X6: ['en', 'es'], X7: 'new', X8: ['facebook', 'instagram'], X9: 'schedule' },
  deepDive: { W1: 'nobody', W2: { value: 40, per: 'week' }, W3: '3-5', W4: 'customers', W5: 'Every call answered or captured' },
  budget: '50-149', annual: 'no', dataHandled: ['contacts'], autonomy: 'send', timeline: 'month', advisor: 'yes',
};

const CAFE_DEMO: Draft = {
  industry: 'food', subtype: 'Cafe / coffee shop', customers: 'b2c', teamSize: '2-10', state: 'MD',
  software: ['Square', 'Canva', 'QuickBooks'], softwareStatus: 'listed', mustKeep: ['Square'], techComfort: 'avoid', setupBy: 'nobody',
  areas: ['stock', 'money', 'marketing'], struggles: ['S1', 'F2', 'M1'], focus: 'S1',
  followups: { X12: ['sales'], X13: 'suggest', X10: 'quickbooks', X11: 'me', X7: 'repeat', X8: ['instagram'], X9: 'schedule' },
  deepDive: {}, budget: 'under-50', annual: 'no', dataHandled: ['financial'], autonomy: 'organise', timeline: 'month', advisor: 'yes',
};

function Pill({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <button type="button" className={`pill st-pill ${selected ? 'active' : ''}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>{selected && <Check size={12} aria-hidden="true" />} {children}</button>;
}
function Group({ legend, hint, children, required }: { legend: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return <fieldset className="st-group"><legend>{legend}{!required && <span className="st-optional"> Optional</span>}</legend>{hint && <p className="st-hint">{hint}</p>}<div className="st-options">{children}</div></fieldset>;
}
function Single<T extends string>({ legend, hint, options, value, onChange, required }: { legend: string; hint?: string; options: Record<T, string>; value?: string; onChange: (v: T) => void; required?: boolean }) {
  return <Group legend={legend} hint={hint} required={required}>{(Object.entries(options) as [T, string][]).map(([k, v]) => <Pill key={k} selected={value === k} onClick={() => onChange(k)}>{v}</Pill>)}</Group>;
}
function Multi({ legend, hint, options, value, onChange, exclusive, required }: { legend: string; hint?: string; options: Record<string, string>; value: string[]; onChange: (v: string[]) => void; exclusive?: string[]; required?: boolean }) {
  const toggle = (k: string) => {
    if (value.includes(k)) return onChange(value.filter(x => x !== k));
    if (exclusive?.includes(k)) return onChange([k]);
    onChange([...value.filter(x => !exclusive?.includes(x)), k]);
  };
  return <Group legend={legend} hint={hint} required={required}>{Object.entries(options).map(([k, v]) => <Pill key={k} selected={value.includes(k)} onClick={() => toggle(k)}>{v}</Pill>)}</Group>;
}

export default function StartPage() {
  const [d, setD] = useState<Draft>(EMPTY);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [custom, setCustom] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));

  useEffect(() => {
    // One-link demo for judges: /start?demo=landscaper (or cafe) loads and runs a worked example.
    const demoKey = new URL(window.location.href).searchParams.get('demo');
    const preset = demoKey === 'landscaper' ? DEMO : demoKey === 'cafe' ? CAFE_DEMO : null;
    if (preset) { setD(preset); setStep(STEPS.length - 1); submit(preset); return; }
    try { const raw = sessionStorage.getItem(KEY); if (raw) setD({ ...EMPTY, ...JSON.parse(raw) }); } catch { /* storage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } }, [d]);
  useEffect(() => { heading.current?.focus(); }, [step, result]);

  const ctx = { industry: d.industry, customers: d.customers, teamSize: d.teamSize, techComfort: d.techComfort };
  const areaOrder = useMemo(() => (d.industry && AREA_ORDER[d.industry]) || AREAS.map(a => a.id), [d.industry]);
  const followups = triggeredFollowups(d.struggles, d.areas);
  const tickedLabels = d.areas.flatMap(a => visibleStruggles(a, ctx)).filter(s => d.struggles.includes(s.id));

  function validate(s: number): string {
    if (s === 0) { if (!d.industry) return 'Choose what kind of business you run.'; if (!d.teamSize) return 'Tell us how many people work in the business.'; }
    if (s === 1) { if (d.softwareStatus === 'listed' && !d.software.length) return 'Pick the apps you use, or choose “None” or “Not sure”.'; if (!d.techComfort) return 'Tell us how comfortable you are setting up apps.'; if (!d.setupBy) return 'Tell us who would set up a new tool.'; }
    if (s === 2 && !d.areas.length) return 'Choose at least one area.';
    if (s === 3) { if (!d.struggles.length) return 'Tick at least one struggle.'; if (!d.focus || !d.struggles.includes(d.focus)) return 'Choose which one matters most right now.'; }
    if (s === 5) { if (!d.budget) return 'Choose a monthly budget (or “Not sure yet”).'; if (!d.dataHandled.length) return 'Tell us what information the tool would handle (or “Not sure”).'; if (!d.autonomy) return 'Choose what the tool may do on its own.'; }
    return '';
  }
  function next() { const e = validate(step); setError(e); if (!e) setStep(s => Math.min(STEPS.length - 1, s + 1)); }
  function back() { setError(''); setStep(s => Math.max(0, s - 1)); }

  function toAnswers(x: Draft): Answers {
    const live = triggeredFollowups(x.struggles, x.areas).map(f => f.id);
    return {
      industry: x.industry!, subtype: x.subtype || undefined, description: x.description || undefined, customers: x.customers as Answers['customers'],
      teamSize: x.teamSize as Answers['teamSize'], country: x.country ?? 'US', state: x.state as Answers['state'],
      software: x.softwareStatus === 'listed' ? x.software : [], softwareStatus: x.softwareStatus, mustKeep: x.mustKeep.filter(m => x.software.includes(m)),
      techComfort: x.techComfort as Answers['techComfort'], setupBy: x.setupBy as Answers['setupBy'],
      areas: x.areas, struggles: x.struggles, focus: x.focus!,
      followups: Object.fromEntries(Object.entries(x.followups).filter(([k, v]) => live.includes(k) && (Array.isArray(v) ? v.length : v))),
      deepDive: x.deepDive as Answers['deepDive'], budget: x.budget as Answers['budget'], annual: x.annual as Answers['annual'],
      dataHandled: x.dataHandled as Answers['dataHandled'], autonomy: x.autonomy as Answers['autonomy'],
      timeline: x.timeline as Answers['timeline'], advisor: x.advisor as Answers['advisor'], extra: x.extra?.trim() || undefined,
    };
  }
  async function submit(x: Draft = d) {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toAnswers(x)), signal: AbortSignal.timeout(15000) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'We could not build your plan.');
      setResult(body);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'That took too long. Please try again.'); }
    finally { setBusy(false); }
  }
  function demo() { setD(DEMO); setStep(STEPS.length - 1); setResult(null); }
  function restart() { setD(EMPTY); setStep(0); setResult(null); try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }

  const header = <header><div className="nav-wrap">
    <a className="brand" href="/" aria-label="bizzimpact.ai home"><span className="brand-mark"><Sprout size={23} /></span><span>bizzimpact<span className="brand-ai">.ai</span></span></a>
    <nav aria-label="Main"><a className="dx-nav-link" href="/methodology">How we rate</a><a className="dx-nav-link" href="/dashboard">Dashboard</a><a className="dx-nav-link" href="/discover">Describe it in your own words</a></nav>
  </div></header>;

  if (result) return <>{header}<main className="wrap st" id="main"><a className="text-button" href="/dashboard"><ArrowLeft size={15}/>Back to dashboard</a><Results r={result} headingRef={heading} onEdit={() => { setResult(null); setStep(STEPS.length - 1); }} onRestart={restart} /></main></>;

  const subtypes = d.industry ? INDUSTRIES[d.industry].subtypes : [];
  const suggested = (d.industry && INDUSTRY_SOFTWARE[d.industry]) || [];

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    {header}
    <main className="wrap st" id="main">
      <a className="text-button" href="/dashboard"><ArrowLeft size={15}/>Back to dashboard</a>
      <div className="st-top">
        <div className="eyebrow"><span className="tiny-star">✦</span> AI CHECK-UP · STEP {step + 1} OF {STEPS.length}</div>
        {step === 0 && <button type="button" className="text-button" onClick={demo}>Try a filled-in example (landscaping business) <ArrowRight size={14} /></button>}
      </div>
      <div className="st-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <h1 tabIndex={-1} ref={heading}>{STEPS[step]}</h1>

      {step === 0 && <>
        <p className="st-why"><Info size={14} aria-hidden="true" /> A little context lets us show tools that suit your business, not just popular ones.</p>
        <Single legend="What kind of business do you run?" required options={Object.fromEntries(Object.entries(INDUSTRIES).map(([k, v]) => [k, v.label])) as Record<IndustryId, string>} value={d.industry} onChange={v => setD(x => ({ ...x, industry: v, subtype: undefined }))} />
        {subtypes.length > 0 && <Single legend="Which best describes it?" options={Object.fromEntries(subtypes.map(s => [s, s]))} value={d.subtype} onChange={v => set('subtype', v)} />}
        <Single legend="Who are your customers?" options={CUSTOMERS} value={d.customers} onChange={v => set('customers', v)} />
        <Single legend="How many people work in the business, including you?" required options={TEAM_SIZES} value={d.teamSize} onChange={v => set('teamSize', v)} />
        <LocationFields label="Where does your business operate?" value={{country:d.country??'US',region:d.state??null}} onChange={v=>setD(x=>({...x,country:v.country,state:v.region??undefined}))}/>
        <label className="st-field">In one sentence, what does your business do? <span className="st-optional">Optional</span>
          <input value={d.description ?? ''} maxLength={150} placeholder="e.g. We maintain residential yards and do seasonal cleanups." onChange={e => set('description', e.target.value)} /></label>
      </>}

      {step === 1 && <>
        <p className="st-why"><Info size={14} aria-hidden="true" /> Most owners want AI that works with what they already use, not a replacement.</p>
        <Group legend="Which software or apps do you use today?" required hint={suggested.length ? `Common for ${INDUSTRIES[d.industry!].label.toLowerCase()}: ${suggested.join(', ')}` : undefined}>
          <Pill selected={d.softwareStatus === 'none'} onClick={() => setD(x => ({ ...x, softwareStatus: x.softwareStatus === 'none' ? 'listed' : 'none', software: [], mustKeep: [] }))}>None</Pill>
          <Pill selected={d.softwareStatus === 'not-sure'} onClick={() => setD(x => ({ ...x, softwareStatus: x.softwareStatus === 'not-sure' ? 'listed' : 'not-sure', software: [], mustKeep: [] }))}>Not sure</Pill>
        </Group>
        {SOFTWARE_GROUPS.map(g => <div key={g.group} className="st-subgroup"><span>{g.group}</span><div className="st-options">{g.apps.map(app =>
          <Pill key={app} selected={d.software.includes(app)} onClick={() => setD(x => ({ ...x, softwareStatus: 'listed', software: x.software.includes(app) ? x.software.filter(s => s !== app) : [...x.software, app], mustKeep: x.mustKeep.filter(m => m !== app) }))}>{app}</Pill>)}</div></div>)}
        <div className="st-custom"><label htmlFor="st-custom">Something else?</label><input id="st-custom" value={custom} maxLength={60} placeholder="Type an app name" onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLButtonElement)?.click(); } }} />
          <button type="button" className="button secondary" onClick={() => { const v = custom.trim(); if (v && !d.software.includes(v)) setD(x => ({ ...x, softwareStatus: 'listed', software: [...x.software, v] })); setCustom(''); }}>Add</button></div>
        {d.software.length >= 2 && <Multi legend="Which of these would you NOT want to replace?" hint="Pick up to three. We will treat these as must-keep." options={Object.fromEntries(d.software.map(s => [s, s]))} value={d.mustKeep} onChange={v => set('mustKeep', v.slice(0, 3))} />}
        <Single legend="How comfortable are you setting up a new app?" required options={TECH_COMFORT} value={d.techComfort} onChange={v => set('techComfort', v)} />
        <Single legend="Who would set up a new tool?" required options={SETUP_BY} value={d.setupBy} onChange={v => set('setupBy', v)} />
      </>}

      {step === 2 && <>
        <p className="st-why"><Info size={14} aria-hidden="true" /> Pick up to three. We’ve ordered them for your type of business.</p>
        <fieldset className="st-group"><legend>Which parts of your business would you most like help with?</legend>
          <div className="st-areas">{areaOrder.map(id => { const a = AREAS.find(x => x.id === id)!; const on = d.areas.includes(id);
            return <button type="button" key={id} className={`st-area ${on ? 'on' : ''}`} aria-pressed={on} disabled={!on && d.areas.length >= 3}
              onClick={() => setD(x => { const areas = on ? x.areas.filter(y => y !== id) : [...x.areas, id]; const keep = new Set(areas.flatMap(ar => visibleStruggles(ar, ctx).map(s => s.id))); const struggles = x.struggles.filter(s => keep.has(s)); return { ...x, areas, struggles, focus: struggles.includes(x.focus ?? '') ? x.focus : undefined }; })}>
              <strong>{a.title}</strong><small>{a.subtitle}</small>{on && <Check size={16} aria-hidden="true" />}</button>; })}</div>
        </fieldset>
      </>}

      {step === 3 && <>
        <p className="st-why"><Info size={14} aria-hidden="true" /> Tick anything that sounds like you. Each tick tells us exactly what kind of tool to look for.</p>
        {d.areas.map(area => <fieldset key={area} className="st-group"><legend>{AREAS.find(a => a.id === area)!.title}</legend>
          <div className="st-checks">{visibleStruggles(area, ctx).map(s => <label key={s.id} className={`st-check ${d.struggles.includes(s.id) ? 'on' : ''}`}>
            <input type="checkbox" checked={d.struggles.includes(s.id)} onChange={() => setD(x => { const struggles = x.struggles.includes(s.id) ? x.struggles.filter(y => y !== s.id) : [...x.struggles, s.id]; return { ...x, struggles, focus: struggles.includes(x.focus ?? '') ? x.focus : struggles.length === 1 ? struggles[0] : undefined }; })} />
            <span>{s.label}</span></label>)}</div></fieldset>)}
        {tickedLabels.length > 0 && <fieldset className="st-group st-focus"><legend>Which ONE matters most right now?</legend>
          <div className="st-checks">{tickedLabels.map(s => <label key={s.id} className={`st-check ${d.focus === s.id ? 'on' : ''}`}><input type="radio" name="focus" checked={d.focus === s.id} onChange={() => set('focus', s.id)} /><span>{s.label}</span></label>)}</div></fieldset>}
      </>}

      {step === 4 && <>
        <p className="st-why"><Info size={14} aria-hidden="true" /> Only questions that change your results. Skip anything you’re unsure about.</p>
        {followups.length === 0 && <p className="dx-notice">No extra questions for your answers.</p>}
        {followups.map(f => f.multi
          ? <Multi key={f.id} legend={f.question} hint={f.why} options={f.options} value={([] as string[]).concat(d.followups[f.id] ?? [])} onChange={v => set('followups', { ...d.followups, [f.id]: v })} exclusive={['nothing', 'none']} />
          : <Single key={f.id} legend={f.question} hint={f.why} options={f.options} value={d.followups[f.id] as string | undefined} onChange={v => set('followups', { ...d.followups, [f.id]: v })} />)}
        <details className="st-deep" open={!!d.deepDive.W2}>
          <summary>Deep dive on your #1 problem <span>Optional · sharper costs and a clear success measure</span></summary>
          <Single legend={DEEP_DIVE.W1.question} options={DEEP_DIVE.W1.options} value={d.deepDive.W1} onChange={v => set('deepDive', { ...d.deepDive, W1: v })} />
          <fieldset className="st-group"><legend>{DEEP_DIVE.W2.question} <span className="st-optional">Optional · used to estimate usage-based prices</span></legend>
            <div className="st-inline"><input type="number" min={0} max={100000} aria-label="How many times" value={d.deepDive.W2?.value ?? ''} onChange={e => set('deepDive', { ...d.deepDive, W2: e.target.value === '' ? undefined : { value: Math.max(0, Math.round(Number(e.target.value))), per: d.deepDive.W2?.per ?? 'week' } })} />
              <select aria-label="Per" value={d.deepDive.W2?.per ?? 'week'} onChange={e => d.deepDive.W2 && set('deepDive', { ...d.deepDive, W2: { ...d.deepDive.W2, per: e.target.value as 'day' | 'week' | 'month' } })}><option value="day">per day</option><option value="week">per week</option><option value="month">per month</option></select></div></fieldset>
          <Single legend={DEEP_DIVE.W3.question} options={DEEP_DIVE.W3.options} value={d.deepDive.W3} onChange={v => set('deepDive', { ...d.deepDive, W3: v })} />
          <Single legend={DEEP_DIVE.W4.question} options={DEEP_DIVE.W4.options} value={d.deepDive.W4} onChange={v => set('deepDive', { ...d.deepDive, W4: v })} />
          <label className="st-field">{DEEP_DIVE.W5.question} <span className="st-optional">Optional</span><input value={d.deepDive.W5 ?? ''} maxLength={200} placeholder="e.g. Every call answered, or 3 hours a week back" onChange={e => set('deepDive', { ...d.deepDive, W5: e.target.value || undefined })} /></label>
        </details>
      </>}

      {step === 5 && <>
        <Single legend="What could you spend per month on new AI tools, in total?" required hint="In US dollars, across all tools together." options={BUDGETS} value={d.budget} onChange={v => set('budget', v)} />
        <Single legend="Would you pay yearly upfront for a discount?" options={ANNUAL} value={d.annual} onChange={v => set('annual', v)} />
        <Multi legend="What information would the tool handle?" required hint="We use this to flag privacy and compliance checks (like HIPAA or card-data rules)." options={DATA_HANDLED} value={d.dataHandled} onChange={v => set('dataHandled', v)} exclusive={['unsure']} />
        <Single legend="What may the tool do on its own?" required options={AUTONOMY} value={d.autonomy} onChange={v => set('autonomy', v)} />
        <Single legend="How soon do you want something working?" options={TIMELINE} value={d.timeline} onChange={v => set('timeline', v)} />
        <Single legend="Would you like free help from a local small-business advisor (SBA SBDC / SCORE)?" options={ADVISOR} value={d.advisor} onChange={v => set('advisor', v)} />
        <label className="st-field">Anything else we should know? <span className="st-optional">Optional · please leave out customer names and private details</span>
          <textarea value={d.extra ?? ''} maxLength={2000} rows={3} placeholder="e.g. We also forget to follow up on quotes." onChange={e => set('extra', e.target.value)} /></label>
      </>}

      {step === 6 && <ReviewBrief d={d} goto={setStep} />}

      {error && <p className="dx-error" role="alert">{error}</p>}
      <div className="st-nav">
        {step > 0 && <button type="button" className="button secondary" onClick={back}><ArrowLeft size={16} /> Back</button>}
        {step < STEPS.length - 1 && <button type="button" className="button primary" onClick={next}>Continue <ArrowRight size={16} /></button>}
        {step === STEPS.length - 1 && <button type="button" className="button primary large" disabled={busy} onClick={() => { for (let s = 0; s < STEPS.length - 1; s++) { const e = validate(s); if (e) { setStep(s); setError(e); return; } } submit(); }}>{busy ? <><LoaderCircle className="search-spinner" size={16} aria-hidden="true"/>Building your plan…</> : <>See my AI plan <ArrowRight size={17} /></>}</button>}
      </div>
    </main>
  </>;
}

function ReviewBrief({ d, goto }: { d: Draft; goto: (s: number) => void }) {
  const label = (o: Record<string, string>, k?: string) => (k ? o[k] ?? k : 'Not answered');
  const ctx = { industry: d.industry, customers: d.customers, teamSize: d.teamSize, techComfort: d.techComfort };
  const struggles = d.areas.flatMap(a => visibleStruggles(a, ctx)).filter(s => d.struggles.includes(s.id));
  const block = (title: string, step: number, rows: [string, string][]) => <section className="st-brief-block"><div><h2>{title}</h2><button type="button" className="text-button" onClick={() => goto(step)}>Edit</button></div>
    <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>;
  return <>
    <p className="st-why"><Info size={14} aria-hidden="true" /> Check this is right. Everything below is used to find, rate and plan your tools.</p>
    {block('Your business', 0, [['Business', `${d.industry ? INDUSTRIES[d.industry].label : 'Not answered'}${d.subtype ? ` · ${d.subtype}` : ''}`], ['Team', label(TEAM_SIZES, d.teamSize)], ['Location', locationLabel(d.country??'US',d.state??null)]])}
    {block('Your setup', 1, [['Software', d.softwareStatus === 'listed' ? d.software.join(', ') || 'None listed' : d.softwareStatus === 'none' ? 'None' : 'Not sure'], ['Must keep', d.mustKeep.join(', ') || 'Nothing specific'], ['Setup comfort', label(TECH_COMFORT, d.techComfort)], ['Set up by', label(SETUP_BY, d.setupBy)]])}
    {block('What to fix', 3, [['Areas', d.areas.map(a => AREAS.find(x => x.id === a)!.title).join(', ') || 'None'], ['Struggles', struggles.map(s => `${s.id === d.focus ? '★ ' : ''}${s.label}`).join(' · ') || 'None']])}
    {block('Must-haves', 5, [['Budget', label(BUDGETS, d.budget)], ['Yearly billing', label(ANNUAL, d.annual)], ['Information handled', d.dataHandled.map(x => DATA_HANDLED[x as keyof typeof DATA_HANDLED]).join(', ') || 'Not answered'], ['On its own it may', label(AUTONOMY, d.autonomy)]])}
  </>;
}
