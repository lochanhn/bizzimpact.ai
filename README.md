# bizzimpact.ai

**A neutral AI advisor for small businesses.** It finds the right AI tools for *your* problem, rates them on what matters to *you*, and hands you a plan that works with the software you already use.

Built for the **AI for Small Business Hack-a-thon, Fall 2026** (Robert H. Smith School of Business). The challenge: *help small businesses discover, compare and adopt AI tools.*

---

## Live demo
**https://bizzimpact.3-92-95-188.sslip.io** (Docker on AWS EC2 behind Caddy; see [deploy/ec2/README.md](deploy/ec2/README.md)). Pushing to GitHub does not deploy automatically; follow the deployment README.

## Try it in 60 seconds
```sh
cd website
npm ci
npm run dev            # then open http://127.0.0.1:3000
```
| Link | What you'll see |
|---|---|
| `/start?demo=landscaper` | A full plan for a landscaper who misses calls: AI stack, workflows into Jobber/Google Calendar/Instagram, comparison, adoption steps |
| `/start?demo=cafe` | A cafe with food waste: a catalogue gap, previously cached web finds, and documented free options for receipts and Instagram |
| `/start` | The optional 7-step check-up, also linked from the dashboard |
| `/discover` | Describe a problem in your own words |
| `/architecture` · `/methodology` | How it's built · how we rate (published weights, neutrality policy) |

The rules-based `/start` plan and bundled cached finds need no account or API key. Fresh web discovery and the AI fallback are optional and off by default in the frontend. They use a separate provider-limited key and local ledger; they do not share the FastAPI spend ledger. The existing paid FastAPI discovery configuration is unchanged.

**Two journeys in one app:**
- **`/start`** is the full **discover → review → integrate** plan. It runs inside the Next.js app.
- **Get started → `/dashboard` → optional `/onboarding` → `/discovery/[runId]`** is the Phase 1 account-based discovery flow, backed by the FastAPI service in `backend/` with Supabase.

To run both locally: `uv sync --project backend --frozen && npm ci --prefix website && cd website && npm run dev:full`.

## What makes it different
| Others | bizzimpact.ai |
|---|---|
| Pick a software category, browse thousands of tools | **Check-up in plain language** → the needs we identify, or an honest "no good tool yet" |
| Star ratings, the same for everyone | **Rating beyond reviews**, personalised: need fit, cost *at your usage*, works with your tools, **cited security and AI-training facts**, objective setup tier, and **results from owners like you** |
| "Integrates with" logos | **Graded, sourced connections** (built in / direct / via Zapier, verified in Zapier's directory) |
| A list, then you're on your own | **AI stack within budget**, **workflow recipes**, calendar and spreadsheet hand-offs, send to your own Zapier/Make, adoption plan, free SBA advisor links |
| Vendors pay for placement | **Published method; nobody can pay for ranking** |

## Evidence
- Merge verification on the synthetic datasets: **30/30 tuning cases and 14/15 holdout cases passed rules-only checks**. Accepted-tool top-three hit rate was 100% under this dataset's labels. These are small developer-labelled examples, not real-owner accuracy. The branch reports 15/15 with its AI fallback; that paid evaluation was not rerun during the merge.
- **121 frontend tests and 85 backend tests passed** during merge verification, plus TypeScript and the production build. Rules-based plans make no model calls. The contributor reports about $0.70 spent preparing its cached demo data; the existing backend paid evaluations are recorded separately in `backend/AI_DISCOVERY.md`.
- **30** tools with cited security and privacy facts. **58** tools verified in Zapier's directory. **126** products found by live discovery.

## Documents
| Doc | For |
|---|---|
| [backend/AI_DISCOVERY.md](backend/AI_DISCOVERY.md) | Phase 1 backend: RAG pipeline, prompts, evaluation, budget controls |
| [deploy/ec2/README.md](deploy/ec2/README.md) | Docker packaging and EC2 deployment: build, release, verify, roll back |
| [website/AUTH_SETUP.md](website/AUTH_SETUP.md) · [website/PHASE1_STATUS.md](website/PHASE1_STATUS.md) | Supabase setup · Phase 1 audit |
| [HANDOVER.md](HANDOVER.md) | Project handover notes |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Market, owner needs, existing products, gaps, our metrics (all sourced) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Three engines, data, safety, scaling path |
| [docs/VIDEO_SCRIPT.md](docs/VIDEO_SCRIPT.md) | 10-minute demo script mapped to the judging rubric |
| [docs/design/questionnaire.md](docs/design/questionnaire.md) | Master questionnaire design |
| [docs/technical/discovery.md](docs/technical/discovery.md) | Discovery engine details and evaluation |

## Repository
```
bizzimpact.ai/
├── README.md                ← you are here
├── docs/                    ← research, architecture, video script, design
├── backend/                 ← Phase 1 discovery API (FastAPI, Supabase/Postgres, OpenRouter)
├── deploy/ec2/              ← Docker + Caddy deployment on AWS EC2
├── .github/workflows/       ← image build workflow
├── website/                 ← the app (Next.js + TypeScript)
│   ├── app/                 ← pages: / start discover architecture methodology, API routes
│   ├── lib/
│   │   ├── intake/          ← question bank + Business Brief
│   │   ├── discovery/       ← taxonomy, interpreter, AI fallback, live discovery
│   │   ├── review/          ← pillars, cited facts, setup tiers, owner outcomes
│   │   ├── integration/     ← graph, bundles, recipes, exports
│   │   └── ai/              ← OpenRouter client with spend cap
│   ├── data/                ← catalog, reviewed facts, Zapier listings, live finds, test sets
│   ├── scripts/             ← eval, enrichment, Zapier verification, live warm-up
│   └── tests/               ← automated frontend tests
├── Lochan/research/         ← research archive: 21 papers, source notes, catalog research
├── Anhinav/                 ← original Phase 1 product specification
└── Salman/                  ← pointers to design docs
```

## Team
| Member | Contribution |
|---|---|
| Lochan | Research (21 publications, owner accounts), the 111-tool reviewed catalog, V1 site and plan-level matching, Phase 1 backend, Supabase accounts, AWS EC2 deployment |
| Abhinav | Phase 1 product specification and discovery architecture |
| Salman | Master questionnaire, Discover / Review / Integrate engines, market gap analysis, live discovery |

*Edit this table to reflect exactly who did what.*

## Honest limits
- The catalog has 111 reviewed tools, 14 with verified plan prices. Live finds are unverified.
- Weights are reasoned, not yet validated with owners. Owner-outcome data starts empty.
- No real owner has tested it yet; that's week 1 of the 16-week plan.

Merge notes and checks: [docs/MERGE_VERIFICATION.md](docs/MERGE_VERIFICATION.md). Merging source does not update EC2; the deployed image tags remain documented in the deployment README.
