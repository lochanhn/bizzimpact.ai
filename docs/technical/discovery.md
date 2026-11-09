# Discovery module

Problem-first discovery: the owner describes a problem in their own words and gets matching AI tools from the reviewed catalogue, with sources, unknowns and honest gaps. Page: `/discover`. API: `POST /api/discover`. No AI key, network call or paid API is used.

## Pipeline

```
owner text + optional profile
  → 1. Interpret      lib/discovery/interpret.ts   text → controlled capability IDs (required / optional / not wanted)
  → 2. Clarify (Q9)   only when the need is channel-neutral and no channel is named; answer or skip resumes
  → 3. Retrieve       lib/discovery/discover.ts    all 111 tools, via capability tags (lib/discovery/tool-tags.ts)
  → 4. Fit gates      budget (lowest reviewed plan), existing-customer-only add-ons
  → 5. Order          need match (coverage of stated needs) + small explained adjustments
  → 6. Coverage map   which tools cover which need; gaps; single-tool vs multi-tool
```

- **Taxonomy** (`lib/discovery/taxonomy.ts`): 33 capabilities. 27 have catalogue tools; 6 are known small-business needs without one yet (inventory forecasting, review replies, staff shifts, routing/dispatch, estimates, hiring). These are reported as gaps and never filled with invented tools.
- **Tags** come from each record's reviewed description. Setup warnings ("developer", "build it yourself", "larger teams") are set only where the record's own wording says so.
- **Need match** (0–100) shows how well a tool's documented purpose covers the stated needs. It is not a quality rating or a recommendation; that belongs to the Rating module.
- **Adjustments** each appear as a reason or warning on the card:
  - already in the owner's software: +
  - documented calendar connection: +
  - built for their industry: + (− if it targets another industry)
  - plan-level evidence: +
  - developer, builder or enterprise positioning: −
- **Unknown prices stay `null`.** Product-level records are never shown as verified or free.

## Live discovery and AI fallback (OpenRouter)

- **Live discovery** (`lib/discovery/live.ts`, `POST /api/discover/live`, "Search the web" on every gap card):
  - Searches the web (Exa via OpenRouter) for a capability + industry only, never the owner's words.
  - Keeps only products whose website or a mentioning page is in the returned citations; invented products and catalogue duplicates are dropped.
  - Labels every result "Found live · not yet verified", with pricing only as stated in sources.
  - Caches results for 30 days in `data/discovered/live-candidates.json`, the growing, unverified part of the catalogue. `npm run warm:live` pre-warms all gaps.
  - Cost: about $0.008 per search, about 5–10 s.
- **AI fallback interpreter** (`lib/discovery/ai-interpret.ts`): runs only when the rules find no required need. It may choose only IDs from the taxonomy; anything else is discarded. Prompt-injection text returns nothing.
- **Safeguards** (`lib/ai/openrouter.ts`):
  - Server-only key and an app spend cap (`AI_BUDGET_USD`, checked before each call) with a local ledger.
  - Timeout plus one retry; no prompt or response logging.
  - Hourly limit on fresh live searches.
  - Graceful fallback to catalogue results if the provider fails.

## Evaluation (`npm run eval:discovery`, add `-- --ai` for the hybrid run)

| Set | Cases | Passed | Need recall | Need precision | Accepted tool in top 3 | Gaps reported | Q9 only when needed |
|---|---|---|---|---|---|---|---|
| Tuning (rules written against it) | 30 | 30 | 100% | 94.3% | 100% | 100% | 100% |
| **Held-out (written after, not tuned)**, rules only | 15 | 14 | 93.3% | 100% | 100% | 100% | 100% |
| **Held-out, rules + AI fallback** | 15 | **15** | **100%** | **100%** | **100%** | 100% | 100% |

The held-out miss is H01, "the office line just rings out": a paraphrase the keyword rules don't recognise. Unusual phrasing like this is why an LLM interpreter is the next step (see roadmap). Median latency is under 1 ms in-process at $0 per run.

## Hand-off contract for Rating and Integration

`DiscoveryResult` (`lib/discovery/discover.ts`) is the stable interface. "Download this result" on the page exports it as JSON.

| Field | Use |
|---|---|
| `intent.capabilities[]` | `id`, `role` (required/optional), `confidence`, `source` (text/clarification/profile), `evidence` |
| `candidates[]` | `toolId`, `relevance`, `matched[]` (primary/secondary), `missing[]`, `evidenceLevel`, `price` (`lowestKnownMonthly` null when unverified), `stack` (`inStack`, per-app `signals`, `integrationNote`), `audience`, `warnings`, `sources`, `checkedAt` |
| `coverage[]` | need → tool IDs; the input for bundle building |
| `gaps[]`, `singleToolCovers`, `multiToolNeeded` | whether one tool is enough or a combination is required |
| `excluded[]` | tools removed by hard gates, with reasons |
| `profileSnapshot`, `engineVersion`, `taxonomyVersion`, `catalogVersion` | reproducibility; results are deterministic for the same input |

## Limits (state these in the demo)

- Catalogue-only. Live web discovery is not enabled. "Discovered" means retrieved from the 111-tool reviewed catalogue.
- The keyword interpreter can miss unusual paraphrases (see the held-out miss above).
- Business size has no catalogue data. It only changes how strongly developer, builder and enterprise warnings weigh.
- Integration signals are limited to:
  - documented plan flags (Google/Outlook/Calendly on the 11 plan-reviewed tools)
  - "already in your software" matching
  - each record's integration note
- The owner's text is not logged and not stored.

## Roadmap (16 weeks)

1. **LLM interpreter.** Behind the existing `ProblemInterpreter` interface, output validated against the taxonomy, with the rule interpreter as fallback. Measure on the same held-out set.
2. **Live discovery.** A `SearchProvider` plus a safe page fetcher. Verified finds are written back into the catalogue, so it grows with use.
3. **Scheduled ingestion** from app marketplaces (QuickBooks, Square, Shopify, Jobber), AI directories and Product Hunt, with a "ready for small business" filter.
4. **Semantic retrieval** (pgvector) alongside the tags. Tag coverage for the 6 gap capabilities.
5. **Per-claim evidence and freshness re-checks.** Structured pricing and integration links extracted for the Rating and Integration modules.
