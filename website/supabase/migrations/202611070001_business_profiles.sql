-- Run in your own Supabase SQL Editor. This creates no demo users.
begin;
create table if not exists public.business_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 16000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.business_profiles enable row level security;
alter table public.business_profiles force row level security;
revoke all on public.business_profiles from anon;
revoke all on public.business_profiles from authenticated;
grant select,insert,update,delete on public.business_profiles to authenticated;
create policy "Read own assessment" on public.business_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own assessment" on public.business_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own assessment" on public.business_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own assessment" on public.business_profiles for delete to authenticated using ((select auth.uid()) = user_id);
create or replace function public.touch_business_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger business_profiles_updated before update on public.business_profiles for each row execute function public.touch_business_profile();
commit;
