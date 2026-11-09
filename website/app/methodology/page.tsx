import type { Metadata } from 'next';
import { Sprout } from 'lucide-react';
import { DEFAULT_WEIGHTS, EVIDENCE_DECAY_PER_MONTH, OWNER_FULL_AT, OWNER_MAX_WEIGHT, PILLARS, REVIEW_VERSION, type PillarId } from '@/lib/review/review';
import { TOOL_FACTS, ICI_LABEL } from '@/lib/review/facts';
import { CATALOG_VERSION, CHECKED, tools } from '@/lib/catalog';
import { CAPABILITIES } from '@/lib/discovery/taxonomy';
import { STRUGGLES, QUESTIONNAIRE_VERSION } from '@/lib/intake/bank';
import '../discover/discover.css';
import '../start/start.css';

export const metadata: Metadata = { title: 'How we rate — bizzimpact.ai', description: 'The published method behind bizzimpact.ai discovery, ratings and plans, and our neutrality policy.' };

export default function Methodology() {
  const gaps = CAPABILITIES.filter(c => c.area === 'gap').length;
  return <>
    <header><div className="nav-wrap">
      <a className="brand" href="/" aria-label="bizzimpact.ai home"><span className="brand-mark"><Sprout size={23} /></span><span>bizzimpact<span className="brand-ai">.ai</span></span></a>
      <nav aria-label="Main"><a className="dx-nav-link" href="/start">Start your AI check-up</a></nav>
    </div></header>
    <main className="wrap st" id="main">
      <div className="eyebrow"><span className="tiny-star">✦</span> PUBLISHED METHOD · REVIEW {REVIEW_VERSION}</div>
      <h1>How we find, rate and plan AI tools</h1>
      <p className="st-lead">Every weight and rule is published here. Nobody can pay to change a result.</p>

      <section className="st-section"><h2>1. Discovery: what could solve your problem</h2>
        <p>Your answers ({STRUGGLES.length} plain-language struggles in questionnaire {QUESTIONNAIRE_VERSION}) map to {CAPABILITIES.length} defined capabilities. We search our reviewed catalogue of {tools.length} tools (catalogue {CATALOG_VERSION}, sources checked {CHECKED}). For {gaps} known needs we have no reviewed tool yet; we say so instead of showing something unsuitable.</p></section>

      <section className="st-section"><h2>2. Review: what suits your business</h2>
        <p><strong>Gates first.</strong> A tool is marked “not suitable”, with the reason, if it costs more than your total budget <em>at your usage</em>, only offers yearly billing when you said no, cannot work with software you must keep, or cannot do what you asked on any reviewed plan. Gates are never averaged away.</p>
        <p><strong>Then five fit pillars</strong>, each 0–100 with a written reason, or “n/a” when we lack the facts (an unknown is never treated as good or bad):</p>
        <table className="st-compare"><thead><tr><th scope="col">Pillar</th><th scope="col">Question</th><th scope="col">Default weight</th></tr></thead>
          <tbody>{(Object.keys(PILLARS) as PillarId[]).map(id => <tr key={id}><td>{PILLARS[id].label}</td><td>{PILLARS[id].question}</td><td>{id === 'owners' ? `0%, growing to ${OWNER_MAX_WEIGHT}% at ${OWNER_FULL_AT} similar reports` : `${DEFAULT_WEIGHTS[id]}%`}</td></tr>)}</tbody></table>
        <p><strong>Weights are personal.</strong> A tight budget raises the weight of cost. Preferring help with setup raises ease. Must-keep software raises compatibility. Sensitive data or “approve everything” raises trust &amp; control. Your results page shows the exact weights used and why.</p>
        <p><strong>Confidence is a separate score.</strong> It reflects how much of the rating rests on verified facts: plan-level evidence, how many pillars and requirements are known, and how fresh the evidence is. Evidence loses {Math.round(EVIDENCE_DECAY_PER_MONTH * 100)}% weight per month. Tools with low confidence cannot be top picks; they appear under “Worth a look” with a list of what to check.</p>
        <p><strong>Security &amp; privacy from the vendor’s own words.</strong> For {Object.keys(TOOL_FACTS).length} tools we extracted SOC 2/ISO statements, whether your data trains their AI, data retention and HIPAA availability, each with an exact quote from the vendor’s own policy pages (blog posts don’t count). Badges: green (certification and a clear AI-training policy), yellow (some commitments), grey (not enough public information; never treated as bad), red (uses customer data to train AI, only after our team has reviewed the quote).</p>
        <p><strong>Objective setup tiers.</strong> {Object.entries(ICI_LABEL).map(([k, v]) => `Tier ${k}: ${v}`).join(' · ')}. Tiers come from the vendor’s setup pages (e.g. phone call-forwarding, website snippets, API keys), and are scored against your comfort with setup.</p>
        <p><strong>Proven by owners like you.</strong> Only owners who received a plan from us can report results, once per tool, after using it. Reports from businesses like yours (same industry and size) count most and older reports fade. A Bayesian average keeps a few early reports near neutral, and “at least X% say it fixed the problem” uses the Wilson lower bound. Bursts of reports are held for review. With no reports, this pillar has no effect either way.</p>
        <p><strong>Reviews are not the rating.</strong> Star ratings cluster too closely to separate tools and are the same for everyone; we rate fit for <em>your</em> business.</p></section>

      <section className="st-section"><h2>3. Integration: making tools work together</h2>
        <p>We grade each tool against the software you use: <em>built into software you use</em>, <em>direct connection documented</em>, <em>connects through Zapier</em>, <em>not supported</em>, or <em>not yet verified</em>, always with the source. We then find the smallest set of tools that covers your needs within your total budget, and build an adoption plan with tests, undo steps and a 30-day check-in.</p></section>

      <section className="st-section"><h2>4. Neutrality and corrections</h2>
        <ul className="st-unknowns">
          <li>No vendor pays for inclusion, ranking, ratings or plans. If we ever earn referral fees, they will be disclosed and will not affect any score.</li>
          <li>Compliance (HIPAA, PCI, SOC 2) is shown as a vendor statement to verify, never as our certification.</li>
          <li>We have not tested tools inside vendor accounts. Setup guidance is documentation-based.</li>
          <li>Found an error? Tell us and we will correct it and date the change.</li>
        </ul></section>
    </main>
  </>;
}
