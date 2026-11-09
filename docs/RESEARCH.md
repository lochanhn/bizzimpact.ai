# Research: small businesses, AI adoption and the tool-finding gap

bizzimpact.ai · AI for Small Business Hack-a-thon, Fall 2026 · November 8, 2026

This file is the single research reference for the pitch:
1. The market and the problem
2. What small-business owners actually need
3. Existing products and how they work
4. The gaps we fill
5. How we measured our own MVP

Every number links to its source. Detailed source notes, the downloaded papers and their limits are archived in [`Lochan/research/`](../Lochan/research/).

---

## 1. The market and the problem

| Fact | Source |
|---|---|
| **36+ million** US small businesses | SBA Office of Advocacy, state profiles release, June 30, 2025 ([advocacy.sba.gov](https://advocacy.sba.gov/category/newsroom/page/6)) |
| Only **19.8%** of US businesses used AI in any business function (May 2026) | US Census Bureau, Business Trends and Outlook Survey ([census.gov](https://census.gov/library/stories/2026/05/ai-use-businesses.html)) |
| **37%** of firms with 250+ employees use AI vs **under 20%** of firms with 4 or fewer | Same Census release |
| Use grew among firms with 20+ employees but **did not change significantly for firms with fewer than 20** (Dec 2025 – May 2026) | Same Census release |
| **57%** of AI-using firms use it in three or fewer business functions | Census working paper CES-WP-26-25 ([census.gov](https://www.census.gov/library/working-papers/2026/adrm/CES-WP-26-25.html)) |

**The gap is widening.** Larger firms are pulling ahead while the smallest businesses stay flat, and even adopters use AI narrowly. That is the challenge's premise.

Note: Census broadened its AI question in November 2025, so older figures aren't directly comparable. We use only the 2026 figures.

### Why owners don't adopt: the barriers are fit and effort, not awareness
| Finding | Population | Source |
|---|---|---|
| **54%** of firms planning to use AI reported difficulty **finding or adapting tools to their business needs**; **37%** cited implementation/training time | US employer firms planning AI use (N=810) | Federal Reserve, *2026 Report on Employer Firms*, p. 28 ([link](https://www.fedsmallbusiness.org/survey/2026-report-on-employer-firms)) |
| Among current AI users: **46%** struggle with accuracy, **43%** with fit/adaptation | Current AI users (N=2,203) | Same report |
| **29%** of owners prefer to leave working technology alone | US small businesses | NFIB, *Small Business and Technology*, 2025 ([PDF](https://www.nfib.com/wp-content/uploads/2025/06/2025-NFIB-Technology-Survey.pdf)) |
| Non-users: **57.3%** say AI doesn't suit their work, **52.5%** worry about information supplied to models, **49.8%** cite skill gaps | SMEs in seven non-US OECD countries | OECD, *Generative AI and the SME Workforce*, 2025 ([link](https://doi.org/10.1787/2d08b99d-en)) |
| Randomized access to AI business advice showed **no detectable average gain**; effects differed by firm | Kenyan entrepreneurs | Otis et al., *Management Science*, 2026 ([link](https://doi.org/10.1287/mnsc.2024.06909)) |

**What this means for the product:**
1. Owners need help with **fit** (which tool for *my* task), **effort** (can *I* set it up) and **data trust**.
2. They want AI that **works with software they already use**.
3. Access to AI alone doesn't create results, so the product must end in an **adoption plan with a success measure**.

The populations above differ, so we never combine these percentages.

---

## 2. What small-business owners need

From published owner accounts and industry reports (details in `Lochan/research/research-notes.md` and `research-round-2-notes.md`):

| Business | Reported pain | Source (in team archive) |
|---|---|---|
| Landscaping | Calls missed while on jobs; requests and quotes scattered across email, map pins and spreadsheets | S06, S07 |
| HVAC / trades | Losses between call intake, callback and booking; training and integration as barriers | S08, R2-P16 (ServiceTitan 2026) |
| Cafe | Dependable staff and repeat customers matter more than marketing posts | S05 |
| Restaurants | Food cost vs sales; reliability, POS integration and upfront cost block automation | S09, R2-P11 (TouchBistro 2025) |
| All sizes | Technology spread across many platforms; training support matters | R2-P10 (US Chamber) |

How this shaped the product:
- **The six-area check-up** (marketing, money, stock, customer service and calls, admin, growth): owners *recognise* their struggles instead of having to name an AI category.
- **Existing software comes first**, and must-keep tools are hard constraints.
- **A privacy and AI-training check** on every tool.
- **Honest gaps** when no good tool exists, e.g. restaurant inventory forecasting in our reviewed catalog.

---

## 3. Existing products and how they work

| Type | Products | How it works (published methodology) | What's missing for a small-business owner |
|---|---|---|---|
| AI tool directories | There's An AI For That (52,000+ tools), Futurepedia, Toolify | Scale-first catalogs, largely vendor-submitted, browsed by category | No matching; verification undocumented ([source](https://pasqualepillitteri.it/en/news/10481/theresanaiforthat-ai-directory)) |
| Curated AI directory | ToolDirectory.ai | AI runs the scale checks, a named editor signs off, 90-day re-checks, retired tools archived | Same verdict for everyone; no personal matching ([method](https://tooldirectory.ai/methodology)) |
| Review platforms | G2, Capterra | Crowd reviews → Satisfaction + Market Presence (G2) or ratings + popularity (Capterra); recent reviews weighted more (~3%/month decay at G2); small-business segment grids | Not personal; list prices; integration logos supplied by vendors; G2 publishes only some of its weights ([G2](https://research.g2.com/research-guidelines), [Capterra](https://capterra.com/resources/proprietary-data-research/)) |
| Requirement-matching quiz | FitGap | Requirement framework per category; quiz → requirement coverage 60% + industry/size fit 20% | General software, not AI; category-first; no current-software fit or adoption ([method](https://us.fitgap.com/methodology)) |
| Human advisors | Software Advice (Gartner) | 20–30 min call (budget, authority, need, timeline) → matched against 500+ criteria → lead sold to vendors | Vendor-paid, so not neutral; doesn't scale ([how it works](https://www.softwareadvice.com/resources/software-vendors-selection-process)) |
| Integration directory | Zapier | Integrations listed as triggers and actions between two apps | Shows what *can* connect, not what *should* be used together |
| "AI stack" articles | 2026 listicles | One fixed stack for everyone | Not personal; often affiliate-driven |
| Public support | SBA, SBDCs (~1,000 locations), SCORE | Free human advising and training | No tool matching. **Partners, not competitors** |

**No product combines problem-first discovery, personalised rating and integration and adoption planning for small businesses.**

---

## 4. The gaps we fill (and how)

| Gap | Our answer | Status |
|---|---|---|
| Owners must know the software category first | **Six-area check-up in owner language** (43 struggles) + free text with AI fallback | ✅ |
| Directories always show *something* | **Honest gaps** ("we won't invent one") + **live web discovery** of cited candidates labelled "not verified" | ✅ |
| Same score for everyone | **Personal weights**: tight budget raises cost, low tech comfort raises ease of setup, sensitive data raises security | ✅ |
| List prices | **True cost at the owner's usage**, including overages and yearly commitments | ✅ |
| Ratings are subjective reviews | **Rating beyond reviews:** need fit, true cost, compatibility, cited security/privacy facts, objective setup tier | ✅ |
| "Integrates with" vendor logos | **Graded, sourced connections**: built-in / direct / through Zapier (verified in Zapier's directory) / unknown | ✅ |
| One tool at a time | **Bundle builder**: smallest set covering every need within the total budget | ✅ |
| Nothing after the list | **Workflow recipes**, calendar and spreadsheet hand-offs, send to the owner's own Zapier/Make, adoption plan, SBA advisor links | ✅ |
| Reviews can be faked or bought | **Outcomes from owners like you**: signed-plan check-ins, similarity-weighted, Bayesian/Wilson | ✅ mechanism; 🗺 data |
| Paid placement | Published method and a neutrality policy (`/methodology`) | ✅ |

---

## 5. How we measured our MVP

| Metric | Result | How to reproduce |
|---|---|---|
| Contributor-reported recognition on **15 synthetic holdout prompts** (rules + AI fallback; not rerun during merge) | **15/15 · 100% recall · 100% precision · 100% right tool in top 3** | `npm run eval:discovery -- --ai` |
| Same, rules only (no AI) | 14/15 · 93.3% recall | `npm run eval:discovery` |
| Tuning set (30 problems) | 30/30 | same |
| Cost per plan | **$0** (rules-based core); AI fallback ≈ $0.0005; live web search ≈ $0.008 | `data/runtime/ai-ledger.json` |
| Total AI spend building the demo data | **≈ $0.70** of the $25 credit | same |
| Tools with cited security/privacy/setup facts | **30** (4 red-badge quotes reviewed by a person) | `data/reviewed/tool-facts.json` |
| Tools verified in Zapier's directory | **58 tools, 27 everyday apps** | `npm run verify:zapier` |
| Products found by live discovery (unverified) | **126** across 12 needs with no reviewed tool (3 industries each) | `data/discovered/live-candidates.json` |
| Automated tests at merge verification | **121 frontend and 85 backend passing** | `npm test --prefix website`; `uv run --directory backend pytest -q` |

**Accuracy check of our own data:** in manual review, 3 of 30 automatically extracted facts were wrong (blog-sourced or misread). We changed the rules: blog pages never count as evidence, and red badges require a quote reviewed by a person.

### Limits we state openly
- The reviewed catalog has 111 tools; only 14 have verified plan prices.
- Live finds are unverified, and the search engine favours newer vendors.
- The weights are reasoned, not yet validated with owners. Owner-outcome data starts empty.
- No real owner has tested the product yet. That is the first step of the 16-week plan.
