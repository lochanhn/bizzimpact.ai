# bizzimpact.ai — Complete Project Handoff

**Status:** production-deployed hackathon MVP; not yet production-validated  
**Document date:** November 8, 2026  
**Live application:** <https://bizzimpact.3-92-95-188.sslip.io>  
**Audience:** teammates, judges, maintainers, and future contributors

## 1. Executive summary

bizzimpact.ai helps a small-business owner move from a plain-language operational problem to a short, explainable set of AI-tool recommendations and then to a practical implementation plan. It is intentionally more than a directory: it asks about the business and its current software, retrieves candidates from a researched catalogue, checks fit and constraints, explains why each result may help, and guides the owner through adoption.

The current production MVP includes:

- a researched catalogue of **111 real AI products**;
- **117 source records**, **209 evidence claims**, and **11 controlled capabilities** in the normalized Supabase catalogue;
- hybrid lexical and semantic retrieval using BM25, PostgreSQL/pgvector embeddings, and reciprocal-rank fusion;
- optional OpenRouter-assisted query interpretation and candidate review, bounded by deterministic filters and a shared budget ledger;
- **111 versioned implementation guides**, one for every catalogued product;
- Supabase email/password authentication, owner-isolated profiles, searches, results, and implementation plans;
- a dashboard that starts a new search and reopens previous searches without paying for the same work again;
- a Next.js frontend, FastAPI backend, Supabase/PostgreSQL database, Docker packaging, Caddy HTTPS proxy, GitHub Actions build workflow, and EC2 deployment.

This is a technically working and deployed MVP, not a claim of production readiness or proven market outcomes. The recommendation evaluation currently uses developer-labelled synthetic cases. Real owner interviews, observed implementations, and outcome measurements remain the most important next validation step. The account code path is implemented, but the newly corrected production email-confirmation flow still needs its final end-to-end check.

## 2. What problem we chose to solve

Small-business owners do not primarily need another large list of AI products. They need help answering a sequence of harder questions:

1. What business problem is worth solving first?
2. Which tools actually match that problem and the software already in use?
3. What are the cost, privacy, setup, and workflow implications?
4. How should the selected tool be introduced into daily operations?
5. Did it improve an outcome that matters to the business?

The research showed that awareness alone is not enough. Fit, implementation effort, confidence, accuracy, skills, data concerns, and the risk of disrupting a working process all affect adoption. That led us away from a generic “AI tools directory” and toward a problem-first discovery, review, and implementation workflow.

## 3. Research program

### 3.1 What we reviewed and created

The team saved and reviewed **21 external research papers and industry reports** in [`Lochan/research/papers/`](../Lochan/research/papers/). These are publications we used; we did **not** author or publish these papers. The repository also contains our own research plans, structured notes, findings, source registers, product direction, and synthesis documents.

The research was completed in two main rounds:

- **Initial research:** market size, AI adoption, barriers, owner needs, product landscape, and initial product hypotheses.
- **Second research round:** 17 additional publications, six inspected open-source projects, concrete sector use cases, evidence that challenged earlier assumptions, and implications for the questionnaire and architecture.

The second round inspected Dify, Flowise, Activepieces, n8n, Chatwoot, and a Twilio speech-assistant sample. These were studied as architectural and workflow references; their code was not presented as our own.

Key research files:

- [`docs/RESEARCH.md`](RESEARCH.md) — consolidated evidence and product gap;
- [`Lochan/research/research-notes.md`](../Lochan/research/research-notes.md) — initial evidence and synthesis;
- [`Lochan/research/sources.md`](../Lochan/research/sources.md) — first-round source register and review depth;
- [`Lochan/research/questionnaire-design.md`](../Lochan/research/questionnaire-design.md) — research-derived questionnaire and discovery design;
- [`Lochan/research/research-round-2-notes.md`](../Lochan/research/research-round-2-notes.md) — detailed second-round findings;
- [`Lochan/research/research-round-2-sources.md`](../Lochan/research/research-round-2-sources.md) — second-round publication index and provenance;
- [`Lochan/research/tool-catalogue/sources.md`](../Lochan/research/tool-catalogue/sources.md) — per-product catalogue source register.

### 3.2 Important findings

The research established the following problem context:

- The United States has more than 36 million small businesses, so the market is large but highly heterogeneous.
- U.S. Census research reported that 19.8% of businesses used AI in at least one function in May 2026. Adoption differed sharply by company size: 37% for firms with 250 or more employees, versus under 20% for firms with four or fewer employees.
- AI use was comparatively flat among firms with fewer than 20 employees from December 2025 through May 2026.
- Among businesses already using AI, 57% used it in three or fewer functions. Adoption is therefore often narrow rather than organization-wide.
- Federal Reserve survey evidence found that businesses planning to use AI commonly struggled to find or adapt tools (54%) and with implementation or training time (37%). Current users also cited accuracy (46%) and fit or adaptation (43%).
- NFIB evidence found that 29% preferred to leave working technology alone. A new tool has to justify operational disruption, not merely look innovative.
- OECD evidence from seven non-U.S. countries found barriers including perceived lack of suitability (57.3%), information concerns (52.5%), and skill gaps (49.8%). These figures describe that study population and should not be generalized as U.S.-wide estimates.
- A randomized study of access to AI business advice found no detectable average gain and heterogeneous effects. Access to AI by itself should not be equated with business value.

The owner and sector evidence also produced concrete problems to design around: missed calls and scattered quote requests in field services, intake and booking losses in HVAC, staffing and repeat-customer challenges in cafes, and food-cost, reliability, POS-integration, and upfront-cost concerns in restaurants.

### 3.3 Research discipline and limitations

We did not combine percentages from incompatible study populations into one artificial statistic. Each claim retains its source context. Vendor documentation is treated as evidence of what the vendor states, not as an independent performance test. The product has not yet been validated with a representative sample of real owners, so the research supports the problem and design direction but does not prove customer outcomes.

## 4. Existing solutions and the gap

We reviewed AI directories such as There’s An AI For That, Futurepedia, Toolify, and ToolDirectory.ai; software comparison platforms such as G2 and Capterra; guided matching products such as FitGap and Software Advice; automation ecosystems such as Zapier; AI-stack articles; and public assistance channels such as SBA, SBDC, and SCORE.

These options are useful, but they commonly stop at one or more of the following boundaries:

- browsing by category rather than diagnosing an operational problem;
- ranking by popularity or reviews without checking the owner’s current stack;
- recommending one product without designing the workflow around it;
- providing claims without preserving source provenance;
- leaving implementation, training, and outcome tracking to the owner.

bizzimpact.ai addresses that gap with a connected **discover → review → integrate** experience.

## 5. How the 111-tool catalogue was built

### 5.1 Catalogue contents

The canonical JSON catalogue is stored in [`backend/data/researched-catalog.json`](../backend/data/researched-catalog.json). A mirrored frontend copy is stored in [`website/data/discovery-catalog.json`](../website/data/discovery-catalog.json). Automated checks ensure that both contain the same 111 records.

The Supabase seed expands those records into a normalized model containing:

- **111 tools**;
- **117 source records**;
- **209 individual claims**;
- **11 controlled business capabilities**;
- source URLs, source type, capture dates, excerpts, and review state;
- capability mappings and retrieval text;
- 111 semantic retrieval documents;
- 111 versioned implementation guides.

Examples include products such as Anyword, HubSpot, Pipedrive, Zoho CRM, and tools covering marketing, writing, scheduling, customer support, finance, operations, and other small-business needs.

### 5.2 Catalogue workflow

The catalogue was produced through the following workflow:

1. Identify a product from known directories, vendor pages, or a bounded discovery query.
2. Verify its identity and official URL.
3. Record what the product claims to do using a source URL and excerpt.
4. Map the product to controlled capabilities rather than relying only on vendor marketing language.
5. Record setup, pricing, security, privacy, or integration facts when supported.
6. Mark uncertain or newly discovered products as provisional until reviewed.
7. Normalize reviewed records into Supabase and generate deterministic retrieval documents.
8. Generate a versioned baseline implementation guide from verified catalogue facts and controlled capability templates.

The evidence process became stricter after manual review found that 3 of 30 automatically extracted facts were wrong. A blog mention is not accepted as proof of a product fact, and strong warning indicators require a human-reviewed supporting quotation.

In this project, **reviewed tool** means that the product identity and official source were manually checked, selected product-page text was inspected, at least one source-linked capability claim was recorded, and the record was approved for the catalogue. It does not mean that every plan, security policy, integration, or user outcome was independently tested. Those deeper evidence fields have their own coverage and unknown states.

### 5.3 Current evidence coverage

The repository records these additional catalogue measurements:

- 58 tools verified as present in Zapier’s directory, including 27 everyday applications;
- 126 live-discovery candidates across unmet needs, retained as unverified leads rather than silently promoted to reviewed recommendations;
- 14 tools with verified plan-price information;
- 30 tools with a deeper reviewed set of security, privacy, or setup facts.

Coverage is therefore intentionally uneven. A tool may be valid for capability matching even when its detailed pricing or security review is incomplete; the interface must describe unknowns honestly.

## 6. Product design and user journeys

### 6.1 Design decisions

The product uses owner language instead of asking users to understand AI categories. It collects the business problem, industry, current workflow, existing software, budget and operational constraints, data sensitivity, and desired outcome.

Several early interface ideas were deliberately removed or changed:

- Sign-in now lands on the dashboard, not immediately inside the questionnaire.
- A submitted profile is not repeatedly forced on returning users; it can be edited separately.
- Previous searches are visible from the dashboard and can be reopened without another model call.
- Internal relevance and quality scores are not shown as customer-facing grades.
- Duplicate landing-page calls to action, demo-credit language, “AI trial” badges, and unnecessary internal disclaimers were removed.
- Searches show staged progress so the interface does not appear frozen.
- Primary navigation stays in the same tab and provides explicit back paths.
- Country and region fields use dependent, spaced controls rather than overlapping free-form inputs.

### 6.2 Authenticated journey

1. A user signs up or signs in through Supabase email/password authentication.
2. New users confirm their email through `/auth/confirm` or complete OAuth-style callback handling through `/auth/callback`.
3. The application creates or retrieves the owner-isolated business profile.
4. The user lands on `/dashboard`.
5. If no profile exists, the dashboard directs the user to complete it once; otherwise the user can start a new search or reopen a previous one.
6. A new search collects the current problem and, when necessary, a focused clarification.
7. The backend runs retrieval and review asynchronously and the UI shows progress.
8. Results explain fit, checks, unknowns, and evidence in plain language.
9. Selecting a tool opens its details and implementation assistant.
10. The user answers setup-context questions and receives a safe, personalized plan.

Previous searches are owner-isolated, limited to the most recent 30, and contain enough persisted context to reopen results without repeating paid calls.

### 6.3 Three product engines

The original Next.js product concept is organized into three cooperating engines:

- **Discover:** translates the owner’s problem into capabilities, finds catalogue matches, and identifies honest gaps.
- **Review:** examines compatibility, cost, security/privacy, setup, and evidence. Its numerical score is an internal ordering mechanism, not a customer-visible truth claim.
- **Integrate:** turns selected tools into bundles, workflows, adoption steps, exports, and outcome check-ins.

The current production search workspace is the authenticated dashboard plus the FastAPI Phase 1 service, which owns search, hybrid retrieval, persisted history, and implementation-plan APIs. The `/start`, `/discover`, and `/catalog` Next.js routes retain the original check-up, direct-discovery, and public catalogue experiences and remain useful demonstrations/reference paths, but they are not the canonical authenticated search workflow. Both paths share the researched catalogue and the same product principles.

## 7. Recommendation and retrieval architecture

### 7.1 End-to-end pipeline

```text
Owner problem and business context
              │
              ▼
  Controlled query interpretation
  (deterministic + bounded AI assist)
              │
              ▼
 Mandatory capability / policy filters
              │
       ┌──────┴──────┐
       ▼             ▼
 BM25 lexical    pgvector semantic
 retrieval       cosine retrieval
       └──────┬──────┘
              ▼
     Reciprocal-rank fusion
              │
              ▼
 AI candidate assessment (optional)
 + deterministic quality/safety gates
              │
              ▼
 Plain-language recommendations,
 evidence, checks, and unknowns
```

### 7.2 Why hybrid retrieval

Pure keyword search misses paraphrases and owner language. Pure vector similarity can return semantically related but operationally unsuitable products. The hybrid pipeline therefore combines:

- **Mandatory structured filtering** for capabilities and product constraints;
- **BM25** for exact terms, product names, and strong lexical matches;
- **pgvector cosine similarity** for paraphrases and semantic intent;
- **Reciprocal-rank fusion (RRF)** to combine the two rankings without treating their raw scores as directly comparable;
- **quality and policy gates** before presentation.

The current catalogue has only 111 tools, so exact cosine search is simple and predictable. The pinned embedding model is `openai/text-embedding-3-small` with 1,536 dimensions. Changing the embedding model requires a full reindex; mixing vector spaces is not allowed.

BM25, vector similarity, RRF, and quality scores are internal diagnostic signals. Customers see explanations such as the matched need, relevant workflow, supporting evidence, prerequisites, and unknowns—not an unexplained “87% match.”

### 7.3 Where the AI model is used

The live OpenRouter chat model is `openai/gpt-4.1-mini`. It can assist with controlled query interpretation, clarification, and candidate assessment. It does not have authority to bypass capability filters, invent evidence, turn a provisional lead into a reviewed tool, or fabricate integrations and prices.

The system includes a shared PostgreSQL budget ledger, a $20 stop target, a $5 buffer, explicit feature flags, at most five chat calls and two embedding calls per run, and a deterministic fallback when AI is unavailable or disabled.

### 7.4 Live web fallback

Bounded live discovery is available only as a fallback when the reviewed catalogue lacks a suitable result. Public pages are fetched with SSRF protections; remote text is treated as untrusted; an exact supporting excerpt is required; and the result is labelled provisional pending human review. It is not silently inserted into the trusted catalogue.

### 7.5 Why this is RAG, and why it is not an MCP system

The search pipeline is a compact retrieval-augmented generation system: it retrieves structured, source-grounded catalogue records and uses an LLM only within that context. A separate MCP server is not required for recommendation quality. MCP would become useful later if external AI agents needed standardized access to bizzimpact.ai’s catalogue, plans, or workflows. It would add integration surface area, not improve the underlying evidence by itself.

## 8. Implementation assistant

Every catalogued tool has a server-only, versioned baseline guide. When a user selects a product, the assistant can ask about:

- the first workflow or outcome to implement;
- current software;
- operating platform;
- data sensitivity;
- administrator access;
- team size;
- technical comfort.

The final plan uses verified product facts plus deterministic capability templates. OpenRouter may summarize the overview, reorder known step identifiers, and add confirmation questions. It may not invent commands, prices, integrations, legal claims, or unsupported setup steps. If the model is unavailable, the system returns the deterministic guide.

This design is safer than sending an unrestricted agent to browse a vendor site every time a user clicks a tool. Vendor pages change, prompt-injection text can be present, and unconstrained generation can create confident but incorrect instructions. The next improvement should be deeper, human-reviewed, vendor-specific click paths for the highest-traffic tools, with scheduled re-verification.

## 9. Software architecture

### 9.1 Runtime components

```text
Internet
   │ HTTPS
   ▼
Caddy reverse proxy on EC2
   │
   ▼
Next.js 16 / TypeScript frontend container
   │ same-origin API proxy
   ▼
FastAPI / Python backend container
   ├── Supabase Auth
   ├── Supabase PostgreSQL + pgvector
   └── OpenRouter chat and embeddings
```

The backend is not directly published to the internet. The frontend binds to loopback behind Caddy, proxies authenticated API requests, and keeps server credentials out of browser bundles.

### 9.2 Main technologies

| Layer | Technology | Responsibility |
|---|---|---|
| Web UI | Next.js 16, React, TypeScript | Pages, forms, progress, dashboard, result and setup views |
| API | FastAPI, Python 3.14 | Authenticated business/search/guide services and retrieval pipeline |
| Database | Supabase PostgreSQL | Profiles, catalogue, evidence, searches, plans, budget ledger |
| Semantic index | pgvector | 1,536-dimensional retrieval documents and cosine matching |
| Authentication | Supabase Auth | Email/password identity, confirmation, session validation |
| Models | OpenRouter | Bounded chat and embedding calls |
| Packaging | Docker | Reproducible frontend and backend images |
| Edge | Caddy | HTTPS and reverse proxying |
| Hosting | AWS EC2 | Shared t2.micro demo host |
| CI/CD | GitHub Actions | AMD64 image builds and release packaging |

### 9.3 Important routes

- `/dashboard` — authenticated home, new search, and previous searches;
- `/onboarding` and `/profile` — one-time profile and later editing;
- `/discovery/[runId]` — asynchronous search status and recommendations;
- `/tools/[toolId]` — tool evidence, facts, unknowns, and implementation entry;
- `/start`, `/discover`, `/catalog` — original check-up, discovery, and catalogue experiences;
- `/auth/callback` and `/auth/confirm` — authentication completion;
- `/architecture` and `/methodology` — public explanation pages.

### 9.4 Repository map

```text
backend/
  app/                         FastAPI application and services
  data/researched-catalog.json Canonical 111-tool normalized seed input
  tests/                       Backend unit and integration tests
  seed_catalog.py              Catalogue seed command

website/
  app/                         Next.js App Router pages and API routes
  components/                  Shared interface components
  lib/                         Auth, catalogue, discovery, review, integration
  data/                        Frontend catalogue, evaluation and reviewed facts
  tests/                       Frontend tests
  supabase/migrations/         Supabase/PostgreSQL schema changes
  AUTH_SETUP.md                Auth/database configuration and verification

Lochan/research/
  papers/                      21 saved external publications/reports
  *.md                         Research notes, source registers and design work

docs/
  RESEARCH.md                  Consolidated research
  ARCHITECTURE.md              System design
  technical/                   Module-level technical notes
  PROJECT_COMPLETE_HANDOFF.md  This document

deploy/ec2/README.md           EC2/Docker operations and rollback
backend/AI_DISCOVERY.md        Paid AI, RAG, quality and setup grounding
```

## 10. Database and data ownership

The migration sequence is:

1. `202611070001_business_profiles.sql`
2. `202611070002_discovery_phase1.sql`
3. `202611080003_authenticated_access.sql`
4. `202611080003_tool_semantic_index.sql`
5. `202611080004_tool_implementation_guides.sql`

The two `202611080003_*` files intentionally share a date/version prefix but have distinct names. Apply them in the exact order shown above—authenticated access first, then the semantic index. Before adopting a migration runner that requires globally unique numeric versions, rename or re-baseline them in a coordinated migration rather than assuming the duplicate prefix is accepted.

The data model includes businesses, installed business software, capabilities, AI tools, sources, claims, tool-capability links, discovery runs, queries, candidates, semantic retrieval documents, implementation guides and plans, and the model budget ledger.

Private owner data is protected with PostgreSQL row-level security. Catalogue administration, retrieval documents, implementation-guide templates, and budget data are server-only; access is revoked from anonymous and authenticated browser roles. The backend validates bearer tokens and performs owner checks for every private resource.

## 11. Authentication and security

Production authentication uses Supabase email/password accounts. The Site URL and allowed redirect URLs now point to the production HTTPS host, including `/auth/callback` and `/auth/confirm`. Sessions use secure, HttpOnly, SameSite=Lax cookies in production.

Additional controls include:

- same-origin enforcement on state-changing requests;
- strict request models that reject unknown fields;
- request-body size limits;
- safe error messages and request identifiers;
- no credential logging;
- owner isolation in API code and database RLS;
- SSRF-safe live-page fetching;
- secret scanning and ignored local environment files;
- no private database URL or service credential in the frontend.

The database profile round trip and two-owner isolation test passed with temporary data rolled back. A final end-to-end test of a newly issued confirmation email, login, refresh, and logout remains necessary after the redirect update.

## 12. Evaluation and verification

### 12.1 Recommendation evaluation

The deterministic discovery engine was evaluated on developer-labelled synthetic prompts:

- tuning set: 30/30 expected cases passed;
- held-out set: 14/15 exact expectation cases passed;
- every held-out case placed at least one labelled acceptable tool in the top three.

A contributor-reported AI-fallback result of 15/15 exists in project notes, but it was not rerun during the final merge and should not be presented as independently reconfirmed. Synthetic cases show that the pipeline follows its intended rules; they do not establish real-owner recommendation accuracy or business impact.

### 12.2 Automated checks

The latest complete verification recorded **129 frontend tests** and **91 backend tests** passing, together with TypeScript and production-build checks. Earlier documents may show 121/85 because they captured an earlier merge point.

The test suite covers catalogue mirroring, ranking behavior, authentication boundaries, owner isolation, retrieval, async discovery, history, implementation guides and plans, budget behavior, routes, and important UI state.

### 12.3 What still needs human validation

- desktop and mobile visual QA across the complete authenticated journey;
- a fresh production confirmation-email flow;
- interviews and usability sessions with real small-business owners;
- observation of whether a recommended tool was actually adopted;
- before/after outcomes such as response time, missed leads, quote conversion, hours saved, or cost reduction;
- formal load, penetration, and accessibility testing.

## 13. Deployment and operations

The live system runs on the existing AWS EC2 t2.micro instance alongside NourishNet. Caddy terminates HTTPS and routes `bizzimpact.3-92-95-188.sslip.io` to the bizzimpact frontend. The app is deployed as separate frontend and backend Docker containers rather than replacing the existing website.

Operational choices for the constrained host include:

- frontend memory limit: 256 MiB;
- backend memory limit: 128 MiB;
- approximately 2 GiB swap in addition to the instance’s roughly 1 GiB RAM;
- `unless-stopped` restart policies;
- rotated Docker logs;
- a persistent frontend runtime mount;
- AMD64 images built through GitHub Actions and transferred as compressed archives;
- preserved Caddy and NourishNet configuration.

The current live release uses the full image tag `6bbbbaf0f0620c1138aa6f58b6f84e4a1db2b5be` for both services. The stopped rollback containers are `bizzimpact-website-before-6bbbbaf` and `bizzimpact-backend-before-6bbbbaf`. Both bizzimpact.ai and the pre-existing NourishNet service returned healthy responses after deployment, with no observed restart or out-of-memory loop.

To reproduce a release, build both images from one full Git commit SHA, apply all five migrations in the documented order, seed the 111-tool catalogue and implementation guides, rebuild the semantic retrieval documents, and launch the containers with the existing server-only environment. Required names are documented without values in `backend/.env.example` and `website/.env.example`; the deployed values remain only in protected server environment files. Always inspect the actual running image and migration state before changing the host because documentation-only commits do not create new application images.

See [`deploy/ec2/README.md`](../deploy/ec2/README.md) for exact deployment, rollback, and diagnostic commands. Secrets remain in ignored local and server environment files and must never be committed.

## 14. Major architectural decisions and trade-offs

| Decision | Reason | Trade-off |
|---|---|---|
| Curated catalogue plus bounded live fallback | Preserves evidence quality while still finding gaps | Catalogue coverage requires ongoing human work |
| Hybrid BM25 + vector retrieval | Handles exact terms and paraphrased owner language | More moving parts than keyword-only search |
| Exact cosine over 111 vectors | Simple, inspectable, fast enough at current scale | Needs an ANN index when the catalogue becomes much larger |
| Deterministic gates around LLM output | Prevents the model from becoming the source of truth | Reduces open-ended model flexibility |
| Hide numeric match scores | Raw internal scores are not calibrated customer probabilities | Requires stronger plain-language explanations |
| Persist search results/history | Reopening work is fast and free of duplicate paid calls | Requires lifecycle and privacy policies for stored searches |
| Versioned setup guides | Stable, testable, and safe implementation baseline | Vendor-specific detail must be maintained over time |
| No per-click autonomous browsing agent | Avoids latency, prompt injection, and invented instructions | Guides can lag vendor UI changes until reviewed |
| Shared EC2 for the demo | Fast and cost-efficient under the deadline | Limited capacity and a larger shared-host blast radius |
| RAG without MCP | Solves retrieval and grounding directly | External agent interoperability is deferred |

## 15. Honest limitations

The current system should not be described as having solved all AI-tool selection problems. Important boundaries are:

- The catalogue has 111 reviewed tools, not every AI tool on the market.
- Only 14 products currently have verified plan prices.
- Vendor claims are not independent product tests.
- Live-discovery candidates remain provisional until reviewed.
- Ranking weights are not yet calibrated against real owner outcomes.
- No representative owner study has been completed.
- The implementation guides are grounded and safe, but many are capability-based rather than vendor-screen-specific.
- The current async work uses FastAPI background tasks, not a durable distributed queue.
- The t2.micro deployment is appropriate for a demonstration, not guaranteed production scale.
- Formal performance, security, accessibility, and disaster-recovery audits remain outstanding.
- Production email confirmation still needs one final end-to-end verification after the URL change.

## 16. Recommended roadmap

### Next 0–2 weeks: validate the experience

1. Run 8–12 owner interviews across two or three business types.
2. Observe users completing profile, search, result review, and setup-plan tasks.
3. Complete the production confirmation-email and session test.
4. Perform desktop/mobile/accessibility QA and fix the highest-impact friction.
5. Add vendor-specific, screenshot-verified setup guides for the 10 most selected tools.
6. Define a minimal outcome check-in for each search: chosen tool, adoption state, time/cost, and one business metric.

### Next 1–2 months: improve evidence and learning

1. Pilot with real businesses and record recommendation acceptance, implementation completion, and outcomes.
2. Build a scheduled evidence-refresh queue with source staleness alerts and human approval.
3. Expand verified pricing, security, privacy, and integration coverage.
4. Create new held-out evaluations that are not tuned against current ranking rules.
5. Calibrate ranking features using observed owner choices and outcomes without turning popularity into the only signal.
6. Add durable job processing, caching, monitoring, alerting, and richer cost telemetry.
7. Configure a custom domain and production email provider.

### Scale phase

1. Move the application to a larger or managed runtime with independent services and managed secrets.
2. Add approximate vector indexing only when catalogue size and latency justify it.
3. Add organization/team roles if multi-user businesses become a product requirement.
4. Introduce formal security review, load testing, backups, recovery exercises, and data-retention controls.
5. Consider an MCP interface only when external agents or partner systems need standardized catalogue and plan access.

## 17. How a teammate can continue the work

Start with these documents:

1. This handoff for the whole system.
2. [`website/README.md`](../website/README.md) for local routes, commands, and code map.
3. [`website/AUTH_SETUP.md`](../website/AUTH_SETUP.md) for Supabase and private configuration status.
4. [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for component design.
5. [`deploy/ec2/README.md`](../deploy/ec2/README.md) for EC2 deployment and rollback.
6. [`backend/AI_DISCOVERY.md`](../backend/AI_DISCOVERY.md) for RAG, model controls, quality checks, and setup-plan grounding.
7. [`docs/RESEARCH.md`](RESEARCH.md) for evidence and product rationale.

Common local checks from the repository root:

```bash
npm test --prefix website
npm run typecheck --prefix website
npm run build --prefix website
uv run --directory backend pytest -q
```

Run the frontend and backend with the commands in [`website/README.md`](../website/README.md). Use the ignored `.env.local` files described in [`website/AUTH_SETUP.md`](../website/AUTH_SETUP.md); never paste production credentials into documentation, issues, screenshots, or commits.

When changing catalogue records, update the canonical backend data, regenerate or synchronize the frontend mirror, reseed Supabase, rebuild retrieval documents/embeddings, and run catalogue-mirroring and ranking tests. When changing the embedding model, rebuild every vector rather than mixing dimensions or model spaces.

## 18. Project chronology

1. Framed the small-business AI adoption problem and created the initial research plan.
2. Reviewed market/adoption literature, product directories, implementation barriers, and sector examples.
3. Designed the problem-first questionnaire and Discover/Review/Integrate product model.
4. Built the initial Next.js experience and deterministic catalogue matching.
5. Expanded and normalized the real-tool catalogue to 111 products with evidence provenance.
6. Added Supabase authentication, private profiles, normalized catalogue tables, and RLS.
7. Added the FastAPI Phase 1 service and authenticated discovery runs.
8. Added OpenRouter budget controls, bounded live fallback, and evaluation cases.
9. Replaced catalogue-only ranking with hybrid BM25 + pgvector retrieval and RRF.
10. Added 111 grounded implementation guides and personalized implementation plans.
11. Added the dashboard search workspace and owner-isolated previous-search history.
12. Packaged the frontend and backend in Docker and deployed them behind Caddy on EC2.
13. Corrected Supabase production callback and confirmation URLs.
14. Refined the customer interface by removing internal trial language, visible scores, duplicate actions, and unclear navigation.

## 19. Definition of “done” for the current MVP

The current MVP is complete enough to demonstrate the intended product loop:

- the implemented account flow can create an account and maintain an owner-isolated profile, subject to the remaining fresh-email production verification;
- a user can describe a problem in normal business language;
- the system retrieves and reviews source-grounded tools from the 111-tool catalogue;
- recommendations explain fit without exposing misleading numeric scores;
- searches persist and can be reopened from the dashboard;
- a selected tool produces a safe, contextual implementation plan;
- the application is containerized, deployed over HTTPS, tested, and documented.

The next definition of done is not “more AI.” It is evidence that real owners can use the workflow, trust its explanations, implement a recommendation, and improve a measurable business outcome.

---

### Maintainer note

Counts in this document describe the repository and deployed database as of November 8, 2026. Catalogue, paper, test, and deployment counts should be updated together whenever the underlying assets change.
