# Phase 1 audit and implementation status

Audit date: November 7, 2026. Source: `bizzimpact_ai_Phase1_Expected_Product_Specification_v1.docx`, checked against the active v4 ZIP, reference OpenAPI/SQL, approved HTML questionnaire JSON, and scenario fixtures. The HTML questionnaire and supplied JSON fixture were compared and match.

This is a build/status record, not a claim that live services are configured. The document’s embedded coding prompts were treated as reference material; the user’s request to find and implement missing Phase 1 functionality set this work’s scope.

## What was missing, and what changed

| Reference section | Gap before this work | Implementation now | Verification / remaining limit |
|---|---|---|---|
| 1, 18 — phase boundary | Main prototype displayed an experimental fit score and adoption guides | Primary website is discovery-only; no scores/stars/best-tool labels. Old assessment source is retained in `components/prototype.tsx` for previous tests, not mounted on a public route | Automated landing check and catalogue score-absence checks pass |
| 2–5 — onboarding | Different adaptive questions, no frozen three-screen profile | `/onboarding` and `/profile` implement exact Q1–Q8 labels/options, required/optional rules, subtype/custom software, Q6 exclusivity, Q7 limit, Q8 total budget | DOM flow and backend validation tests pass; real-browser visual/keyboard checks NOT RUN |
| 5, 12 — reusable profiles | One legacy saved assessment only | Multiple owner-scoped businesses with raw selected context and normalized SQL fields; create, list, retrieve, edit and returning-user routing | Demo storage and owner isolation pass. Supabase/PostgreSQL live execution BLOCKED by missing project/settings |
| 6 — baseline | Only assessment matching | Dashboard retrieves up to six catalogue candidates from industry/priorities, without LLM/web calls; honest empty state | Baseline zero-call tests pass; budget never excludes candidates |
| 7 — understanding | Free-text note not interpreted | Deterministic mock/fallback parser maps natural language to the exact eleven capability IDs; optional validated OpenRouter parser behind flags | All five supplied mapping scenarios pass. Actual LLM interpretation NOT RUN |
| 7 — planning | No bounded query planner | At most three capability/industry/alternate/integration queries; only allowlisted relevant software/subtypes enter external queries | Query privacy/context tests pass; no personal prose copied to web queries |
| 7–8 — async lifecycle | No discovery jobs | FastAPI persistent-process BackgroundTasks, persisted states/history, immutable profile snapshot, results and warnings; `/discovery/[runId]` polls actual state | Local HTTP journeys pass. Demo interrupted jobs become terminal on restart. Production durable queue/recovery remains a deployment concern |
| 8 — clarification | None | Conditional Q9, material channel ambiguity only, answer or explicit Skip, one resumable transition | Answer, Skip and repeated-submit conflict tests pass; phone/inventory examples do not redundantly ask Q9 |
| 7, 9 — evidence and identity | Tool-level source links only | Discovery records link individual capability/AI/pricing claims to a source/date/state. Product/domain dedupe preserves distinct products and retrieval channels | Source checks and duplicate fixtures pass. Original product-review limitations remain; no account testing is claimed |
| 7 — hybrid retrieval | Catalogue only | Replaceable LLMProvider/SearchProvider/PageFetcher interfaces; simulated web in demo; OpenRouter citation-based web adapter and pinned-IP safe HTTP fetcher behind live flags | Payload, invalid output, timeout fallback and unsafe destination/redirect tests pass. Real external discovery NOT RUN |
| 9 — details | Modal only | `/tools/[toolId]` evidence, unknowns, classification, source dates and synthetic labels; `/catalog` exposes the 111 researched records | HTTP pages and catalogue mirroring checks pass; provisional live tool identity requires review |
| 10–12 — stack/contracts | Next.js-only matching backend | Added Python FastAPI/Pydantic backend and all reference `/api/v1` endpoints, proxied by Next.js. Added reference-based normalized SQL migration and PostgreSQL adapter | API route coverage, request validation and local HTTP checks pass. Production DB schema/RLS/seed checks NOT RUN |
| 13 — credit protection | AI disabled, no runtime adapter | Mock by default; three live-enable flags plus real authenticated identity required. Demo can never spend. Five explicit model-call limit/run, three queries, five domains, ten page fetches; atomic $20 reservation ledger | Parallel local-budget and demo-live-flag tests pass. Provider-level billing/hard limits remain external; shared PG ledger NOT RUN |
| 14 — auth/privacy | Supabase foundation not connected | Existing Supabase server-session verification bridges to backend JWT verification via trusted project Auth endpoint; all profile/run operations scope to verified owner. Demo opaque cookie expires in two hours and has isolated temporary data | Cross-demo-owner access/revocation tests pass. Real two-account Supabase/RLS checks BLOCKED |
| 14 — network safety | No fetcher | Public IP validation, credential/port/scheme rejection, pinned validated IP with TLS hostname verification, redirect revalidation, page/time/size limits, untrusted text extraction | SSRF redirect and unsupported-claim tests pass; no actual vendor fetch was executed by runtime |
| 15–17 — delivery proof | No full Phase 1 journey | Synthetic landscaping, restaurant inventory and ambiguous-channel flows run end to end through localhost proxy; setup/run instructions and tests included | Local HTTP proof recorded below; no deployment or video claimed |

## Observed verification

- `uv run --directory backend pytest -q`: **41 passed**, including supplied five scenario cases, ownership, validation, snapshots, dedupe, clarification, unsafe URLs/redirect, budget, invalid model output, mock networking prohibition and timeout fallback. One upstream Starlette deprecation warning about its httpx test transport; no failures.
- `npm run typecheck --prefix website`: passed.
- `npm test --prefix website`: **44 passed**, including the new approved-onboarding DOM flow. Earlier prototype tests remain labelled by file/component and do not substitute for the new Phase 1 checks.
- `npm run build --prefix website`: passed; new onboarding/profile/catalog/discovery/tool routes and proxy built.
- Actual HTTP through Next.js → FastAPI: demo cookie minted; business persisted; zero-call baseline; landscaping phone candidates completed; ambiguous Q9 Skip resumed; restaurant inventory fixture found. Eight page routes returned HTTP 200. No browser was launched.
- No OpenRouter/model/search request was made. Backend tests prohibit socket connections; provider transport tests use mocked HTTP responses.

## Deliberate compatibility changes and choices

1. Retained existing Next.js folder `website/` instead of renaming it `frontend/`. The required Python backend is `backend/`; migrations remain in `website/supabase/migrations/`. This avoids moving previously pushed team work.
2. Added `/api/v1/demo`, `/demo/logout` and `/context` for a constrained, isolated judge journey. The browser receives only an HttpOnly opaque demo cookie; the backend never permits paid calls from this identity.
3. Clarification accepts `{skip:true}` as well as an answer. The supplied OpenAPI’s nonempty answer alone could not represent its required Skip behaviour. Original nonempty-answer calls remain supported.
4. Added `synthetic`, actual `state_history`, `queries`, `profile_snapshot` and usage metadata to run output. Reference required fields and route semantics are retained; snapshots remain owner-only.
5. Public schema and sanitized tool-detail reads do not require account creation; business/profile/run APIs do. No private records are exposed through tool details.
6. Synthetic web uses `mock_web` retrieval channel, explicitly distinguished from actual `web_search`. It never increments real search/model usage or claims an uncatalogued real vendor was found.
7. Added `api_payload` JSON snapshots to normalized reference tables for the wire handoff, plus a transactional spend ledger and composite business-owner run constraint. SQL write/seed adapters require live verification after migration.
8. Catalogue SQL is seeded explicitly from the researched export. Missing real inventory products produce an honest empty result; the restaurant demo uses a clearly fictional inventory planner. No fake inventory product was added to the real catalogue.
9. Supplier/model extraction never upgrades new web leads to independently tested or confidently compatible. Live provisional identities and claims remain reviewable; source excerpts must actually occur in fetched public page text.

## External steps still required

- Create/configure Supabase; configure frontend URL/publishable key and backend Supabase/DB settings; run both versioned SQL migrations and seed. Then test signup confirmation, sign-in/out/refresh, two distinct owners, and RLS against real PostgreSQL.
- Supply a replacement OpenRouter key in backend environment only, choose a currently available model, explicitly authorise live calls and set flags. Verify provider limits and perform one bounded real interpretation/search test before claiming live discovery works.
- Browser visual/mobile/keyboard QA requires the user’s permission to open/inspect an application. Automated DOM and HTTP checks do not establish pixel-level layout or real browser behaviour.
- Production requires a persistent Python process, deployment configuration, log retention/redaction and suitable durable job handling; local BackgroundTasks are not a serverless worker guarantee.
- Formal metrics/ratings (Phase 2), bundles/adoption automation (Phase 3), SBA integration, public hosting and presentation/video are not implemented here.
