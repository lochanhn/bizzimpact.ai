# bizzimpact.ai: website

Next.js (App Router) + TypeScript + Zod. Project overview, research and architecture are in the [root README](../README.md) and [`../docs`](../docs).

## Run
```sh
npm ci
npm run dev          # http://127.0.0.1:3000  (Node 20.9+)
npm run build && npm start
```
Optional AI features: copy `.env.example` to `.env.local` and set `OPENROUTER_API_KEY`, `OPENROUTER_ENABLED=true`, `LIVE_WEB_ENABLED=true`, and `PLAN_SIGNING_SECRET` (`openssl rand -hex 32`). Without these, everything except live web search and the AI fallback works.

## Scripts
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
