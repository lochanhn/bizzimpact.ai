-- Server-only, versioned implementation guidance grounded in reviewed catalogue records.
create table if not exists public.tool_implementation_guides (
  tool_id uuid primary key references public.ai_tools(id) on delete cascade,
  guide_version text not null,
  installation_type text not null check (installation_type in ('web_service','desktop_app','mobile_app','browser_extension','api_or_developer','mixed','unknown')),
  verified_content jsonb not null check (jsonb_typeof(verified_content)='object'),
  source_urls text[] not null default '{}',
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.tool_implementation_guides enable row level security;
revoke all on public.tool_implementation_guides from anon, authenticated;
