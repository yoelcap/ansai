-- ============================================================================
-- 0003_rls.sql — rewrite of every RLS policy
--
-- Same access model as 0001 (a user sees and changes only their own profile,
-- their own businesses, and rows hanging off those businesses), with fixes:
--   * `(select auth.uid())` instead of `auth.uid()` so Postgres evaluates it
--     once per statement, not once per row (21 advisor warnings).
--   * `to authenticated` instead of the implicit `public` role: anon requests
--     are rejected before the policy expression is even evaluated.
--   * UPDATE policies get an explicit WITH CHECK, so a row cannot be moved to
--     a business the user does not own (e.g. update reviews set business_id=…).
--   * Ownership lookups go through one SECURITY DEFINER helper, which keeps the
--     policies short and avoids re-running RLS on `businesses` inside every
--     subquery.
--   * Duplicate permissive SELECT policy on team_members removed.
-- ============================================================================

-- ─── Helper ─────────────────────────────────────────────────────────────────
-- Lives in a schema PostgREST does not expose, so it is not callable as an RPC.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.owned_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.businesses where user_id = (select auth.uid());
$$;

revoke execute on function private.owned_business_ids() from public, anon;
grant execute on function private.owned_business_ids() to authenticated;

-- ─── Drop every existing policy ─────────────────────────────────────────────

do $$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

-- RLS stays enabled on every table (re-asserted so this file is self-contained).
alter table public.profiles      enable row level security;
alter table public.businesses    enable row level security;
alter table public.tone_configs  enable row level security;
alter table public.reviews       enable row level security;
alter table public.responses     enable row level security;
alter table public.integrations  enable row level security;
alter table public.team_members  enable row level security;
alter table public.daily_metrics enable row level security;

-- ─── profiles: only your own row ────────────────────────────────────────────

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ─── businesses: only businesses you own ────────────────────────────────────

create policy businesses_select_own on public.businesses
  for select to authenticated using (user_id = (select auth.uid()));
create policy businesses_insert_own on public.businesses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy businesses_update_own on public.businesses
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy businesses_delete_own on public.businesses
  for delete to authenticated using (user_id = (select auth.uid()));

-- ─── Tables scoped by business_id ───────────────────────────────────────────

-- tone_configs
create policy tone_configs_select_own on public.tone_configs
  for select to authenticated using (business_id in (select private.owned_business_ids()));
create policy tone_configs_insert_own on public.tone_configs
  for insert to authenticated with check (business_id in (select private.owned_business_ids()));
create policy tone_configs_update_own on public.tone_configs
  for update to authenticated
  using (business_id in (select private.owned_business_ids()))
  with check (business_id in (select private.owned_business_ids()));

-- reviews
create policy reviews_select_own on public.reviews
  for select to authenticated using (business_id in (select private.owned_business_ids()));
create policy reviews_insert_own on public.reviews
  for insert to authenticated with check (business_id in (select private.owned_business_ids()));
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (business_id in (select private.owned_business_ids()))
  with check (business_id in (select private.owned_business_ids()));
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (business_id in (select private.owned_business_ids()));

-- responses (scoped through their review)
create policy responses_select_own on public.responses
  for select to authenticated using (
    review_id in (select r.id from public.reviews r
                  where r.business_id in (select private.owned_business_ids())));
create policy responses_insert_own on public.responses
  for insert to authenticated with check (
    review_id in (select r.id from public.reviews r
                  where r.business_id in (select private.owned_business_ids())));
create policy responses_update_own on public.responses
  for update to authenticated
  using (
    review_id in (select r.id from public.reviews r
                  where r.business_id in (select private.owned_business_ids())))
  with check (
    review_id in (select r.id from public.reviews r
                  where r.business_id in (select private.owned_business_ids())));

-- integrations: read-only for clients (column grants in 0002 hide tokens);
-- writes happen server-side with the service role.
create policy integrations_select_own on public.integrations
  for select to authenticated using (business_id in (select private.owned_business_ids()));

-- team_members: single policy set (the old ALL + SELECT pair overlapped).
create policy team_members_select_own on public.team_members
  for select to authenticated using (business_id in (select private.owned_business_ids()));
create policy team_members_insert_own on public.team_members
  for insert to authenticated with check (business_id in (select private.owned_business_ids()));
create policy team_members_update_own on public.team_members
  for update to authenticated
  using (business_id in (select private.owned_business_ids()))
  with check (business_id in (select private.owned_business_ids()));
create policy team_members_delete_own on public.team_members
  for delete to authenticated using (business_id in (select private.owned_business_ids()));

-- daily_metrics: read-only (written by server jobs, currently unused).
create policy daily_metrics_select_own on public.daily_metrics
  for select to authenticated using (business_id in (select private.owned_business_ids()));
