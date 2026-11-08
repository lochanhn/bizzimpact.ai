# Connect login and saved assessments

The code is wired for Supabase, but a project has not been created or connected. Guest assessment and the 111-tool catalogue work without it. No desktop app or browser was opened by the assistant.

1. Open [Supabase](https://supabase.com/dashboard) yourself, create a project, and keep the database password private.
2. In the project’s Connect dialog, copy the **Project URL** and **publishable key**. We do not need a secret/service-role key. Copy `website/.env.example` to `website/.env.local` and fill in those two values. Leave both AI flags false.
3. In Supabase’s SQL Editor, run the contents of `website/supabase/migrations/202611070001_business_profiles.sql` once. It creates one private saved assessment per user and owner-only row-level policies.
4. In Authentication → URL Configuration, set Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback`. Use this hostname consistently. In Authentication → Providers, enable email/password and email confirmation. For confirmation links that work across devices, update the Confirm signup email template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. The code also supports the PKCE `/auth/callback` route for standard redirects.
5. Restart `npm run dev` in `website/`. Open `/auth`, create a test account, confirm the email, and sign in. Complete an assessment, click **Save answers to my workspace**, then open **My workspace**. Sign out and confirm private profile API access is denied. Sign in again and reopen your saved answers.

Supabase may limit confirmation emails on its default sender. Check delivery and Auth rate-limit settings before a group demo; configure your own SMTP if needed. Never disable confirmation just to hide a failed email test.

For deployment, set `SITE_URL` to the real HTTPS origin, update Supabase’s allowed URLs and email template, and configure the environment settings on the host. The application uses server-only Supabase clients and HttpOnly, SameSite=Lax session cookies. Cookie refresh happens in Route Handlers; private content is fetched through verified-user APIs rather than rendered from an unverified browser session. No service-role credential is used.

## What is implemented

- `/auth`: email/password sign-up and sign-in; honest unconfigured state; guest access.
- `/auth/callback` and `/auth/confirm`: server-side confirmation/session exchange, with fixed dashboard redirects.
- `/dashboard`: fetch the signed-in user’s saved assessment and reopen it for editing.
- `/api/auth/session`, `/login`, `/signup`, `/logout`: session status and account operations. Logout ends this browser’s session and clears its saved guest answers after successful sign-out.
- `/api/account/profile`: verified-user GET and PUT. User identity comes from Supabase verification, never a body parameter. Validation rejects supplied owner IDs.
- SQL migration: owner-only select/insert/update/delete policies; anonymous users have no table privileges.

Guest answers remain tab-local unless the signed-in user explicitly saves them. Saving stores the current structured answers, including any optional problem note, in that user’s private profile. Saving again replaces the saved assessment. This is not the full Phase 1 multi-business profile and historical discovery-run schema. The reference’s frozen onboarding and complete hybrid discovery remain separate work; the existing V1 questionnaire and experimental fit rubric were preserved.

## Diagnostic logging

API responses carry `X-Request-Id`. Server stdout receives structured JSON for request route, status, duration, catalogue/rules versions, result counts and account/save outcomes. It excludes bodies, problem text, emails, user IDs, passwords, cookies, tokens, raw exceptions and provider response bodies. Logs use an allowlist of fields, not generic object dumping. Auth confirmation URLs are excluded from Next.js’s built-in development request logging; browser console forwarding and Server Function argument logging are disabled.

No log files, analytics SDK or remote logging service are configured. Hosting/edge request logs may still capture URLs independently; redact auth query strings there and choose retention before deployment. Application stdout retention is controlled by the terminal/hosting service, not an implemented seven-day deletion job. The auth endpoint backstop is per-process (20 attempts/minute per action), not a distributed abuse-prevention system; Supabase’s provider controls remain necessary.

## Verification limits

Local tests can verify validation, trusted owner IDs, response codes, secret-free log formatting and disabled configuration. Real email delivery, cookie issuance/refresh, logout, cross-user database isolation and database migration execution need the connected Supabase project. Do not call these live checks passed until they are actually run with two test accounts.

Official references: [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [password-based auth](https://supabase.com/docs/guides/auth/passwords), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
