# Connect real accounts and private Phase 1 storage

## EC2 hosting

The app is hosted on the existing EC2 instance alongside NourishNet at `https://bizzimpact.3-92-95-188.sslip.io`. Its frontend and backend run in separate Docker containers; Caddy routes this hostname to loopback port 3100. The private database connection is supplied only to the backend container. Deployment and rollback instructions are in [`deploy/ec2/README.md`](../deploy/ec2/README.md).

Supabase Auth redirect settings have not been updated for this hostname. Set Site URL to the HTTPS origin above and allow `https://bizzimpact.3-92-95-188.sslip.io/auth/callback` and `https://bizzimpact.3-92-95-188.sslip.io/auth/confirm`. Genuine signup email, confirmation, sign-in, refresh and logout need a final check after that configuration. The user requested that browser applications remain closed during deployment.

## Database connection

The `bizzimpact` Supabase project (`zqtndgqyaibgrholekxu`, US East) is connected locally through its session pooler. The normalized Phase 1 discovery schema and authenticated table grants are applied. All 12 public tables have RLS enabled; the legacy `business_profiles` ownership policies were inspected. A comment-only migration named `discovery_phase1` was accidentally recorded before the actual `discovery_phase1_schema` migration; it made no schema changes.

Local `website/.env.local` and `backend/.env.local` contain the project URL and publishable key. The backend file also contains the private SSL database connection and has owner-only file permissions. Both files are ignored by Git. Paid AI flags are disabled and backend mode is `catalog`. The database contains 111 researched tools, 117 source records, 209 claims, and 11 capabilities. PostgreSQL profile round-trip and two-owner RLS isolation passed using temporary records that were rolled back. Local services were restarted to load these settings. Email login and confirmation are enabled, but signup delivery, sign-in/session refresh, and Auth redirect configuration still need verification. The Supabase integration is currently unavailable; direct database administration works through the local backend connection.

The steps below are a setup reference for another environment; local credentials and catalogue seeding are already configured.

1. Use the existing [Supabase project](https://supabase.com/dashboard/project/zqtndgqyaibgrholekxu). Keep its database password private.
2. For another environment, copy `website/.env.example` to `website/.env.local`. In Supabase’s Connect dialog, obtain the Project URL and publishable key; fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set `SITE_URL=http://localhost:3000`. Do not use a service-role secret in any public variable.
3. For a new, empty project, run the versioned migrations in order: `202611070001_business_profiles.sql`, `202611070002_discovery_phase1.sql`, then `202611080003_authenticated_access.sql`. Do not rerun them on `bizzimpact`: the legacy table already existed and the discovery schema and grants are applied.
4. Configure backend environment variables from `backend/.env.example`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and a private `DATABASE_URL` from the project’s Connect dialog. Use a trusted server-only DB connection with `sslmode=require`. Set `DISCOVERY_MODE=catalog` for the real researched catalogue without model or web calls. Do not put DB credentials in the frontend or chat. `npm run dev:full --prefix website` loads `backend/.env.local` for the Python child process; exported environment variables take precedence. Direct uvicorn and seed commands still require these settings to be exported or loaded by the command runner.
5. From the repo root, seed the normalized catalogue using the private environment file: `uv run --directory backend --env-file .env.local python seed_catalog.py`. This writes 111 public researched tool records and their source claims, not fictional vendors. No model/search request is made.
6. In Authentication → URL Configuration, set Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback`. Use that hostname consistently. Enable email/password and email confirmation. For confirmation across devices, the Confirm signup template can link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. Standard PKCE `/auth/callback` is also supported. Check Supabase’s email delivery/rate limits; custom SMTP may be needed for a team demo.
7. Restart both servers. At `/auth`, create and confirm a test account, sign in, complete onboarding, and edit the saved profile. Returning users should go to their existing dashboard. Create a second account and verify neither can read the other’s profile/run. Test logout, refresh, confirmation, and database owner policies before describing live authentication as verified.

For production, replace the site URL and allowed redirects with the actual HTTPS origin, set the server-side proxy’s `DISCOVERY_BACKEND_URL` to the persistent Python service, and configure secret environment settings on the hosts. Cookies are HttpOnly and SameSite=Lax; signed-in backend requests use a verified Supabase bearer token. Do not deploy the SQLite demo store as the database for real private business profiles.

## Optional live model/web activation

Only after explicit authorisation and replacement of the previously shared key: configure `OPENROUTER_API_KEY` and a supported `OPENROUTER_MODEL` in backend environment, then set `DISCOVERY_MODE=live`, `OPENROUTER_ENABLED=true`, `EXPLICIT_LIVE_AUTHORIZED=true`. Leave `LIVE_WEB_ENABLED=false` for an initial parse-only test. Enable web only for a separately reviewed bounded live test. Demo identities can never invoke paid calls.

The backend uses the shared PostgreSQL reservation ledger with a $20 stop target, maximum five explicit model calls/run, three planned queries, five vendor domains and ten fetches. Provider-managed internal search operations are not guaranteed by these bounds. Review key-level restrictions and usage before enabling it; no live budget use has been tested here.

## Verification status

Mock/demo ownership, validation, origin restrictions, safe logging, provider payloads, failure fallbacks and spend reservations have automated tests. PostgreSQL schema execution, seeding, profile storage, and two-owner RLS isolation were verified directly. Real signup email, token/cookie refresh, redirect configuration, and actual OpenRouter/web discovery remain unverified. See [PHASE1_STATUS.md](PHASE1_STATUS.md) for the original implementation audit; this file records the later Supabase setup.
