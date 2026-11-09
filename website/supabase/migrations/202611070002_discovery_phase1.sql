-- impact.ai | Discovery Module v2 | PostgreSQL / Supabase reference migration
-- Architecture reference: adapt migrations to actual Supabase project before deployment.
-- Never store an OpenRouter key, authentication token, or user customer record in these tables.
create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  profile_version text not null default 'onboarding_v1',
  industry_category text not null,
  industry_subtype text not null,
  business_description text not null check (length(trim(business_description)) between 1 and 500),
  customer_type text,
  employee_band text not null check (employee_band in ('solo','2_10','11_50','51_250','250_plus')),
  country_code text not null check (length(country_code)=2),
  region_code text,
  existing_software_status text not null check (existing_software_status in ('selected','none','unknown')),
  improvement_priorities text[] not null default '{}',
  monthly_budget_band text,
  customer_contact_channels text[],
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint priorities_max_3 check (cardinality(improvement_priorities)<=3)
);
create index if not exists idx_businesses_owner on public.businesses(owner_user_id);

create table if not exists public.business_software (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  raw_name text not null check (length(trim(raw_name))>0),
  normalized_name text,
  canonical_tool_id uuid, -- optional future FK after product identity is confirmed
  added_at timestamptz not null default now(),
  unique (business_id, raw_name)
);
create index if not exists idx_business_software_business on public.business_software(business_id);

create table if not exists public.capabilities (
  id text primary key, -- stable slug: 'ai_voice_receptionist', 'lead_capture', etc.
  category text not null,
  display_name text not null,
  description text not null default '',
  synonyms text[] not null default '{}',
  is_active boolean not null default true
);

create table if not exists public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  canonical_product_key text not null unique, -- normalized product name + vendor domain
  name text not null,
  vendor_name text,
  official_url text not null,
  official_domain text not null,
  short_description text,
  ai_classification text not null default 'unverified'
    check (ai_classification in ('ai_native','ai_enabled','non_ai_complement','unverified')),
  catalog_status text not null default 'provisional'
    check (catalog_status in ('seeded','provisional','confirmed','rejected')),
  first_discovered_at timestamptz not null default now(),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_tools_domain on public.ai_tools(official_domain);
create index if not exists idx_ai_tools_status on public.ai_tools(catalog_status);
create index if not exists idx_ai_tools_text on public.ai_tools using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'')));

create table if not exists public.tool_sources (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.ai_tools(id) on delete cascade,
  url text not null,
  page_title text,
  source_kind text not null check (source_kind in ('vendor_official','vendor_docs','third_party','marketplace')),
  retrieval_method text not null default 'web_search',
  retrieved_at timestamptz not null default now(),
  content_excerpt text,
  excerpt_hash text,
  http_status integer,
  UNIQUE (tool_id, url)
);
create index if not exists idx_tool_sources_tool on public.tool_sources(tool_id);

create table if not exists public.tool_claims (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.ai_tools(id) on delete cascade,
  source_id uuid references public.tool_sources(id) on delete set null,
  claim_type text not null check (claim_type in ('capability','ai_feature','integration','pricing','target_industry','limitations','other')),
  claim_key text not null,
  claim_value jsonb not null,
  evidence_excerpt text,
  verification_state text not null default 'unverified'
    check (verification_state in ('vendor_documented','third_party_reported','independently_tested','unverified','conflicting')),
  observed_at timestamptz not null default now(),
  stale_after timestamptz
);
create index if not exists idx_claims_tool_type on public.tool_claims(tool_id,claim_type);
create index if not exists idx_claims_source on public.tool_claims(source_id);

create table if not exists public.tool_capabilities (
  tool_id uuid not null references public.ai_tools(id) on delete cascade,
  capability_id text not null references public.capabilities(id),
  claim_id uuid references public.tool_claims(id) on delete set null,
  primary key (tool_id, capability_id)
);
create index if not exists idx_tool_capabilities_capability on public.tool_capabilities(capability_id);

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('baseline','problem_search')),
  problem_text text,
  force_web boolean not null default false,
  profile_snapshot jsonb not null,
  profile_fingerprint text not null,
  interpreted_requirements jsonb,
  status text not null default 'queued'
    check (status in ('queued','parsing','needs_clarification','catalog_search','web_search','enriching','completed','partial','failed')),
  clarification_question text,
  warnings jsonb not null default '[]'::jsonb,
  error_code text,
  search_provider text,
  model_id text,
  search_calls integer not null default 0,
  model_calls integer not null default 0,
  estimated_cost_usd numeric(10,6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_runs_business_created on public.discovery_runs(business_id,created_at desc);
create index if not exists idx_runs_status on public.discovery_runs(status);

create table if not exists public.discovery_queries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.discovery_runs(id) on delete cascade,
  query_kind text not null check (query_kind in ('capability','industry','integration','alternate')),
  query_text text not null,
  provider text not null,
  executed boolean not null default false,
  result_count integer,
  executed_at timestamptz
);
create index if not exists idx_queries_run on public.discovery_queries(run_id);

create table if not exists public.discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.discovery_runs(id) on delete cascade,
  tool_id uuid not null references public.ai_tools(id),
  matched_capabilities text[] not null default '{}',
  retrieval_channels text[] not null default '{}',
  provenance_urls text[] not null default '{}',
  discovery_status text not null default 'candidate'
    check (discovery_status in ('candidate','evidence_pending','verified_candidate','rejected')),
  first_seen_order integer,
  issue_flags text[] not null default '{}',
  unique(run_id,tool_id)
);
create index if not exists idx_candidates_run on public.discovery_candidates(run_id);

-- USER DATA: enable row-level security. The backend MUST verify JWTs and the business ownership.
alter table public.businesses enable row level security;
alter table public.business_software enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.discovery_queries enable row level security;
alter table public.discovery_candidates enable row level security;

-- Client access to owned profiles only; all discovery orchestration should use backend-controlled service access.
create policy "business owner read" on public.businesses for select to authenticated using (owner_user_id=(select auth.uid()));
create policy "business owner insert" on public.businesses for insert to authenticated with check (owner_user_id=(select auth.uid()));
create policy "business owner update" on public.businesses for update to authenticated using (owner_user_id=(select auth.uid())) with check (owner_user_id=(select auth.uid()));
create policy "business software read" on public.business_software for select to authenticated using
  (exists (select 1 from public.businesses b where b.id=business_id and b.owner_user_id=(select auth.uid())));
create policy "business software insert" on public.business_software for insert to authenticated with check
  (exists (select 1 from public.businesses b where b.id=business_id and b.owner_user_id=(select auth.uid())));
create policy "business software delete" on public.business_software for delete to authenticated using
  (exists (select 1 from public.businesses b where b.id=business_id and b.owner_user_id=(select auth.uid())));
create policy "discovery runs read" on public.discovery_runs for select to authenticated using (owner_user_id=(select auth.uid()));
create policy "discovery queries read" on public.discovery_queries for select to authenticated using
  (exists (select 1 from public.discovery_runs r where r.id=run_id and r.owner_user_id=(select auth.uid())));
create policy "discovery candidates read" on public.discovery_candidates for select to authenticated using
  (exists (select 1 from public.discovery_runs r where r.id=run_id and r.owner_user_id=(select auth.uid())));

-- Product catalog, evidence, capability taxonomy: backend service role only by default.
alter table public.capabilities enable row level security;
alter table public.ai_tools enable row level security;
alter table public.tool_sources enable row level security;
alter table public.tool_claims enable row level security;
alter table public.tool_capabilities enable row level security;
-- Intentionally no anon/authenticated read policies on product/evidence tables.
-- Expose sanitized catalog records through FastAPI endpoints and authorize server-side.

-- Note: production migrations should avoid CREATE POLICY collisions by using versioned migrations,
-- and include domain validation, audit logging, retention/deletion and a trigger for updated_at.

-- API wire snapshots supplement (rather than replace) the normalized reference fields.
alter table public.businesses add column if not exists api_payload jsonb;
alter table public.discovery_runs add column if not exists api_payload jsonb;
alter table public.businesses add constraint businesses_id_owner_unique unique (id,owner_user_id);
alter table public.discovery_runs add constraint discovery_run_business_owner_fk foreign key (business_id,owner_user_id) references public.businesses(id,owner_user_id) on delete cascade;
create table public.discovery_budget(id integer primary key check(id=1),reserved_usd numeric(12,6) not null default 0);
insert into public.discovery_budget values(1,0) on conflict do nothing;
alter table public.discovery_budget enable row level security;
revoke all on public.discovery_budget from anon,authenticated;
-- This migration is versioned; run once. Backend DATABASE_URL uses a trusted server role.
-- No browser/service-role key and no credential values belong in the migration.
alter table public.ai_tools add column if not exists api_payload jsonb;
