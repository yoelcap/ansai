-- ============================================================================
-- 0006_security.sql — security audit fixes (docs/SECURITY.md)
--
-- S-01  The shared demo account is read-only except for reviews and
--       responses. A visitor could rename the business, change the tone
--       signature or the profile name and the next visitor (a recruiter)
--       would see it until the weekly reset. Enforced in RLS, not just the UI.
-- S-02  profiles: browser roles may only write the columns the UI edits
--       (not `onboarded`, `email`, `current_business_id`…).
-- ============================================================================

-- ─── Helpers (private schema: not exposed as RPC) ───────────────────────────

-- True when the caller is the owner of the demo business.
create or replace function private.is_demo_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses
    where user_id = (select auth.uid()) and is_demo
  );
$$;

-- Businesses the caller owns and may modify (everything except the demo).
create or replace function private.writable_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.businesses
  where user_id = (select auth.uid()) and not is_demo;
$$;

revoke execute on function private.is_demo_user() from public, anon;
revoke execute on function private.writable_business_ids() from public, anon;
grant execute on function private.is_demo_user() to authenticated;
grant execute on function private.writable_business_ids() to authenticated;

-- ─── S-01: profiles ─────────────────────────────────────────────────────────

drop policy profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()) and not (select private.is_demo_user()));

drop policy profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and not (select private.is_demo_user()))
  with check (id = (select auth.uid()) and not (select private.is_demo_user()));

-- ─── S-01: businesses ───────────────────────────────────────────────────────
-- (Delete already excludes the demo business since 0005.)

drop policy businesses_insert_own on public.businesses;
create policy businesses_insert_own on public.businesses
  for insert to authenticated
  with check (user_id = (select auth.uid()) and not (select private.is_demo_user()));

drop policy businesses_update_own on public.businesses;
create policy businesses_update_own on public.businesses
  for update to authenticated
  using (user_id = (select auth.uid()) and not is_demo)
  with check (user_id = (select auth.uid()) and not is_demo);

-- ─── S-01: tone_configs and team_members ────────────────────────────────────

drop policy tone_configs_insert_own on public.tone_configs;
create policy tone_configs_insert_own on public.tone_configs
  for insert to authenticated
  with check (business_id in (select private.writable_business_ids()));

drop policy tone_configs_update_own on public.tone_configs;
create policy tone_configs_update_own on public.tone_configs
  for update to authenticated
  using (business_id in (select private.writable_business_ids()))
  with check (business_id in (select private.writable_business_ids()));

drop policy team_members_insert_own on public.team_members;
create policy team_members_insert_own on public.team_members
  for insert to authenticated
  with check (business_id in (select private.writable_business_ids()));

drop policy team_members_update_own on public.team_members;
create policy team_members_update_own on public.team_members
  for update to authenticated
  using (business_id in (select private.writable_business_ids()))
  with check (business_id in (select private.writable_business_ids()));

drop policy team_members_delete_own on public.team_members;
create policy team_members_delete_own on public.team_members
  for delete to authenticated
  using (business_id in (select private.writable_business_ids()));

-- ─── S-02: profiles column grants ───────────────────────────────────────────
-- `onboarded` is set by /api/complete-onboarding with the service role;
-- `email` mirrors auth.users and is written by the signup trigger.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, email, full_name) on public.profiles to authenticated;
grant update (full_name, avatar_url, interface_language, onboarding_step) on public.profiles to authenticated;
