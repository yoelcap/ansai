-- ============================================================================
-- 0002_fixes.sql — schema defects found in docs/AUDIT.md
-- ============================================================================

-- ─── A-02: responses.model_used CHECK never rejected anything ───────────────
-- `x = ANY(ARRAY[..., NULL])` is NULL (not false) for a non-matching x, so the
-- CHECK passed for every value. Model IDs are now configurable via env vars
-- (ANTHROPIC_MODEL_*), so a fixed whitelist would break on every model bump:
-- enforce the shape instead.
alter table public.responses drop constraint responses_model_used_check;
alter table public.responses
  add constraint responses_model_used_check
  check (model_used is null or model_used ~ '^claude-[a-z0-9.-]+$');

-- ─── A-11: SECURITY DEFINER trigger function hardening ──────────────────────
-- Pin search_path so the function cannot be hijacked by objects in another
-- schema, tolerate users without email (phone / some OAuth providers) instead
-- of failing the whole signup on profiles.email NOT NULL, and stop exposing
-- the function as a callable RPC (/rest/v1/rpc/handle_new_user).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── A-10: OAuth tokens must never reach the browser ────────────────────────
-- RLS let the owner `select *` on integrations, including access/refresh
-- tokens. Clients only need the connection status; tokens are written and read
-- exclusively server-side with the service role (which bypasses these grants).
revoke all on public.integrations from anon, authenticated;
grant select (
  id, business_id, provider, status, external_account_id, external_account_name,
  token_expires_at, scopes, last_sync_at, last_error, connected_at, created_at
) on public.integrations to authenticated;

-- ─── Indexes for the real access patterns ───────────────────────────────────
-- Every app query filters reviews by business and then by status or date.
create index if not exists idx_reviews_business_status on public.reviews (business_id, status);
create index if not exists idx_reviews_business_review_date on public.reviews (business_id, review_date desc);

-- FKs flagged by the performance advisor as unindexed.
create index if not exists idx_profiles_current_business_id on public.profiles (current_business_id);
create index if not exists idx_team_members_invited_by on public.team_members (invited_by);

-- Exact duplicates of the UNIQUE constraint indexes.
drop index if exists public.idx_tone_configs_business_id;
drop index if exists public.idx_responses_review_id;
