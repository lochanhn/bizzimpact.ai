# bizzimpact.ai

**A neutral AI advisor for small businesses.** It finds the right AI tools for *your* problem, rates them on what matters to *you*, and hands you a plan that works with the software you already use.

Built for the **AI for Small Business Hack-a-thon, Fall 2026** (Robert H. Smith School of Business). The challenge: *help small businesses discover, compare and adopt AI tools.*

---

## Try it in 60 seconds
```sh
cd website
npm ci
npm run dev            # then open http://127.0.0.1:3000
```
| Link | What you'll see |
|---|---|
| `/start?demo=landscaper` | A full plan for a landscaper who misses calls: AI stack, workflows into Jobber/Google Calendar/Instagram, comparison, adoption steps |
| `/start?demo=cafe` | A cafe with food waste: an honest catalog gap, **live web discovery**, a $0 plan for receipts and Instagram |
| `/start` | The 7-step check-up from scratch |
| `/discover` | Describe a problem in your own words |
| `/architecture` · `/methodology` | How it's built · how we rate (published weights, neutrality policy) |

No account and no API key needed. Live web discovery and the AI fallback need `OPENROUTER_API_KEY` in `website/.env.local` (see `.env.example`).

## What makes it different
| Others | bizzimpact.ai |
|---|---|
| Pick a software category, browse thousands of tools | **Check-up in plain language** → the needs we identify, or an honest "no good tool yet" |
| Star ratings, the same for everyone | **Rating beyond reviews**, personalised: need fit, cost *at your usage*, works with your tools, **cited security and AI-training facts**, objective setup tier, and **results from owners like you** |
| "Integrates with" logos | **Graded, sourced connections** (built in / direct / via Zapier, verified in Zapier's directory) |
| A list, then you're on your own | **AI stack within budget**, **workflow recipes**, calendar and spreadsheet hand-offs, send to your own Zapier/Make, adoption plan, free SBA advisor links |
| Vendors pay for placement | **Published method; nobody can pay for ranking** |

## Evidence
- **15/15** unseen owner problems understood correctly; the right tool was in the top 3 every time (with AI fallback; 14/15 rules only).
- **87** automated tests. **$0** per plan (rules-based core). About **$0.70** total AI spend to build all demo data.
- **30** tools with cited security and privacy facts. **58** tools verified in Zapier's directory. **126** products found by live discovery.

## Documents
| Doc | For |
|---|---|
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
│   └── tests/               ← 87 tests
├── Lochan/research/         ← research archive: 21 papers, source notes, catalog research
├── Anhinav/                 ← original Phase 1 product specification
└── Salman/                  ← pointers to design docs
```

## Team
| Member | Contribution |
|---|---|
| Lochan | Research (21 publications, owner accounts), the 111-tool reviewed catalog, V1 site, plan-level matching, accounts |
| Abhinav | Phase 1 product specification and discovery architecture |
| Salman | Master questionnaire, Discover / Review / Integrate engines, market gap analysis, live discovery |

*Edit this table to reflect exactly who did what.*

## Honest limits
- The catalog has 111 reviewed tools, 14 with verified plan prices. Live finds are unverified.
- Weights are reasoned, not yet validated with owners. Owner-outcome data starts empty.
- No real owner has tested it yet; that's week 1 of the 16-week plan.
