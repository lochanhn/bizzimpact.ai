import type { Metadata } from 'next';
import { Sprout } from 'lucide-react';
import { tools } from '@/lib/catalog';
import { CAPABILITIES } from '@/lib/discovery/taxonomy';
import { STRUGGLES, FOLLOWUPS } from '@/lib/intake/bank';
import { APPS, LINKS, ZAPIER } from '@/lib/integration/graph';
import { TOOL_FACTS } from '@/lib/review/facts';
import { liveCatalogue } from '@/lib/discovery/live';
import { DEFAULT_WEIGHTS } from '@/lib/review/review';
import '../discover/discover.css';
import '../start/start.css';
import './architecture.css';

export const metadata: Metadata = { title: 'Architecture — bizzimpact.ai', description: 'How the Discovery, Review and Integration engines fit together, what is built and what comes next.' };

type Part = { name: string; detail: string; built: boolean };
function Engine({ n, title, question, contract, parts }: { n: number; title: string; question: string; contract: string; parts: Part[] }) {
  return <section className="ar-engine" aria-labelledby={`eng-${n}`}>
    <div className="ar-engine-head"><span className="dx-rank">{n}</span><div><h3 id={`eng-${n}`}>{title}</h3><p>{question}</p></div></div>
    <ul>{parts.map(p => <li key={p.name} className={p.built ? 'built' : 'next'}><strong>{p.name}</strong><span>{p.detail}</span><em>{p.built ? 'Built' : '16-week'}</em></li>)}</ul>
    <div className="ar-contract">Outputs → <code>{contract}</code></div>
  </section>;
}

export default async function Architecture() {
  const live = await liveCatalogue();
  const liveCount = live.reduce((n, l) => n + l.candidates.length, 0);
  const gaps = CAPABILITIES.filter(c => c.area === 'gap').length;
  return <>
    <header><div className="nav-wrap">
      <a className="brand" href="/" aria-label="bizzimpact.ai home"><span className="brand-mark"><Sprout size={23} /></span><span>bizzimpact<span className="brand-ai">.ai</span></span></a>
      <nav aria-label="Main"><a className="dx-nav-link" href="/methodology">How we rate</a><a className="dx-nav-link" href="/start">Start your AI check-up</a></nav>
    </div></header>
    <main className="wrap st ar" id="main">
      <div className="eyebrow"><span className="tiny-star">✦</span> ARCHITECTURE</div>
      <h1>Three engines, one plan</h1>
      <p className="st-lead"><strong>Rules at the core, AI at the edges.</strong> Matching, rating and planning are deterministic, explainable and free to run. AI is used only where rules fall short (understanding unusual wording, finding new tools), and its output is always checked against our data.</p>

      <div className="ar-flow" aria-label="Flow">
        <span>Owner</span><i aria-hidden="true">→</i><span>Check-up or own words</span><i aria-hidden="true">→</i><span className="ar-key">Business Brief</span><i aria-hidden="true">→</i><span>Discover</span><i aria-hidden="true">→</i><span>Review</span><i aria-hidden="true">→</i><span>Integrate</span><i aria-hidden="true">→</i><span className="ar-key">AI plan</span>
      </div>

      <div className="ar-grid">
        <Engine n={0} title="Intake" question="What does this business need?" contract="BusinessBrief" parts={[
          { name: 'Six-area check-up', detail: `${STRUGGLES.length} struggles in owner language, ${FOLLOWUPS.length} conditional follow-ups, optional deep dive, review screen`, built: true },
          { name: 'Own-words entry', detail: 'Free text → needs, then hand-off to the full check-up', built: true },
          { name: 'Validation', detail: 'Inconsistent answers rejected, “Not sure” kept as an unknown', built: true },
          { name: 'Saved profiles', detail: 'Accounts and saved briefs (Supabase auth already wired)', built: false },
        ]} />
        <Engine n={1} title="Discovery" question="Which tools could solve it?" contract="DiscoveryResult" parts={[
          { name: 'Capability taxonomy', detail: `${CAPABILITIES.length} defined needs; ${gaps} with no reviewed tool yet are reported honestly`, built: true },
          { name: 'Reviewed catalogue', detail: `${tools.length} tools with sources and check dates`, built: true },
          { name: 'AI fallback interpreter', detail: 'Only when rules find no need; may only choose from the taxonomy', built: true },
          { name: 'Live web discovery', detail: `Cited, de-duplicated, labelled “not yet verified”; ${liveCount} products found so far`, built: true },
          { name: 'Scheduled ingestion', detail: 'App marketplaces, Zapier directory, AI directories → candidates → human approval', built: false },
        ]} />
        <Engine n={2} title="Review" question="Which suits THIS business?" contract="ReviewResult" parts={[
          { name: 'Gates', detail: 'Cost at your usage, yearly billing, must-keep software, required features', built: true },
          { name: 'Five fit pillars', detail: Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => `${k} ${v}%`).join(' · ') + ', re-weighted per owner', built: true },
          { name: 'Cited trust facts', detail: `${Object.keys(TOOL_FACTS).length} tools: SOC 2/ISO, AI-training policy, retention, HIPAA, setup tier, each quoted from vendor pages`, built: true },
          { name: 'Proven by owners like you', detail: 'Signed-plan check-ins, similarity-weighted, Bayesian + Wilson; no effect until evidence exists', built: true },
          { name: 'Confidence axis', detail: 'Evidence level, completeness, 3%/month age decay; low confidence never a top pick', built: true },
          { name: 'Verified use', detail: 'Invoice or account proof for check-ins; anomaly detection at scale; human review of all extracted facts', built: false },
        ]} />
        <Engine n={3} title="Integration" question="How do they work together, and how do I start?" contract="IntegrationResult" parts={[
          { name: 'Integration graph', detail: `${APPS.length} everyday apps, ${LINKS.length} sourced links; ${Object.keys(ZAPIER.tools).length} tools verified in Zapier’s directory`, built: true },
          { name: 'Workflow recipes', detail: '“When X happens → do Y in your app”, machine-readable, with human-approval rules and cost guardrails', built: true },
          { name: 'Hand-offs that run today', detail: 'Calendar file, spreadsheet, and one-click send to the owner’s own Zapier/Make (allow-listed, nothing stored)', built: true },
          { name: 'Bundle builder', detail: 'Smallest set covering your needs within total budget', built: true },
          { name: 'Adoption plan', detail: 'Order, effort, tests, undo, success measure, SBDC/SCORE/SBA hand-off', built: true },
          { name: 'Read-only connections', detail: 'Detect each owner’s software via a unified-API partner (e.g. Merge, Codat); buy, don’t build', built: false },
          { name: 'One-click templates', detail: 'Compile recipes into Zapier/Make templates; execution stays with trusted platforms', built: false },
        ]} />
      </div>

      <section className="st-section"><h2>Why this design scales</h2>
        <table className="st-compare"><thead><tr><th scope="col">Principle</th><th scope="col">What it buys us</th></tr></thead><tbody>
          <tr><td>Engines talk through versioned contracts</td><td>Any engine can be replaced or scaled alone (e.g. an AI-led intake producing the same Brief)</td></tr>
          <tr><td>Questions, needs and tags are data</td><td>New industries and needs are data edits; tests enforce integrity</td></tr>
          <tr><td>Rules at the core, AI at the edges</td><td>About $0 per plan; AI around $0.008 per live search; capped spend; fully testable</td></tr>
          <tr><td>Provenance on every fact, unknowns never guessed</td><td>Trust, and a clear path to automated re-checking</td></tr>
          <tr><td>Measured</td><td>Synthetic holdout: 14/15 rules-only cases passed; accepted tool in the top three for all labelled cases. AI-fallback results are contributor-reported.</td></tr>
        </tbody></table>
      </section>

      <section className="st-section"><h2>From MVP to product (16 weeks)</h2>
        <table className="st-compare"><thead><tr><th scope="col">Weeks</th><th scope="col">Build</th><th scope="col">Measure</th></tr></thead><tbody>
          <tr><td>1–3</td><td>Move catalogue, claims (one row per fact with source and date), runs and live candidates to Postgres; accounts and saved plans</td><td>Plans saved per owner; zero data loss</td></tr>
          <tr><td>4–6</td><td>Deepen catalogue to 500 plan-verified tools; human approval queue for live finds; 90-day re-checks</td><td>% facts verified; median evidence age</td></tr>
          <tr><td>7–9</td><td>Background jobs for ingestion from app marketplaces and the Zapier directory; action-level integration data</td><td>Verified tool↔app links; gaps closed</td></tr>
          <tr><td>10–12</td><td>Read-only connections (QuickBooks, Square, Google) to detect each owner’s software; Spanish</td><td>Questions answered automatically; completion rate</td></tr>
          <tr><td>13–16</td><td>Pilot with an SBDC and a trade association; 30-day outcome check-ins feeding confidence</td><td>Owners who adopt; “problem fixed” rate</td></tr>
        </tbody></table>
      </section>
    </main>
  </>;
}
