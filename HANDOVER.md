# BizzImpact.ai — project handover

**Purpose:** Paste this file into the next chat before continuing work. It is a factual project snapshot as of **November 8, 2026**.

## EC2 deployment update — November 8, 2026

- Hosting target is the user's existing EC2 instance `i-0c83c7fa3551b554c` at `3.92.95.188`, an Amazon Linux t2.micro shared with NourishNet.
- BizzImpact hostname: `https://bizzimpact.3-92-95-188.sslip.io`. NourishNet remains at `https://3-92-95-188.sslip.io`.
- Images build through `.github/workflows/ec2-images.yml`, avoiding builds on the small EC2 host. Dockerfiles exclude local environment files.
- Containers `bizzimpact-website` and `bizzimpact-backend` use a separate `bizzimpact` network. The frontend binds only `127.0.0.1:3100`; the backend has no public port. Existing Caddy handles HTTPS. Its original configuration was backed up to `/home/ec2-user/bizzimpact/Caddyfile.before-bizzimpact`.
- The server deployment directory is `/home/ec2-user/bizzimpact`; private environment files have permissions 600. No credential values are committed. Runtime memory limits are 256 MiB frontend and 128 MiB backend, with bounded swap and lower CPU shares. This is a constrained demo, not a capacity-tested production deployment.
- Deployment instructions and rollback scope are in `deploy/ec2/README.md`. The shared Caddy and NourishNet containers must remain running.
- Supabase public Auth callback configuration and genuine signup/session verification remain pending. The user declined browser access during deployment. Paid AI and web retrieval remain disabled.
- Public HTTPS verification passed: guest session, profile save, baseline, completed landscaping discovery, logout cleanup, and cross-origin rejection. Zero model/search calls were used. Backend database/catalogue reads passed from EC2; NourishNet remained HTTP 200. All 45 frontend tests, type checking, and both Docker builds passed. The production Origin check now uses configured HTTPS `SITE_URL` because Caddy terminates TLS before forwarding internally over HTTP.

## 1. Project in one sentence

### Supabase setup update — November 8, 2026

- Connected to existing `bizzimpact`, project ref `zqtndgqyaibgrholekxu`, region `us-east-1`, status `ACTIVE_HEALTHY`.
- Applied the normalized Phase 1 discovery schema via migration `discovery_phase1_schema` and recorded `authenticated_access` to grant only operations covered by ownership policies. All 12 public tables have RLS enabled. The legacy `business_profiles` table pre-existed and its ownership policies were inspected. A preceding accidental comment-only migration `discovery_phase1` made no schema changes.
- Local ignored `website/.env.local` and `backend/.env.local` contain the project URL and publishable key. Backend mode is `catalog`; all paid/live flags are off.
- The combined development launcher now loads `backend/.env.local` only for the Python child; exported variables take precedence.
- The private SSL `DATABASE_URL` is configured locally through the session pooler; the backend environment file has owner-only permissions. Seeded 111 tools, 117 sources, 209 claims, and 11 capabilities. PostgreSQL profile round-trip and two-owner RLS isolation passed with temporary records rolled back. Local services were restarted with these settings.
- Still required: verify Auth redirect configuration and real signup email/sign-in/session refresh. The Supabase integration became unavailable during this session, but direct PostgreSQL administration works. GitHub CLI access to `lochanhn/bizzimpact.ai` is confirmed.
- The original snapshot below describes the state before this setup update. See `website/AUTH_SETUP.md` for current setup details.

BizzImpact.ai is a hackathon web application that helps a small-business owner describe their business and problem, then gives them an evidence-backed starting list of suitable AI tools and a safe path to investigate them.

It is **not** meant to be a generic chatbot or a tool that blindly claims one vendor is “best.” Phase 1 is a discovery product: gather context, search a catalogue/evidence sources, show what is known and unknown, and make it easy to continue.

## 2. Team and repository

- Hackathon: **AI for Small Business Hack-a-thon**.
- Team: **Team 33 – impact.ai**.
- GitHub repository: `https://github.com/lochanhn/bizzimpact.ai.git`.
- Repository visibility: private.
- Working branch: `main`.
- Current latest commit: **`0e45eb7 Implement Phase 1 onboarding and discovery workflow`**.
- The last `git push` succeeded and the following `git pull --no-rebase origin main` reported **Already up to date**. The working tree was clean immediately afterwards.
- Collaborators/invitations were set up by the user in GitHub. Do not change access unless asked.

## 3. Important safety rules and user preferences

1. The organizing team supplied an OpenRouter API key with a **$25 credit limit**. It exists only in a local ignored environment file. Never print it, put it in Markdown, commit it, send it to GitHub, or expose it to the browser.
2. The key was shared in chat earlier. Treat it as sensitive and recommend rotation/revocation before any public/live use.
3. **Do not use a paid OpenRouter call unless the user explicitly authorizes it.** No live model/search request has been made so far.
4. The user requested short, plain-language chat answers by default. They asked for a detailed handover file here as the exception.
5. Before launching, opening, activating, or inspecting any desktop app or browser window (including Chrome, PowerPoint, Google Docs), ask the user for explicit permission. File, CLI, Git, tests, and HTTP-only checks are okay without that permission.
6. Use `apply_patch` for local file edits. Do not overwrite unrelated teammate work.

## 4. Product direction agreed so far

### Target user

Start broadly with very small, owner-operated businesses (“mom-and-pop” businesses), such as restaurants, coffee shops, HVAC technicians, landscaping companies, and similar local service businesses. Do not try to build a separate app for every industry.

### Main problem

These owners may benefit from AI but usually lack time, technical confidence, money, trustworthy guidance, and a clear connection to the software they already use. Their problems include missed leads, follow-up work, scheduling, estimates/quotes, invoices, marketing, customer support, inventory, and repetitive operations.

### Product promise

1. Ask an owner enough questions to understand their business and current software without making them answer 50 questions.
2. Offer a zero-cost initial catalogue view based on their industry and priorities.
3. Let them describe a real problem in normal language.
4. Retrieve and explain candidates with sources/evidence and clear unknowns.
5. Later phases can rate, compare, recommend bundles, estimate impact/cost, and provide implementation guides. Those are **not** Phase 1 claims.

## 5. Research completed and where it is documented

The research is deliberately stored under the team member folder rather than spread across many top-level documents.

| Location | What it contains |
|---|---|
| `Lochan/research/sources.md` | First-round source list and research provenance. |
| `Lochan/research/research-notes.md` | Findings on small-business needs/problems. |
| `Lochan/research/research-round-2-sources.md` | Further papers, reports, interviews/public evidence, and source links. |
| `Lochan/research/research-round-2-notes.md` | Takeaways from the second research round. |
| `Lochan/research/questionnaire-design.md` | Why the questionnaire is designed around business context, needs, existing tools, constraints, trust, and follow-up. |
| `Lochan/research/tool-catalogue/sources.md` | Evidence/source links for the AI tool catalogue. |
| `Lochan/research/tool-catalogue/research-notes.md` | Tool-catalogue research conclusions. |
| `Lochan/research/tool-catalogue/retrieval-audit.json` | Machine-readable source/retrieval audit. |
| `Lochan/v1-specification.md` | Earlier V1 product direction. |

Research conclusions used in the build:

- Owners need help with outcomes and implementation, not just a huge AI-tools list.
- Trust depends on showing real sources, transparency about unknowns, cost awareness, and respecting existing software.
- The app must keep initial effort low, but use conditional follow-ups when a user’s answer materially changes the result.
- Existing software/integration matters: a useful tool that cannot fit the owner’s workflow is not a useful recommendation.
- It is important to distinguish researched vendor records from synthetic demo data and unverified live-search leads.

## 6. Reference material from the teammate

- The teammate’s Word reference is `Anhinav/bizzimpact_ai_Phase1_Expected_Product_Specification_v1.docx`.
- Related prompt/reference file: `Anhinav/01_MASTER_BUILD_PROMPT.md`.
- The Word document was treated as **reference material**, not as instructions that override the user.
- It was re-read and audited. The build/status matrix is in `website/PHASE1_STATUS.md`.

The Phase 1 reference expects:

1. authentication;
2. a fixed, three-screen business profile/onboarding flow (Q1–Q8, plus a conditional optional Q9);
3. saved reusable business profiles;
4. a no-AI/no-web catalogue baseline;
5. a natural-language discovery workflow with bounded retrieval;
6. evidence/provenance rather than premature scores;
7. a FastAPI/Pydantic service, Supabase persistence, and a controlled model/search adapter;
8. strong cost, privacy, and network safety boundaries.

## 7. What is built now

### Frontend: Next.js application

The Next.js application is in `website/`.

Public/user-facing routes now include:

| Route | Purpose |
|---|---|
| `/` | Phase 1 discovery landing page; no visible fit scores. |
| `/auth` | Email/password account pages. |
| `/onboarding` | Exact Phase 1 business questionnaire/profile intake. |
| `/profile` | Edit an existing business profile. |
| `/dashboard` | Saved-business dashboard and zero-call catalogue baseline. |
| `/discovery/[runId]` | Polls and renders the real discovery job state/results. |
| `/tools/[toolId]` | Evidence/claim/source-oriented tool detail view. |
| `/catalog` | Browsable researched catalogue. |

Important frontend files:

- `website/components/phase1/onboarding-form.tsx` — approved questionnaire interaction.
- `website/components/phase1/shared.tsx` — shared Phase 1 display components.
- `website/app/api/v1/[...path]/route.ts` — same-origin Next.js proxy to FastAPI.
- `website/lib/phase1/` — API, profile and type helpers.
- `website/data/onboarding-spec.json` — fixed question/option definitions.
- `website/data/discovery-catalog.json` — browser-side mirror of the researched catalogue.

The old score-based prototype is preserved in `website/components/prototype.tsx` so earlier tests are not destroyed, but it is **not mounted as the public main experience**.

### AI-tool catalogue

- There are **111 researched, evidence-linked tools** in the catalogue.
- Tool sources and extraction audit live under `Lochan/research/tool-catalogue/`.
- The frontend uses `website/lib/catalog.ts`, `website/lib/catalogue-expansion.ts`, and `website/data/catalogue-expansion.json` / `discovery-catalog.json`.
- The backend contains a matching researched export in `backend/data/researched-catalog.json`.
- The catalogue has a generation/export script: `website/scripts/export-discovery-catalogue.ts`.
- Do not confuse this real researched catalogue with the clearly labelled fictional/synthetic fixtures used to prove demo scenarios.

### Backend: FastAPI service

The backend is in `backend/`, with a pinned `uv.lock` and Python requirement `>=3.11`.

Key files:

| File | Role |
|---|---|
| `backend/app/main.py` | FastAPI app and `/api/v1` routes. |
| `backend/app/contracts.py` | Pydantic request/response contracts and capability IDs. |
| `backend/app/engine.py` | Discovery state machine, deterministic parser and bounded planner. |
| `backend/app/providers.py` | Mock, OpenRouter, search, fetcher interfaces and safety controls. |
| `backend/app/storage.py` | Isolated demo SQLite store and PostgreSQL/Supabase-oriented adapter. |
| `backend/seed_catalog.py` | Explicit operator command to seed the researched catalogue in PostgreSQL. |
| `backend/data/scenarios.json` | Landscaping, restaurant, and ambiguous-channel fixtures. |
| `backend/data/synthetic-catalog.json` | Clearly fictional demo-only entries. |
| `backend/data/reference-openapi.yaml` | Reference API contract. |

The supported capability categories are: voice receptionist, lead capture, automated follow-up, appointment scheduling, quote generation, demand forecasting, inventory optimization, invoice automation, marketing content, customer-support chat, and workflow automation.

### Discovery flow

1. Create or select a business profile.
2. Get a baseline from the researched catalogue. This makes **zero model and zero web calls**.
3. Enter a natural-language problem.
4. The discovery engine runs states such as `queued`, `parsing`, `needs_clarification`, `catalog_search`, `web_search`, `enriching`, and terminal completed/partial/failed states.
5. If only the contact channel materially matters, Q9 asks for that answer; the owner can explicitly Skip it.
6. Results show evidence/provenance, retrieval channel, and unknowns. They do not claim a score, “best” tool, or independently verified integration.

The query planner has strict bounds: a maximum of three queries and only allowlisted relevant industry/subtype/software context can enter an external query.

### Authentication, profiles, and data

- A Supabase-based account foundation exists in `website/app/api/auth/` and session helpers in `website/lib/auth/`.
- The app supports email/password signup/sign-in/sign-out and server-side session verification when a real Supabase project is configured.
- The database migrations are:
  - `website/supabase/migrations/202611070001_business_profiles.sql`
  - `website/supabase/migrations/202611070002_discovery_phase1.sql`
- The second migration provides the Phase 1 normalized business/discovery/evidence schema, owner policies, snapshots and budget ledger.
- No real Supabase project has been created/configured yet. The local no-account demo instead uses an isolated opaque cookie and temporary SQLite state.
- **Do not call the temporary SQLite demo storage production-ready.** It is okay for a short demo but resets if the host restarts.

### Logging, privacy, cost, and network safety

- Application logs are structured and intentionally do not log original customer prose, passwords, email addresses, or tokens.
- Model use is mock-only by default. A live OpenRouter provider exists only behind multiple explicit flags.
- A demo identity can never invoke paid model calls.
- Live configuration has a maximum of five explicit model calls/run, three planned queries, five vendor domains, ten page fetches, and a `$20` reservation stop target. This is application-side protection; it does not replace provider billing limits.
- Safe fetching rejects unsafe schemes, embedded credentials, unsupported ports, non-public IPs, unsafe redirects, oversized pages, and untrusted page instructions.
- No real external discovery, model inference, or vendor-page fetch was performed during implementation/tests.

## 8. Tests already run

All of these passed before the current handover commit:

```bash
uv run --directory backend pytest -q
# 41 passed

npm run typecheck --prefix website
# passed

npm test --prefix website
# 44 passed

npm run build --prefix website
# passed
```

Total automated tests passed: **85**.

There was one upstream Starlette/httpx deprecation warning, but no test failure.

Also verified through local HTTP (without opening a browser): the Next.js proxy reached FastAPI, a demo cookie was issued, business data was saved, zero-call baseline worked, landscaping discovery completed, ambiguous Q9 Skip resumed, restaurant inventory scenario returned, and key routes returned HTTP 200.

What has **not** been verified:

- Real Supabase signup/confirmation, session refresh, two-user ownership, RLS, SQL migration and seed execution.
- Live OpenRouter/model behavior or real web retrieval.
- A real deployed environment.
- Browser/mobile/keyboard/pixel-level visual checks. Opening a browser requires the user’s permission.

## 9. Local development commands

From the repository root:

```bash
# Install frontend dependencies if missing
npm --prefix website install

# Install/prepare Python dependencies if uv is available
uv sync --directory backend

# Start FastAPI and Next.js together
npm run dev:full --prefix website
```

The combined local command starts:

- Next.js at `http://localhost:3000`
- FastAPI at `http://127.0.0.1:8001`

The frontend proxy reads `DISCOVERY_BACKEND_URL`, which defaults to `http://127.0.0.1:8001` in `website/.env.example`.

For test/build checks:

```bash
uv run --directory backend pytest -q
npm run typecheck --prefix website
npm test --prefix website
npm run build --prefix website
```

## 10. Environment configuration

Templates only (safe to commit):

- `website/.env.example`
- `backend/.env.example`

Never commit or paste real `.env.local` files.

### Local demo

No credentials are required for the synthetic demo. Keep it in mock/catalog mode and leave all paid/live flags off.

### To enable real accounts and persistent data

Follow `website/AUTH_SETUP.md` exactly:

1. User creates a Supabase project.
2. Populate website local environment values for the project URL and **publishable** key only.
3. Run migrations `001`, then `002`, once, in Supabase SQL editor.
4. Put backend-only `SUPABASE_URL`, publishable key and private `DATABASE_URL` in the backend environment.
5. Run `uv run --directory backend python seed_catalog.py` after database settings exist.
6. Configure Supabase Site URL and auth callback URLs.
7. Test two genuine accounts and RLS before calling login/persistence live.

Do not use a Supabase service-role key in the browser.

### To enable paid AI later (not authorized yet)

Only after the user explicitly says to proceed and rotates/replaces the key in a server-only backend environment:

- set `OPENROUTER_API_KEY` and a tested `OPENROUTER_MODEL`;
- set `DISCOVERY_MODE=live`;
- set `OPENROUTER_ENABLED=true`;
- set `EXPLICIT_LIVE_AUTHORIZED=true`;
- initially leave `LIVE_WEB_ENABLED=false`.

Run one bounded real parse-only test first. Do not make the demo identity capable of paid calls.

## 11. Recommended free hosting plan

Use three services for the hackathon demo:

| Layer | Recommended host | Why |
|---|---|---|
| Next.js frontend | Vercel Hobby | Fastest deployment for this Next.js app. Its free Hobby plan is for personal/non-commercial use, which is appropriate for a hackathon demo but not a real commercial launch. |
| FastAPI backend | Render Free Web Service | Runs the Python service as a normal long-running web process. |
| Auth/database | Supabase Free | Matches the existing authentication and PostgreSQL migration setup. |

Important free-hosting limitation: Render’s free services sleep after 15 minutes of inactivity and can take about a minute to wake. Their filesystem is ephemeral, so the current local SQLite demo data disappears on restart/sleep. Use Supabase/PostgreSQL for a stable judge demo with saved data.

No hosting account has been configured and no deployment has been made yet.

Suggested deployment setup after Supabase is ready:

1. Create a Render Web Service connected to this private GitHub repo, rooted at `backend/`.
2. Configure Python 3.11+; use a build command that installs `uv` then runs `uv sync --frozen`; start with:

   ```bash
   uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. Add server-only Render environment variables: Supabase URL, publishable key, database URL, and safe mock/catalog mode flags. Do not add any OpenRouter credential.
4. Create a Vercel project rooted at `website/`.
5. Set Vercel’s server-only `DISCOVERY_BACKEND_URL` to the deployed Render HTTPS URL. Set `SITE_URL` to the Vercel HTTPS URL. Add only Supabase’s public URL/publishable key as `NEXT_PUBLIC_*` variables.
6. Update Supabase Auth Site URL and allowed callback URL to the Vercel HTTPS URL.
7. Test: sign up, sign in, create/edit a profile, baseline, discovery, logout, and a second account’s data isolation.

The Next.js server-side proxy means the browser calls the Vercel origin; it reaches Render from the server. This avoids exposing the backend address/credentials to browser code and reduces browser CORS complexity.

Useful official references:

- https://render.com/docs/free
- https://render.com/docs/deploy-fastapi
- https://vercel.com/pricing
- https://vercel.com/legal/terms
- https://supabase.com/pricing

## 12. Exact next work to do, in priority order

### First: make the current demo reliably presentable

1. Ask user permission to open a browser, then visually test the local user journey and fix any layout/accessibility issues.
2. Confirm the presentation narrative uses the words **discovery**, **evidence**, and **safe next step**—not “AI guarantees the best tool.”
3. Prepare two demo stories from `backend/data/scenarios.json`:
   - landscaping company with missed calls / voice or follow-up need;
   - restaurant with inventory/planning need.
4. Clearly say synthetic entries are fictional demo fixtures, and that the 111-tool catalogue is researched separately.

### Second: connect Supabase

1. Give the user the short setup instructions from `website/AUTH_SETUP.md`.
2. Once they provide/configure project details locally, run migrations and seed the catalogue.
3. Test real authentication and privacy/ownership with two accounts.
4. Do not put the database password, service-role key, or OpenRouter key in GitHub, frontend variables, screenshots, or chats.

### Third: deploy for judges

1. Create Render and Vercel accounts/projects if needed (the user must authorize any external account/deployment action).
2. Deploy backend first, then frontend, then update Supabase redirect URLs.
3. Re-run the complete functional journey over HTTPS.
4. Keep mock/catalog discovery enabled for the judged demo unless the user deliberately authorizes one controlled paid test.

### Fourth: prepare the presentation/video

Focus on the rubric:

- **Research depth:** show sources, business pain points, 111-tool evidence-linked catalogue, and why existing software matters.
- **Small-business applicability:** show industry-aware onboarding, existing software context, zero-cost baseline, and realistic owner stories.
- **Architecture/scalability:** show Next.js frontend → FastAPI service → Supabase, bounded provider interfaces, evidence storage, owner-scoped data, and a path from mock to live.
- **User experience:** show clear onboarding, no jargon, a visible Skip option, source transparency, and a simple next step.
- **Demo/presentation:** use exactly two polished scenarios rather than showing every feature.

## 13. Future phases (not promised in the demo)

- Phase 2: explicit ranking/metrics, tool comparison, cost/benefit estimates, confidence/fit evaluation and feedback measurement.
- Phase 3: implementation walkthroughs, setup automation, integrations, adoption tracking and longer-term outcome measurements.
- Later possibilities: SBA offerings/resources, richer legacy-system connectors, human review of unverified live leads, durable job workers and fuller analytics.

## 14. Useful documents for the next chat to read first

Read these in this order:

1. `HANDOVER.md` (this file).
2. `website/PHASE1_STATUS.md` — accurate implementation/audit matrix and remaining gaps.
3. `website/README.md` — run instructions and project overview.
4. `website/AUTH_SETUP.md` — Supabase setup steps and live-AI guardrails.
5. `Lochan/research/research-notes.md` and `Lochan/research/research-round-2-notes.md` — research narrative.
6. `Lochan/research/tool-catalogue/sources.md` — catalogue provenance.
7. `Anhinav/bizzimpact_ai_Phase1_Expected_Product_Specification_v1.docx` — teammate reference only.

## 15. Short prompt to give the next chat

> Read `HANDOVER.md`, then `website/PHASE1_STATUS.md`. Continue BizzImpact.ai from the stated current Git state. Keep answers short and plain. Do not expose or use the OpenRouter key unless I explicitly authorize it. Do not open a browser or desktop app without asking me first. Our immediate priority is to make the Phase 1 demo production-ready: configure Supabase, then deploy the Next.js frontend to Vercel and the FastAPI backend to Render, while keeping paid AI disabled.
