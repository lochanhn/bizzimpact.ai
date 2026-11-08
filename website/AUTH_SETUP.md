# Connect real accounts and private Phase 1 storage

The no-account synthetic demo works now. Real accounts require your own Supabase project; no project has been created or connected by the assistant.

1. Open [Supabase](https://supabase.com/dashboard) yourself and create a project. Keep its database password private.
2. Copy `website/.env.example` to `website/.env.local`. In Supabase’s Connect dialog, obtain the Project URL and publishable key; fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set `SITE_URL=http://localhost:3000`. Do not use a service-role secret in any public variable.
3. In the Supabase SQL Editor, run both versioned migrations, in order: `202611070001_business_profiles.sql` (legacy saved assessment support), then `202611070002_discovery_phase1.sql` (the reference normalized businesses/discovery/evidence schema and additions). Run each once. They contain owner policies; real two-user RLS verification is still required.
4. Configure backend environment variables from `backend/.env.example`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and a private `DATABASE_URL` from the project’s database connection settings. Use a trusted server-only DB connection. Set `DISCOVERY_MODE=catalog` for the real researched catalogue without model or web calls. Do not put DB credentials in the frontend or chat. These settings must be exported to the backend process; uvicorn does not automatically read `.env.example` or `.env.local`.
5. From the repo root, seed the normalized catalogue after exporting backend settings: `uv run --directory backend python seed_catalog.py`. This writes 111 public researched tool records and their source claims, not fictional vendors. No model/search request is made.
6. In Authentication → URL Configuration, set Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback`. Use that hostname consistently. Enable email/password and email confirmation. For confirmation across devices, the Confirm signup template can link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. Standard PKCE `/auth/callback` is also supported. Check Supabase’s email delivery/rate limits; custom SMTP may be needed for a team demo.
7. Restart both servers. At `/auth`, create and confirm a test account, sign in, complete onboarding, and edit the saved profile. Returning users should go to their existing dashboard. Create a second account and verify neither can read the other’s profile/run. Test logout, refresh, confirmation, and database owner policies before describing live authentication as verified.

For production, replace the site URL and allowed redirects with the actual HTTPS origin, set the server-side proxy’s `DISCOVERY_BACKEND_URL` to the persistent Python service, and configure secret environment settings on the hosts. Cookies are HttpOnly and SameSite=Lax; signed-in backend requests use a verified Supabase bearer token. Do not deploy the SQLite demo store as the database for real private business profiles.

## Optional live model/web activation

Only after explicit authorisation and replacement of the previously shared key: configure `OPENROUTER_API_KEY` and a supported `OPENROUTER_MODEL` in backend environment, then set `DISCOVERY_MODE=live`, `OPENROUTER_ENABLED=true`, `EXPLICIT_LIVE_AUTHORIZED=true`. Leave `LIVE_WEB_ENABLED=false` for an initial parse-only test. Enable web only for a separately reviewed bounded live test. Demo identities can never invoke paid calls.

The backend uses the shared PostgreSQL reservation ledger with a $20 stop target, maximum five explicit model calls/run, three planned queries, five vendor domains and ten fetches. Provider-managed internal search operations are not guaranteed by these bounds. Review key-level restrictions and usage before enabling it; no live budget use has been tested here.

## Verification status

Mock/demo ownership, validation, origin restrictions, safe logging, provider payloads, failure fallbacks and spend reservations have automated tests. Real signup email, token/cookie refresh, PostgreSQL schema execution, RLS, SQL seeding and actual OpenRouter/web discovery remain unverified until these external settings are supplied. See [PHASE1_STATUS.md](PHASE1_STATUS.md).
