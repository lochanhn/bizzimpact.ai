# Questionnaire and discovery quality update

November 8, 2026. This records the user's requested changes and the limits of what has been verified.

## Assessment

The reusable profile is useful background, but business category and a customer segment such as B2B are insufficient to select tools. The actual task, its current workflow, the requested outcome, and requirements that must be checked are more decisive. A description of the current workflow must not be mistaken for a request to automate every task mentioned.

The previous catalogue lookup returned the first matching records in its input order. That could omit a candidate covering more requested capabilities later in the catalogue. The fallback parser also confused website marketing with website chat, and scheduling social posts with scheduling appointments.

The revised wording is a design improvement, not an empirically validated questionnaire. GOV.UK's form guidance recommends knowing why each answer is needed and using branching for relevant questions. Our decision is to retain the short reusable profile and ask optional task-specific questions at search time. [Form structure guidance](https://www.gov.uk/service-manual/design/form-structure).

## Implemented changes

- Replaced B2B/B2C labels with people/households, businesses, both, public agencies/institutions, and something else. Added an optional description of the owner's actual customers.
- Reworded priorities as everyday tasks, while preserving stored values for existing profiles.
- Made budget currency explicit as US dollars and removed overlapping displayed budget/team-size boundaries. Historical enum IDs such as `51_250` remain for compatibility; new display wording is `51–249 people` plus `250 or more people`.
- Added optional current workflow, desired outcome, and requirements text to discovery. The owner reviews and can edit the request before a run starts. Missing details remain unknown.
- Saved search drafts per business in session storage so returning to the dashboard can restore the request.
- Stored the new customer detail in profile JSON and task context in discovery-run JSON snapshots. Existing normalized database columns remain compatible; no schema migration is required for these additions.
- Included desired outcome in deterministic interpretation. Current workflow and constraints are context, not automatic capability requirements. Added regression cases for selected explicit exclusions and unsupported tasks.
- Examined the full catalogue before limiting results, ordering by the number of requested capabilities covered. Ties retain catalogue order. This is a retrieval heuristic, not a suitability rating or independent quality measure.
- Exposed interpreted tasks and supplied context on the results page, with a route to refine the request. Requirements remain unverified until vendor evidence supports them.
- Expanded the model interpretation context with business description, customer description, software, and task context. External search queries still use allowlisted normalized terms rather than copying private prose.

## What the OpenRouter key is for

The key authorizes model requests through OpenRouter. In this product the intended sequence is:

1. Interpret an owner's description into a controlled task/capability structure, preserving uncertainty and exclusions.
2. Search the researched catalogue first, without an external web request.
3. If separately enabled and necessary, retrieve additional vendor leads through search, keeping auditable source links.
4. Extract claims from fetched vendor text and require supporting excerpts. Keep new leads provisional.
5. Explain which requested tasks have evidence, which constraints remain unchecked, and what the owner should investigate next.

OpenRouter supports schema-constrained outputs for compatible model/provider endpoints. Our adapter currently requests JSON and validates it locally with Pydantic; choosing a tested compatible endpoint for native strict structured output remains part of a live trial. Schema compliance checks shape, not factual truth. [Structured output documentation](https://openrouter.ai/docs/guides/features/structured-outputs).

OpenRouter also documents a web-search capability. Search and model inference are distinct from verifying a vendor's claims, availability, exact integration actions, prices, or actual performance. [Web-search documentation](https://openrouter.ai/docs/guides/features/plugins/web-search).

## Verification performed

- 20 synthetic interpretation cases exercise calls, booking, website chat, marketing, stock, invoices, quotes, repetitive work, explicit exclusions, unsupported physical work, outbound calls, and ambiguous channels.
- Retrieval regression checks that a candidate later in a large list can precede earlier partial matches before the result limit is applied.
- API tests cover optional context, length limits, saved snapshots, unchanged zero-call demo behavior, and unresolved requirements.
- Mocked provider tests verify richer interpretation context and redaction, with no network access.
- UI tests cover plain-language customer options, request review/editing, a single explicit search submission, and per-business draft restoration.

Commands from the repository root:

```bash
uv run --directory backend pytest -q
npm test --prefix website
npm run typecheck --prefix website
```

These checks do not establish real-world search accuracy. No paid OpenRouter call has been made as part of this update.

## Next validation steps

1. Observe representative owners describing a real task. Check whether they understand each question, whether choices fit, where they hesitate, and whether optional details materially change useful candidates.
2. Build a separate human-labelled evaluation set from fictional or consented/de-identified examples. Record expected tasks, irrelevant tasks, necessary follow-ups, acceptable candidates, evidence requirements, and cases where no supported tool should be offered.
3. Compare catalogue-only interpretation with a bounded model-assisted trial using the same cases. Measure task precision/recall, irrelevant candidates among the first results, unsupported factual claims, unnecessary follow-ups, latency, and actual provider cost. Keep evaluation examples separate from examples used to tune prompts.
4. Add only follow-ups that change a decision: message capture versus confirmed booking; existing calendar/system; sales/stock history for forecasting; drafting versus approved publishing for marketing. Do not require every owner to answer every branch.
5. Before a live trial, replace the previously shared key in server-only configuration, choose a current model, set a small explicit trial budget, and obtain authorization for paid calls. Start with interpretation only and web search disabled. Review failures before expanding access.

Until that work is done, describe results as evidence-backed candidates for investigation, not verified best tools or guaranteed savings. Live paid flags remain disabled.
