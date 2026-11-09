# Paid AI discovery, retrieval, scores and quality checks

The user authorized paid model and web calls on November 8, 2026. The deployed service uses `openai/gpt-4.1-mini` through OpenRouter, with shared budget controls. Credentials live only in ignored local/server backend configuration. This replaces the earlier catalogue-only runtime policy; the synthetic demo still never spends credits.

## How to demonstrate it

1. Open the live website and choose **Try AI recommendations**. No signup or email confirmation is needed for this temporary trial.
2. Land on the dashboard, then choose **Create business profile**. Use fictional business details for demonstrations.
3. Describe a concrete task. Optional details capture the current workflow, desired outcome and requirements.
4. Review the request. This is the explicit point at which the owner starts a paid search. The optional current-vendor checkbox can force a bounded web lookup.
5. Inspect the interpreted tasks, candidates, score breakdowns, sources, unresolved requirements, planned/executed queries, model/prompt/rubric versions and usage.

Trial workspaces expire after two hours and are lost on backend replacement. Each trial permits four searches. Account profiles remain in PostgreSQL; trial profiles/runs are isolated in temporary SQLite storage. Both use the same researched catalogue and PostgreSQL spend ledger.

## Architecture: retrieval-augmented generation

```text
Reviewed owner request
  -> model interprets supported tasks (strict schema)
  -> local catalogue retrieval by controlled capabilities
  -> optional bounded web lookup for an empty catalogue result or explicit request
  -> source-backed candidate records (at most eight assessed)
  -> model assesses task applicability and cites claim IDs
  -> separate model call audits each explanation against the supplied evidence
  -> code calculates the index, withholds failed/provisional scores, and orders results
```

This is RAG over structured records and claim/source documents. With 111 catalogue records, direct structured retrieval is adequate for the demo and fits the existing small EC2 host. A vector database is not required for this catalogue size. MCP would expose tools to an external agent; it would not establish relevance or factual correctness. The app already calls its own backend and provider interfaces directly, so an MCP server is not part of this implementation.

### Interpretation and search basis

The versioned system prompts and capability definitions are in [`app/prompts.py`](app/prompts.py). The model receives the task and bounded business/workflow context as data. Its output must validate against the controlled eleven-capability schema. Unknown IDs are rejected. The current workflow does not automatically become a requested feature; unsupported physical work and unspecified requests can return no supported task.

Contact-channel clarification remains controlled by application rules. A raw-model clarification miss was observed in evaluation, and the application-level rule still asks the question when needed.

The researched catalogue is examined before applying a result limit. Retrieval first selects records tagged with the requested capabilities and prioritizes coverage. A local BM25 lexical score over names, descriptions and feature/integration claims breaks ties using the task and desired outcome; this can surface a task-specific record later in the catalogue instead of merely taking alphabetical matches. The first eight candidates are supplied to the assessment model. Retrieval scores and the candidate pool are recorded separately from the visible 50/25/25 index. This is a small candidate pool; the model does not invent products or search its memory for an unrestricted list.

Planned web queries combine supported task terms, allowlisted industry/subtype terms, and a relevant allowlisted existing tool. Private prose is not copied verbatim into external search queries. At most one planned query is executed per live run; model/web retries and extraction must fit the five-call model budget. If an interpretation retry consumes extra calls, web work is skipped to preserve capacity for quality checks.

Web search uses OpenRouter's documented Exa plugin with up to three results. Fetching checks destinations, redirects, schemes, ports, public IPs, page type, size and timeouts. It attempts up to three pages and extracts from at most one successful page per run. Excerpts must occur verbatim in that page and contain at most 20 words each. Capability claims must use exact supported IDs. Absence of explicit AI evidence is treated as unknown AI functionality.

New web records remain **provisional**. They do not overwrite the curated catalogue, and public trials cannot mutate that catalogue. Provisional details are retrieved through the owner's run rather than an unauthenticated global record. Full scores are withheld until source review. Source fetch/extraction outcomes are recorded in the retrieval audit.

## Experimental evidence match index

Code, rather than a model-generated number, calculates the index in [`app/quality.py`](app/quality.py).

| Component | Maximum | Calculation |
| --- | --- | --- |
| Requested task coverage | 50 | `50 × matched requested capability count / requested capability count` |
| Source completeness | 25 | `25 × matched capabilities backed by dated source records / matched capability count`; accepted claim states are vendor-documented, third-party-reported or independently-tested |
| Workflow relevance | 25 | Separate AI applicability label: direct = 25, partial = 12.5; unclear/not relevant cannot receive a full approved index |

The total is rounded to one decimal. Ties retain retrieval order. A deterministic exact-action guard caps workflow points at 12.5 when booking is requested but only broad scheduling tags are evidenced; an explicit documented feature is needed for full booking workflow points. An unrelated candidate rejected by the evidence audit is omitted and recorded in the report. The full score is absent when the assessment/audit is unavailable, citations fail, source evidence is incomplete, or the record is provisional.

This is a chosen, experimental rubric. Its weights have not been calibrated against owner outcomes. A 100/100 means complete support under these three dimensions; it does **not** mean a product is perfect, affordable, compatible, secure, reliable, independently tested or guaranteed to improve revenue. Pricing, exact integration actions, usage limits, regional availability, setup effort and privacy terms remain separate verification tasks. Missing data is never converted into a positive finding.

The UI exposes all three components, a limitation statement, and supporting URLs. The assessment model is never asked to output a score.

## Quality gates and prompt evaluation

- Native strict JSON Schema is requested from a compatible endpoint, with required-parameter routing; Pydantic validates output again locally.
- Assessment tool IDs must exactly match the retrieved set and be unique.
- A direct/partial explanation must cite claims belonging to that same tool. Unknown or cross-tool citations are rejected.
- A separate model call audits the explanation against those claims and the actual task. Unsupported explanations and full scores are withheld.
- The second call uses the same model family. It is an automated consistency check, not independent human review or proof that vendor claims are true.
- Numerical weights and bounds are deterministic. The model cannot supply arbitrary scores or override source/provisional gates.
- Prompt injection and unsupported-claim cases are included in tests and paid evaluations.

Prompts are versioned as `discovery-rag-v1.4`; the index is `evidence-match-v1`. The assessment/audit receive recorded limitations and distinguish broad appointment/capture tags from exact actions such as confirmed bookings or automatic sending. Evaluation artifacts record model, prompt, costs/tokens, latency, expected/predicted tasks, and candidate checks in [`evaluations/`](evaluations/). Synthetic evaluation examples are not real-owner accuracy evidence. Once failures are examined or prompts are tuned using a dataset, treat it as development data and create a new held-out set for a future study.

Model applicability labels and audit decisions can vary across repeated runs, even at low temperature. Each run stores its profile/context snapshot, retrieved evidence, model/prompt/rubric versions and results; refreshing an existing run does not trigger new model calls. The deterministic index is conditional on those stored assessments, not a claim of universal model reproducibility.

### Observed paid tests during implementation

- GPT-4.1 mini accepted strict-schema requests. Gemini 2.5 Flash's selected provider route rejected them, so it was not enabled.
- On the corrected neutral-profile dataset, GPT-4.1 mini returned the expected task sets in 15/15 examples. Its contact clarification flag missed one case (14/15 overall semantic checks); the application rule covers that case. These are small synthetic checks, not a measured real-world accuracy rate.
- An earlier evaluation mistakenly used a landscaping profile for a bakery request. That contradictory fixture was corrected and the original report retained.
- Real RAG calls produced source-audited catalogue recommendations for phone handling, invoice work and marketing. A restaurant inventory search initially returned no accepted candidates, exposing a capability-ID extraction defect. After fixing that prompt/validator contract, it produced a provisional source-backed lead and correctly withheld a full score.
- Early provider rejections left conservative spend reservations. Those were reconciled once confirmed as rejected requests; original evaluation accounting is annotated. Provider-reported costs and conservative reservations must not be confused.
- HTTPS testing exposed another failure mode: the audit sometimes rejected an accurately limited partial explanation because the product did not fully meet the request. Later prompts explicitly distinguish factual support from full compatibility, provide positive/negative audit examples, and request shorter explanations. Rejected proposed explanations and audit reasons are retained for operator review; the audit can still make mistakes.

The key's usage increased by about US$0.083 through these implementation tests before deployment verification. Later calls add to that amount; check the current key usage rather than treating this snapshot as a permanent balance.

## Cost and access controls

- PostgreSQL stores an atomic shared reservation/spend ledger with a US$20 application stop target.
- Before every paid call, the provider's key endpoint is checked. Calls stop before the remaining key credit would fall below the US$5 buffer plus a US$0.10 reservation.
- Maximum five model calls per run; a normal catalogue RAG run uses three (interpret, assess, audit). An optional web search and extraction can use the other two.
- Unknown cost keeps the reservation and blocks further calls in that run. Confirmed rejected non-search requests release unused reservations.
- Public trials allow three session creations per backend client IP per minute, ten run starts per backend client IP per minute, and four searches per session. Because requests pass through the frontend proxy, IP limits are effectively shared across that proxy; this favors a small judged demo, not large public traffic.
- No paid work occurs on dashboard load, baseline retrieval, availability checks, or merely creating a trial. Owners explicitly confirm the reviewed search.
- Synthetic `demo_` tokens never become live. Separate `trial_` tokens are isolated and use the shared ledger. Provider credentials are never sent to the browser.

These are application controls plus the observed key's provider-side limit. Provider-managed search costs remain subject to provider billing and key limits. This is not a production billing system or an unconditionally guaranteed hard cap under all external failures.

## Running evaluations explicitly

Load `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `DATABASE_URL` from private backend configuration. Never pass the key on a command line or write it into a report.

```bash
# Repository root; costs money and requires explicit operator authorization.
uv run --directory backend --env-file .env.local python evaluate_live.py \
  --paid-authorized --models openai/gpt-4.1-mini \
  --cases data/live-evaluation.json --limit 15 --budget-usd 1
uv run --directory backend --env-file .env.local python smoke_live.py \
  --paid-authorized --cases calls invoices marketing
# Add --web only when testing current vendor retrieval.

# From the repository root: real HTTPS trial, isolation, four-run limit and demo checks.
# Starts four bounded paid runs using fictional profiles; requires the live trial flag.
node backend/verify_deployment.mjs --paid-authorized
```

The interpretation evaluator enforces its explicit test budget conservatively. The RAG smoke script has four fixed synthetic cases and a five-call bound per case, sharing the application ledger and credit floor; it has no separate trial-budget option. Do not use it as an unrestricted traffic generator.

The HTTPS verifier checks API behavior and client route shells without launching a browser. It does not claim visual or interactive browser verification. Automated backend and DOM tests cover the component behavior separately.

## Runtime configuration and disabling paid use

The authorized live backend uses `DISCOVERY_MODE=live`, `OPENROUTER_ENABLED=true`, `EXPLICIT_LIVE_AUTHORIZED=true`, `PUBLIC_AI_TRIAL_ENABLED=true`, and `OPENROUTER_MODEL=openai/gpt-4.1-mini`. `LIVE_WEB_ENABLED=true` permits the bounded fallback/explicit lookup. `OPENROUTER_API_KEY` is server-only. Templates keep paid flags off for new environments.

To stop public AI trials, set `PUBLIC_AI_TRIAL_ENABLED=false` in the private server environment and recreate the backend container. To disable all paid inference, also set `OPENROUTER_ENABLED=false` and `DISCOVERY_MODE=catalog`. Changing a file alone does not change an already-running container's environment. Follow the [EC2 deployment reference](../deploy/ec2/README.md), preserving NourishNet and Caddy. Synthetic demo behavior remains available.

## Primary references

- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [OpenRouter web search](https://openrouter.ai/docs/guides/features/plugins/web-search)
- [OpenRouter credit and rate limits](https://openrouter.ai/docs/api_reference/limits)

Remaining validation: representative owners, genuinely held-out labelled tasks, exact vendor integration/price checks, real account email/session flows, and load/security testing beyond this bounded hackathon deployment.
