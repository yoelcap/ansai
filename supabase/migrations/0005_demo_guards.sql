-- ============================================================================
-- 0005_demo_guards.sql — protections for the shared demo account + AI quotas
-- ============================================================================

-- ─── businesses: browser roles may not touch is_demo or ownership ───────────
-- Column-level grants: a visitor of the demo account cannot flip is_demo off
-- (which would let them delete it, or take it out of the reset), and no one
-- can create a business flagged as demo from the browser.
revoke insert, update on public.businesses from anon, authenticated;
grant insert (user_id, name, type, city, country, address, phone, email, website, opening_hours)
  on public.businesses to authenticated;
grant update (name, type, city, country, address, phone, email, website, opening_hours)
  on public.businesses to authenticated;

-- The demo business cannot be deleted from the browser.
drop policy if exists businesses_delete_own on public.businesses;
create policy businesses_delete_own on public.businesses
  for delete to authenticated
  using (user_id = (select auth.uid()) and not is_demo);

-- ─── AI generation ledger + quota check ─────────────────────────────────────
-- One row per call to /api/responses/generate. Server-only: RLS on, no
-- policies, no grants to browser roles.
create table public.ai_generations (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_ai_generations_user_created on public.ai_generations (user_id, created_at desc);
create index idx_ai_generations_business on public.ai_generations (business_id);
create index idx_ai_generations_demo_created on public.ai_generations (created_at desc) where is_demo;

alter table public.ai_generations enable row level security;
revoke all on public.ai_generations from anon, authenticated;

-- Atomically checks the quotas and, if allowed, records the generation.
-- Returns 'ok' or the name of the limit that was hit. Limits passed as NULL
-- are not enforced. Whether the business is the demo one is read from the
-- database, never trusted from the caller.
create or replace function public.claim_ai_generation(
  p_user_id          uuid,
  p_business_id      uuid,
  p_demo_daily_limit integer default 20,
  p_user_minute_limit integer default null,
  p_user_daily_limit  integer default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_is_demo boolean;
begin
  select is_demo into v_is_demo from public.businesses where id = p_business_id;
  if v_is_demo is null then
    raise exception 'claim_ai_generation: unknown business %', p_business_id;
  end if;

  -- Serialise concurrent claims for the same scope so two requests cannot
  -- both pass the count check.
  if v_is_demo then
    perform pg_advisory_xact_lock(hashtext('ai_generations:demo'));
  else
    perform pg_advisory_xact_lock(hashtext('ai_generations:' || p_user_id::text));
  end if;

  if v_is_demo and p_demo_daily_limit is not null and (
    select count(*) from public.ai_generations
    where is_demo and created_at > now() - interval '24 hours'
  ) >= p_demo_daily_limit then
    return 'demo_daily_limit';
  end if;

  if p_user_minute_limit is not null and (
    select count(*) from public.ai_generations
    where user_id = p_user_id and created_at > now() - interval '1 minute'
  ) >= p_user_minute_limit then
    return 'user_minute_limit';
  end if;

  if p_user_daily_limit is not null and (
    select count(*) from public.ai_generations
    where user_id = p_user_id and created_at > now() - interval '24 hours'
  ) >= p_user_daily_limit then
    return 'user_daily_limit';
  end if;

  insert into public.ai_generations (user_id, business_id, is_demo)
  values (p_user_id, p_business_id, v_is_demo);
  return 'ok';
end;
$$;

revoke execute on function public.claim_ai_generation(uuid, uuid, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_generation(uuid, uuid, integer, integer, integer)
  to service_role;
