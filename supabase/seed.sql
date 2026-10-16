-- ============================================================================
-- supabase/seed.sql — LOCAL development seed (run by `supabase db reset`)
--
-- Creates the demo user + demo business and fills it via
-- public.reset_demo_data(). Production never runs this file: there the demo
-- account is created and reset by `npm run db:seed` (scripts/reset-demo.ts),
-- which only ever touches the business flagged is_demo.
--
-- Local-only credentials (match .env.local.example):
--   DEMO_USER_EMAIL=demo@ansai.local
--   DEMO_USER_PASSWORD=ansai-demo-local
-- ============================================================================

do $$
declare
  v_user_id     uuid := '00000000-0000-4000-a000-00000000d3e0';
  v_business_id uuid := '00000000-0000-4000-a000-00000000b1e0';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    'demo@ansai.local', extensions.crypt('ansai-demo-local', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Demo"}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'demo@ansai.local', 'email_verified', true),
    'email', now(), now(), now()
  );

  -- profiles row is created by the on_auth_user_created trigger.
  insert into public.businesses (id, user_id, name, type, city, country, is_demo)
  values (v_business_id, v_user_id, 'Taberna El Faro', 'restaurant', 'Mechelen', 'BE', true);

  perform public.reset_demo_data(v_business_id);
end;
$$;
