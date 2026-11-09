# Three-engine integration verification

Verified November 8, 2026 (US Eastern), combining `main` at `c4b338c` with `salman/three-engines` at `9fff4a7` (PR #1).

## Resolution and compatibility

- Kept both README sections: existing country/region controls and the new three-engine implementation.
- Kept one homepage **Get started** action and dashboard landing. The optional full AI plan is available from the dashboard, including an empty workspace; it does not replace login or start onboarding automatically.
- Preserved existing account discovery, search progress, Back navigation and country/region controls. Reused the location picker in `/start`, retaining legacy US examples while accepting international countries and optional regions. US advisor links are offered for US profiles.
- Added visible loading spinners to the new plan/discovery buttons. Internal navigation stays in the same tab, with a dashboard return from the new journey.
- Applied the existing same-origin submission policy to all five new POST endpoints, including the webhook hand-off and outcome check-ins.
- Production plans remain usable without a signing secret, but do not issue check-in tokens or show check-in controls until a private signing secret of at least 32 characters is configured. Example placeholder secrets are rejected. The normal check-in waiting period stays 14 days.

## Checks performed

| Check | Result |
| --- | --- |
| `npm test --prefix website` | 121 passing tests |
| `npm run typecheck --prefix website` | Passed |
| `uv run --directory backend pytest -q` | 85 passing tests; one existing upstream transport deprecation warning |
| `npm run build --prefix website` | Passed; new and existing routes built |
| Production standalone HTTP smoke | Eight routes returned 200, with signing configured and with it absent |
| `POST /api/plan` | Returned all three engines; Canadian country/region preserved; US advisor links omitted |
| Cached discovery | Four bundled inventory candidates returned without a paid call |
| Check-ins | Configured signing verified across API routes; early check-in rejected by the 14-day gate; no token issued with missing signing configuration |
| Submission origins | All five new POST endpoints rejected a foreign origin; unit tests also rejected absent origins before external work |
| Secret scan | Current tree and imported branch patches checked against the existing private provider/database values; no matches |

The first standalone smoke also checked that the homepage has one start action. DOM tests cover the existing homepage, dashboard, dependent regions, new questionnaire/results and loading transitions. Browser visual testing remains unavailable because the browser access host/capture tool failed; HTTP and DOM checks are not a visual browser session.

## Evaluation scope

The new rules-only discovery evaluator passed 30/30 tuning examples and 14/15 synthetic holdout examples, with 100% accepted-tool top-three hit rate under its labels. Holdout example H01 did not map to phone answering. These are developer-labelled examples, not real-owner accuracy. The contributor's paid AI-fallback result was not rerun during integration. No paid model calls or actual external webhook submissions were made for merge verification.

## Deployment boundary

Merging and pushing source does not deploy it. Existing EC2 image tags and the live FastAPI configuration remain unchanged until an explicit release.

The new Next.js AI client and its local accounting are separate from FastAPI's shared spend ledger. Fresh frontend AI calls remain disabled by default; use a separate provider-limited key and review concurrent/durable accounting before enabling them. Cached finds and the rules-based plan work without those calls. Check-ins require private signing configuration and persistent runtime storage if they must survive frontend replacement. See [the deployment README](../deploy/ec2/README.md) and [the architecture notes](ARCHITECTURE.md).
