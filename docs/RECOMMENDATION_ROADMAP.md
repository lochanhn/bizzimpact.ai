# Recommendation and tool-guidance roadmap

## Product decision

Customers should not see internal match scores, rubric points, vector similarity,
BM25 values, or rank numbers. Those values are useful for ordering, testing and
quality control, but they are easy to mistake for product quality or a promised
business outcome.

The customer-facing result should answer four questions instead:

1. Why might this tool help with the task I described?
2. Which parts of my task does it cover?
3. How do I try it safely with my current workflow?
4. What must I verify before I pay for or connect it?

## Source of truth

The existing Supabase PostgreSQL catalogue remains the source of truth. It
already contains normalized tools, capabilities, source pages and evidence
claims. We do not create a second catalogue or copy customer data into a vector
vendor.

Each tool receives a retrieval document assembled from:

- product name and researched description;
- controlled capabilities;
- source-backed feature, integration and pricing claims;
- known limitations and unresolved checks; and
- catalogue status and evidence dates.

The retrieval document is embedded with one pinned model and stored beside the
tool ID in PostgreSQL using pgvector. The same model must be used for catalogue
and query embeddings; changing models requires a complete re-index.

## Retrieval pipeline

```text
Owner problem and desired outcome
  -> controlled task interpretation
  -> mandatory capability filter
  -> lexical relevance over the full evidence document
  -> semantic similarity from pgvector (when indexed and enabled)
  -> evidence-backed AI applicability review
  -> deterministic safety/evidence checks
  -> internal ordering
  -> plain-language recommendation and setup guidance
```

Vector similarity is a recall aid, not proof that a product is suitable. A tool
cannot bypass required capabilities, evidence gates, budget checks or explicit
owner constraints merely because its text is semantically similar.

## Implementation phases

### Phase A — customer experience

- Hide numerical match, fit, confidence and pillar scores.
- Keep internal scores in stored run data for evaluation and ordering.
- Show plain-language reasons, evidence links, limitations and setup guidance.
- Give every catalogue result a deterministic starter checklist.

### Phase B — hybrid index

- Enable the Supabase `vector` extension.
- Add `tool_retrieval_documents` with a 1536-dimensional embedding, content
  hash, model ID and update timestamp.
- Add a server-only semantic-match function that can filter by capability.
- Add an explicit indexing command; indexing never runs on application startup.
- Fall back to capability + lexical retrieval if embeddings are unavailable.

### Phase C — quality evaluation

- Maintain a held-out set of real-looking small-business tasks.
- Measure candidate recall, unsupported-result rate, evidence citation validity,
  setup-guide usefulness and latency/cost.
- Compare structured-only, vector-only and hybrid retrieval. Ship hybrid only if
  it improves recall without increasing unsupported recommendations.

### Phase D — evidence refresh

- Add an operator-scheduled refresh queue for stale vendor pages.
- Fetch only public allowlisted URLs with the existing SSRF protections.
- Treat page text as untrusted, require verbatim excerpts and keep changes
  provisional until reviewed.
- Do not browse a vendor site automatically every time a customer opens a card.

### Phase E — deeper setup guides

- Store reviewed, tool-specific setup modules for the most frequently selected
  products first.
- Include prerequisites, a small pilot workflow, approval points, success
  measures, rollback steps and official documentation links.
- Never claim that an account, integration or automation was created unless the
  customer explicitly authorizes and completes that action.

## Production gates

- Embeddings and OpenRouter credentials remain server-only.
- Semantic search is controlled by `EMBEDDINGS_ENABLED`; disabling it preserves
  the deterministic fallback.
- No customer prose is stored in the catalogue embedding table.
- Catalogue embeddings are regenerated only when the content hash or model ID
  changes.
- Internal retrieval and quality metrics stay available in test/evaluation
  reports, not in customer-facing pages.

## Current completion target

The first delivery removes visible scores, adds universal evidence-based setup
guidance, creates the pgvector schema and indexing path, wires optional hybrid
retrieval into the backend, and adds regression tests for the new behavior.
