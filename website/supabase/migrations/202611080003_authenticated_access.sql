-- New Supabase projects may not automatically grant Data API table access.
-- Keep RLS as the row boundary and grant only operations with owner policies.
begin;
revoke all on public.businesses, public.business_software,
  public.discovery_runs, public.discovery_queries, public.discovery_candidates
  from anon, authenticated;
grant select, insert, update on public.businesses to authenticated;
grant select, insert, delete on public.business_software to authenticated;
grant select on public.discovery_runs, public.discovery_queries,
  public.discovery_candidates to authenticated;
-- Catalogue/evidence and budget access remains restricted to the backend.
revoke all on public.capabilities, public.ai_tools, public.tool_sources,
  public.tool_claims, public.tool_capabilities, public.discovery_budget
  from anon, authenticated;
commit;
