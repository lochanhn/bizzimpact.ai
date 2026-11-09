# bizzimpact.ai

Small-business onboarding and evidence-backed discovery of existing AI tools. Next.js frontend in `website/`; FastAPI/Pydantic backend in `backend/`. The user-authorized live AI trial adds an experimental evidence match index with visible weights, citations and quality gates; it is not a validated product rating.

## Run the complete local demo

Requires Node 20.9+, Python 3.11+ and [uv](https://docs.astral.sh/uv/).

From the repository root:

```sh
uv sync --project backend --frozen
npm ci --prefix website
cd website
npm run dev:full
```

Open `http://localhost:3000` yourself. No application opens automatically. **Get started** reuses an existing workspace, starts a real guest workspace when enabled, or opens sign-in when guest access is disabled. The fictional synthetic demo remains available through the developer API and automated tests; it is not a customer-facing homepage option.

Alternatively use two terminals:

```sh
# Terminal 1, repository root
uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port 8001 --no-access-log
# Terminal 2, repository root
npm run dev --prefix website
```

The local SQLite demo database is ignored under `backend/.runtime/`; sessions expire in two hours and are isolated from other demo visitors. The public research catalogue contains 111 real, source-linked products; it is distinct from fictional demo results.

## Routes

- `/`: Phase 1 landing and constrained demo entry.
- `/auth`: Supabase account sign-up/sign-in and guest demo option.
- `/onboarding`: business profile over three screens using plain-language customer options; optional answers can be skipped.
- `/dashboard`: the landing page for accounts and demos, optional profile setup, a zero-call baseline, and a task/workflow/outcome request that is reviewed before search.
- `/profile`: edit the current business profile.
- `/discovery/[runId]`: real state polling, optional Q9/Skip, candidates and source uncertainty.
- `/tools/[toolId]`: claim-level evidence and unknowns.
- `/catalog`: 111-tool source-aware research catalogue.
- `/api/v1/*`: Next.js proxy to the Python API. Cookies/tokens stay server-side.

The earlier scored assessment is retained as source in `components/prototype.tsx` and in its regression tests; it is not mounted in the Phase 1 user journey. Its weights are not validated Phase 2 metrics.

## Real accounts and live discovery

[Paid AI discovery and quality checks](../backend/AI_DISCOVERY.md) explains the RAG pipeline, prompts, scoring formula, provider evaluation, public trial, cost controls and remaining limitations. Choose **Get started** on the deployed site for real catalogue/model results without signup. The developer synthetic demo remains free of paid calls.

[AUTH_SETUP.md](AUTH_SETUP.md) explains Supabase configuration. The current project's schema, access grants, and 111-tool catalogue seed are applied, and private connection settings are configured locally and on EC2. Credentials are excluded from Git. Public Auth redirect configuration and genuine signup/session checks remain pending.

[Docker packaging and EC2 deployment](../deploy/ec2/README.md) is the team's reference for building, deploying, checking, updating, and rolling back the hosted app.

Backend default: `DISCOVERY_MODE=mock`, `OPENROUTER_ENABLED=false`, `LIVE_WEB_ENABLED=false`, `EXPLICIT_LIVE_AUTHORIZED=false`. No live credential is read from the repository’s saved key file. Real authenticated users can use `DISCOVERY_MODE=catalog` with the seeded SQL catalogue and no model/web charges. Only an explicitly authorised, configured `live` mode can enable OpenRouter parsing/search; demo identities always remain mock, even if flags change.

OpenRouter is the runtime provider behind a replaceable interface. AI interpretation maps needs to the fixed eleven-capability taxonomy. Catalogue retrieval and evidence are separate from formal scoring. API/model output cannot invent prices or compatibility; unknowns stay visible. Gemini direct is a later optional adapter, not an enabled dependency.

[PHASE1_STATUS.md](PHASE1_STATUS.md) is the detailed gap audit, contract deltas, test evidence and blocked/deferred work. It distinguishes implemented code from unperformed live verification.

[Questionnaire and discovery quality update](../Lochan/research/discovery-quality-plan.md) records the later owner-language revision, optional task context, retrieval changes, OpenRouter's intended role, and the evaluation still needed with actual owners.

## Checks

```sh
uv run --directory backend pytest -q
npm test --prefix website
npm run typecheck --prefix website
npm run build --prefix website
```

Observed: 41 backend tests and 44 frontend/matching/auth/DOM tests passed; TypeScript and production build passed. Local HTTP verified landscaping calls, restaurant inventory, clarification Skip, profile persistence and eight page routes. No browser, live model/search or real Supabase account was tested.

## Data and logs

- Source research: `Lochan/research/`, with tool catalogue sources, findings and retrieval audit.
- Tool seed: generated from `lib/catalog.ts` and the researched expansion with `npx tsx scripts/export-discovery-catalogue.ts` inside `website/`. Frontend/backend mirrors are checked in tests.
- Approved questionnaire and scenarios: versioned fixtures from the supplied v4 package; frozen HTML JSON was compared to the fixture.
- Private profile/run data: local demo SQLite, or PostgreSQL for authenticated users after setup. Runs preserve an immutable profile snapshot.
- Diagnostic logs: allowlisted JSON metadata, request IDs, durations, statuses and usage; no body, password, token, email or original problem text. Hosting log retention/URL redaction must be configured separately.
- OpenRouter application target: $20 reservation ledger, preserving $5 of the supplied credit. This is not a guaranteed provider hard cap; missing usage conservatively pauses further calls. Live search can include provider-managed internal operations beyond our explicit query count.

---

## AI check-up: discover → review → integrate (`/start`)

Runs inside Next.js (no backend needed). Architecture: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md). Optional AI features read `OPENROUTER_API_KEY`, `OPENROUTER_ENABLED`, `LIVE_WEB_ENABLED`, `PLAN_SIGNING_SECRET` and `OUTCOME_MIN_DAYS` (see `.env.example`).

### Scripts
| Command | Does |
|---|---|
| `npm test` | 87 tests (engines, APIs, UI journeys, security rules) |
| `npm run typecheck` | TypeScript |
| `npm run eval:discovery` | Accuracy on tuning + held-out sets (`-- --ai` adds the AI fallback; costs cents) |
| `npm run enrich:facts` | Extract cited security, privacy and setup facts from vendor sites (paid, ~$0.008/tool) |
| `npm run verify:zapier` | Verify Zapier directory listings (free) |
| `npm run warm:live` | Pre-run live discovery for every catalog gap (paid, ~$0.008/search) |

## Pages and APIs
| Route | Purpose |
|---|---|
| `/start` (`?demo=landscaper` / `?demo=cafe`) | AI check-up → full plan (main journey) |
| `/discover` | Problem in your own words → needs → tools → hand-off to `/start` |
| `/` | Home, catalog browser, Lochan's plan-level quick check |
| `/architecture`, `/methodology` | Built-vs-roadmap diagram; published rating method and neutrality policy |
| `POST /api/plan` | Answers → Brief → Discover → Review → Integrate (+ signed plan token) |
| `POST /api/discover`, `/api/discover/live` | Free-text discovery (rules + AI fallback); live web discovery for gaps |
| `POST /api/outcomes` | Owner check-ins (signed plan token required) |
| `POST /api/integrations/webhook` | Send plan to the owner's own Zapier/Make hook (allow-listed) |
| `POST /api/assess`, `GET /api/catalog`, `/api/auth/*` | Lochan's V1 plan-level matching, catalog, Supabase accounts (see [AUTH_SETUP.md](AUTH_SETUP.md)) |

## Code map
```
lib/intake/        bank.ts (questions, data) · brief.ts (validation → BusinessBrief)
lib/discovery/     taxonomy · tool-tags · interpret (rules) · ai-interpret · live · discover · from-brief · evaluate
lib/review/        review.ts (gates, pillars, weights, confidence) · facts.ts (cited facts, badges, setup tiers) · outcomes.ts · requirements.ts
lib/integration/   graph.ts (apps, links, Zapier) · plan.ts (bundles, adoption) · recipes.ts · exports.ts (ics, csv, webhook)
lib/ai/            openrouter.ts (server-only client, spend cap, ledger)
lib/catalog.ts     111-tool reviewed catalog (Lochan)   lib/match.ts  V1 plan-level matching (Lochan)
```

## Data and privacy notes
- **Owner answers and free text are never logged.** Logs are allow-listed counts, versions and costs.
- **`data/runtime/`** (spend ledger, check-ins) is git-ignored. In production these move to Postgres.
- **Tool facts come from vendor pages** checked Nov 7–8, 2026. Tools were not tested inside vendor accounts.
