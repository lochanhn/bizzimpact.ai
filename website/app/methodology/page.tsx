import type { Metadata } from 'next';
import { Sprout } from 'lucide-react';
import { PILLARS, REVIEW_VERSION, type PillarId } from '@/lib/review/review';
import { TOOL_FACTS, ICI_LABEL } from '@/lib/review/facts';
import { CATALOG_VERSION, CHECKED, tools } from '@/lib/catalog';
import { CAPABILITIES } from '@/lib/discovery/taxonomy';
import { STRUGGLES, QUESTIONNAIRE_VERSION } from '@/lib/intake/bank';
import '../discover/discover.css';
import '../start/start.css';

export const metadata: Metadata = { title: 'How recommendations work — bizzimpact.ai', description: 'How bizzimpact.ai finds, checks and explains tools without exposing misleading scores.' };

export default function Methodology() {
  const gaps = CAPABILITIES.filter(c => c.area === 'gap').length;
  return <>
    <header><div className="nav-wrap">
      <a className="brand" href="/" aria-label="bizzimpact.ai home"><span className="brand-mark"><Sprout size={23} /></span><span>bizzimpact<span className="brand-ai">.ai</span></span></a>
      <nav aria-label="Main"><a className="dx-nav-link" href="/start">Start your AI check-up</a></nav>
    </div></header>
    <main className="wrap st" id="main">
      <div className="eyebrow"><span className="tiny-star">✦</span> PUBLISHED METHOD · REVIEW {REVIEW_VERSION}</div>
      <h1>How we find, check and explain AI tools</h1>
      <p className="st-lead">Recommendations use your needs and source-backed product facts. Nobody can pay to change a result.</p>

      <section className="st-section"><h2>1. Discovery: what could solve your problem</h2>
        <p>Your answers ({STRUGGLES.length} plain-language struggles in questionnaire {QUESTIONNAIRE_VERSION}) map to {CAPABILITIES.length} defined capabilities. We search our reviewed catalogue of {tools.length} tools (catalogue {CATALOG_VERSION}, sources checked {CHECKED}). For {gaps} known needs we have no reviewed tool yet; we say so instead of showing something unsuitable.</p></section>

      <section className="st-section"><h2>2. Review: what suits your business</h2>
        <p><strong>Gates first.</strong> A tool is marked “not suitable”, with the reason, if it costs more than your total budget <em>at your usage</em>, only offers yearly billing when you said no, cannot work with software you must keep, or cannot do what you asked on any reviewed plan. Gates are never averaged away.</p>
        <p><strong>Then five practical questions</strong>, each with a written reason. Missing facts remain unknown instead of being treated as good or bad:</p>
        <table className="st-compare"><thead><tr><th scope="col">Area</th><th scope="col">Question</th></tr></thead>
          <tbody>{(Object.keys(PILLARS) as PillarId[]).map(id => <tr key={id}><td>{PILLARS[id].label}</td><td>{PILLARS[id].question}</td></tr>)}</tbody></table>
        <p><strong>Priorities are personal.</strong> A tight budget makes cost more important. Preferring help with setup makes ease more important. Must-keep software raises compatibility. Sensitive data or “approve everything” raises trust and control.</p>
        <p><strong>Evidence strength is a safety gate.</strong> Plan-level evidence, requirement coverage and freshness affect internal ordering. Weakly supported tools stay under “Worth a look” with a list of facts to check; customers are shown the reasons rather than a numerical score.</p>
        <p><strong>Security &amp; privacy from the vendor’s own words.</strong> For {Object.keys(TOOL_FACTS).length} tools we extracted SOC 2/ISO statements, whether your data trains their AI, data retention and HIPAA availability, each with an exact quote from the vendor’s own policy pages (blog posts don’t count). Badges: green (certification and a clear AI-training policy), yellow (some commitments), grey (not enough public information; never treated as bad), red (uses customer data to train AI, only after our team has reviewed the quote).</p>
        <p><strong>Setup categories.</strong> {Object.values(ICI_LABEL).join(' · ')}. Categories come from vendor setup pages such as phone forwarding, website snippets and API-key requirements, then are compared with the help you said is available.</p>
        <p><strong>Feedback from owners like you.</strong> Only owners who received a plan can report an outcome, once per tool, after using it. Similar businesses count more, older reports fade and suspicious bursts are held for review. Thin feedback never overrules source evidence.</p>
        <p><strong>Star reviews are not used as a shortcut.</strong> The result is based on the needs of your business and the product facts we can support.</p></section>

      <section className="st-section"><h2>3. Integration: making tools work together</h2>
        <p>We grade each tool against the software you use: <em>built into software you use</em>, <em>direct connection documented</em>, <em>connects through Zapier</em>, <em>not supported</em>, or <em>not yet verified</em>, always with the source. We then find the smallest set of tools that covers your needs within your total budget, and build an adoption plan with tests, undo steps and a 30-day check-in.</p></section>

      <section className="st-section"><h2>4. Neutrality and corrections</h2>
        <ul className="st-unknowns">
          <li>No vendor pays for inclusion, ordering or plans. If we ever earn referral fees, they will be disclosed and will not affect recommendations.</li>
          <li>Compliance (HIPAA, PCI, SOC 2) is shown as a vendor statement to verify, never as our certification.</li>
          <li>We have not tested tools inside vendor accounts. Setup guidance is documentation-based.</li>
          <li>Found an error? Tell us and we will correct it and date the change.</li>
        </ul></section>
    </main>
  </>;
}
