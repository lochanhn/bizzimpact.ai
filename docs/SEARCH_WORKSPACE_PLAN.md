# Returning-user search workspace

## Outcome

A business profile is onboarding context, not the product's home screen. After
the first save, sign-in and confirmation always land on the dashboard. Returning
owners see a new-search workspace and their previous searches; profile editing
is an optional secondary action.

## Customer flow

```text
First sign-in without a profile -> one-time business profile -> dashboard
Returning sign-in             -> dashboard -> new search or previous search
Dashboard profile link        -> edit profile -> dashboard
```

## Data and privacy

- Search history comes from existing owner-scoped `discovery_runs`; no duplicate
  history table or migration is needed.
- `GET /businesses/{business_id}/discovery-runs` first verifies that the business
  belongs to the authenticated actor, then returns at most 30 compact summaries.
- A summary contains the run ID, status, interpreted task summary, result count
  and timestamps. Provider prompts, raw evidence packets and credentials are not
  returned.
- Opening a previous search reuses the stored run and makes no model call.

## Interface

- New search is the primary dashboard panel.
- Previous searches form a responsive side panel on wide screens and stack
  below the search form on smaller screens.
- The saved business type and **Edit business profile** remain in a compact
  header control.
- Broad profile-based suggestions remain below the workspace as a secondary
  exploration path.

## Verification

- Existing-profile onboarding still redirects to the dashboard.
- Search history is newest-first and isolated by owner and business.
- Empty history, in-progress, clarification, partial, completed and failed states
  have readable labels.
- Opening history does not start or pay for another search.
