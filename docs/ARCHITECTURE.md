# Architecture

**Rules at the core, AI at the edges.** Three engines connected by versioned records. Every plan is produced by rules-based code (free, testable, explainable). AI is used only where rules fall short, always checked against our data, and behind a spending cap.

```
Owner ─► Check-up (or own words) ─► BusinessBrief ─► DISCOVER ─► REVIEW ─► INTEGRATE ─► AI plan
                                     lib/intake      lib/discovery lib/review lib/integration
```
The live diagram, with "built" vs "16-week" for each part, is at **`/architecture`** in the app.

## Engines
| Engine | Answers | Key parts | Code |
|---|---|---|---|
| **Intake** | What does this business need? | 6 areas, 43 owner-language struggles, 15 conditional follow-ups, optional deep dive, review screen; strict validation; "Not sure" kept as unknown | `lib/intake/bank.ts`, `brief.ts`, `app/start` |
| **Discover** | Which tools could solve it? | 40-capability list (fixed set of needs; 12 with no reviewed tool yet) · 111-tool reviewed catalog · AI fallback interpreter (taxonomy-constrained) · **live web discovery** (cited, labelled unverified, cached) · honest gaps | `lib/discovery/*` |
| **Review** | Which suits *this* business? | Gates (cost at your usage, yearly billing, must-keep software, required features) · 5 pillars + "proven by owners like you" · personal weights · **cited security/privacy facts** with green/yellow/grey/red badges · **objective setup tier (1–4)** · confidence axis with evidence decay | `lib/review/*` |
| **Integrate** | How do they work together, and how do I start? | Integration graph (32 apps; links from plan data, vendor pages and **Zapier's directory**) · **bundle builder** · **workflow recipes** · calendar, spreadsheet and owner's-own-Zapier/Make hand-offs · adoption plan · SBA advisor links | `lib/integration/*` |

## Records passed between engines
`BusinessBrief` → `DiscoveryResult` → `ReviewResult` → `IntegrationResult` (+ signed `planToken` for check-ins). Records are versioned and downloadable. The core rules use the supplied inputs and evidence; timestamps, plan tokens, outcome data and optional AI calls can change the full response.

## Data (all versioned, all with sources)
| File | What | How it's produced |
|---|---|---|
| `website/lib/catalog.ts`, `data/catalogue-expansion.json` | 111 reviewed tools, 14 plan-verified | Team research (Lochan) |
| `website/lib/discovery/taxonomy.ts`, `tool-tags.ts` | Capabilities and tool tags | Hand-built from catalog evidence |
| `website/data/reviewed/tool-facts.json` | Cited security, privacy, setup, integration facts (30 tools) | `npm run enrich:facts` (AI extraction, validated: on-domain quote, no blog pages) |
| `website/data/reviewed/fact-reviews.json` | Human review of red-badge quotes | Manual |
| `website/data/reviewed/zapier-listings.json` | 58 tools / 27 apps verified in Zapier's directory | `npm run verify:zapier` |
| `website/data/discovered/live-candidates.json` | 126 live-found products (unverified) | `npm run warm:live` / "Search the web" button |
| `website/data/discovery-eval.json`, `discovery-holdout.json` | Test sets | Hand-written; holdout never tuned on |

## Safety and cost controls
- **API key:** server-only, git-ignored, never in the client bundle (verified).
- **Spending:** best-effort local cap (`AI_BUDGET_USD`), timeout, one retry and an hourly search limit. This Next.js ledger is separate from the shared FastAPI ledger and is not an atomic provider billing cap. Keep fresh frontend AI off until configured with a separate provider-limited key. The contributor reports demo-data preparation spend of about $0.70.
- **Evidence checks (not a guarantee that claims are correct):**
  - Live finds must appear in the returned citations.
  - Extracted facts need an exact quote from the vendor's own policy pages.
  - Red badges need human review.
- **Prompt injection:** web text and owner text are treated as data; output is limited to a fixed schema and capability list.
- **Webhook hand-off:** only `hooks.zapier.com` / `hook.*.make.com` over HTTPS (no SSRF); nothing stored.
- **Owner check-ins:**
  - HMAC-signed plan tokens, one report per tool, a waiting period, burst hold.
  - Bayesian average and Wilson lower bound so thin evidence can't dominate.
- **Privacy:** owner text is never logged or sent to web search.

## Scaling path (16 weeks)
1. **Postgres** (Supabase is already wired): tools, *claims* (one row per fact with source and date), runs, live candidates, outcomes; accounts and saved plans.
2. **Background jobs:** scheduled ingestion (app marketplaces, Zapier directory), 90-day re-checks, a human approval queue.
3. **Read-only stack detection** through a unified-API partner (Merge/Codat); recipes compiled into one-click Zapier/Make templates. **We plan; trusted platforms execute.**
4. **Outcome loop:** 30-day check-ins with proof of use feed confidence; a pilot with an SBDC.

Detailed discovery notes and evaluation: [`technical/discovery.md`](technical/discovery.md).
