-- ============================================================================
-- CMS PERMISSIONS, ADMIN AUTHORIZATION & ATOMIC PUBLISHING VERIFICATION SUITE
-- Safe & Non-Destructive: Wrapped inside a transaction that rolls back cleanly.
-- Run in Supabase SQL Editor AFTER applying 20261121_repair_admin_auth_and_cms_permissions.sql.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_admin_uid UUID;
  v_fake_uid  UUID := '00000000-0000-4000-8000-000000009999';
  v_is_admin  BOOLEAN;
  v_res       JSONB;
  v_health    JSONB;
  v_err_state TEXT;
BEGIN
  -- Grab an existing registered administrator UUID from public.admin_users
  SELECT user_id INTO v_admin_uid FROM public.admin_users LIMIT 1;
  IF v_admin_uid IS NULL THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: public.admin_users is empty. Register at least one admin user UUID before running verification.';
  END IF;

  -- ==========================================================================
  -- TEST 1: ANON ROLE CANNOT ACCESS admin_users OR about_drafts OR WRITE DATA
  -- ==========================================================================
  PERFORM set_config('request.jwt.claims', '{}', true);
  SET LOCAL ROLE anon;

  BEGIN
    PERFORM 1 FROM public.admin_users LIMIT 1;
    RAISE EXCEPTION 'FAIL Test 1a: anon role was able to read public.admin_users!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 1a: anon cannot read public.admin_users (42501)';
  END;

  BEGIN
    PERFORM 1 FROM public.about_drafts LIMIT 1;
    RAISE EXCEPTION 'FAIL Test 1b: anon role was able to query public.about_drafts!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 1b: anon cannot read public.about_drafts (42501)';
  END;

  BEGIN
    INSERT INTO public.about_interests (id, title) VALUES (gen_random_uuid(), 'Unauthorized Test');
    RAISE EXCEPTION 'FAIL Test 1c: anon role inserted into public.about_interests!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 1c: anon cannot write to public.about_interests';
  END;

  RESET ROLE;

  -- ==========================================================================
  -- TEST 2: NON-ADMIN AUTHENTICATED USER IS BLOCKED ACROSS ALL ADMIN TABLES
  -- ==========================================================================
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_fake_uid::text, 'role', 'authenticated', 'aud', 'authenticated')::text,
    true
  );
  SET LOCAL ROLE authenticated;

  SELECT public.check_is_admin() INTO v_is_admin;
  IF v_is_admin IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FAIL Test 2a: check_is_admin() returned % for non-admin user!', v_is_admin;
  END IF;
  RAISE NOTICE 'PASS Test 2a: check_is_admin() returned false for non-admin authenticated user';

  BEGIN
    PERFORM 1 FROM public.admin_users LIMIT 1;
    RAISE EXCEPTION 'FAIL Test 2b: authenticated user could directly read public.admin_users!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 2b: direct authenticated read of public.admin_users is blocked';
  END;

  BEGIN
    INSERT INTO public.about_interests (id, title) VALUES (gen_random_uuid(), 'Hacker Tag');
    RAISE EXCEPTION 'FAIL Test 2c: non-admin inserted into about_interests!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 2c: non-admin insert into about_interests rejected by RLS';
  END;

  BEGIN
    INSERT INTO public.project_media (id, project_id, media_type, media_url)
    VALUES (gen_random_uuid(), gen_random_uuid(), 'image', 'https://example.com/a.jpg');
    RAISE EXCEPTION 'FAIL Test 2d: non-admin inserted into project_media!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 2d: non-admin insert into project_media rejected by RLS';
  END;

  BEGIN
    SELECT public.publish_about_cms('{"header":{"heading":"X"},"profileCard":{"fullName":"X","introduction":"Y"}}'::jsonb) INTO v_res;
    RAISE EXCEPTION 'FAIL Test 2e: non-admin executed publish_about_cms()!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 2e: publish_about_cms() rejected non-admin with 42501';
  END;

  RESET ROLE;

  -- ==========================================================================
  -- TEST 3: REGISTERED ADMIN PASSES CHECKS, PUBLISHES ATOMICALLY & AUDITS HEALTH
  -- ==========================================================================
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin_uid::text, 'role', 'authenticated', 'aud', 'authenticated')::text,
    true
  );
  SET LOCAL ROLE authenticated;

  SELECT public.check_is_admin() INTO v_is_admin;
  IF v_is_admin IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL Test 3a: check_is_admin() returned % for registered admin %', v_is_admin, v_admin_uid;
  END IF;
  RAISE NOTICE 'PASS Test 3a: check_is_admin() verified registered admin (%) cleanly', v_admin_uid;

  -- Direct client read on admin_users should STILL be blocked even for admins (only SECURITY DEFINER RPC checks it)
  BEGIN
    PERFORM 1 FROM public.admin_users LIMIT 1;
    RAISE EXCEPTION 'FAIL Test 3b: direct client read on public.admin_users succeeded!';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS Test 3b: public.admin_users remains locked from direct client queries even during admin session';
  END;

  -- Atomic About Publish (header + portrait + card + interest + highlight + draft sync)
  SELECT public.publish_about_cms(jsonb_build_object(
    'header', jsonb_build_object('sectionLabel', 'VERIFICATION', 'heading', 'ABOUT', 'headingAccent', 'ME', 'subtitle', 'Testing', 'showDivider', false),
    'portrait', jsonb_build_object('imageUrl', '/images/afrid-about.jpg', 'altText', 'Test', 'focalPoint', '50% 15%', 'fit', 'cover', 'scale', 1),
    'educationBadge', jsonb_build_object('institution', 'SLIIT', 'program', 'CS', 'graduationYear', 'Class of 2030', 'iconName', 'GraduationCap', 'supportingText', ''),
    'profileCard', jsonb_build_object('fullName', 'Afrid', 'nameAccent', 'Ahmed', 'academicRole', 'Undergraduate', 'degreeProgram', 'BSc CS', 'institution', 'SLIIT', 'introduction', 'Atomic test intro', 'signatureImageUrl', ''),
    'interests', jsonb_build_array(jsonb_build_object('title', 'Systems Verification', 'iconName', 'ShieldCheck', 'description', 'Test interest', 'isVisible', true)),
    'highlights', jsonb_build_array(jsonb_build_object('title', 'Atomic Sync', 'supportingText', 'Verified', 'iconName', 'Terminal', 'description', 'Test highlight', 'isVisible', true)),
    'visualSettings', '{}'::jsonb
  )) INTO v_res;

  IF COALESCE((v_res->>'success')::boolean, false) IS NOT true THEN
    RAISE EXCEPTION 'FAIL Test 3c: publish_about_cms returned unexpected payload: %', v_res;
  END IF;
  RAISE NOTICE 'PASS Test 3c: publish_about_cms executed atomic multi-table publish (%)', v_res->>'interests_count';

  -- Atomic Failure Rollback Test (empty interest title rejects whole publish without corrupting previous update)
  BEGIN
    PERFORM public.publish_about_cms(jsonb_build_object(
      'header', jsonb_build_object('heading', 'SHOULD ROLLBACK'),
      'profileCard', jsonb_build_object('fullName', 'Afrid', 'introduction', 'Should rollback'),
      'interests', jsonb_build_array(jsonb_build_object('title', '   '))
    ));
    RAISE EXCEPTION 'FAIL Test 3d: publish_about_cms accepted empty interest title!';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err_state = RETURNED_SQLSTATE;
    IF v_err_state <> '22023' THEN
      RAISE EXCEPTION 'FAIL Test 3d: expected SQLSTATE 22023, got % (%)', v_err_state, SQLERRM;
    END IF;
    RAISE NOTICE 'PASS Test 3d: Invalid interest failed cleanly (22023) without modifying prior About state';
  END;

  IF (SELECT heading FROM public.about_content WHERE id = 'global') = 'SHOULD ROLLBACK' THEN
    RAISE EXCEPTION 'FAIL Test 3e: Partial write leaked into about_content despite subtransaction failure!';
  END IF;
  RAISE NOTICE 'PASS Test 3e: Verified prior about_content heading stayed completely intact';

  -- Health Audit RPC check
  SELECT public.cms_health_check() INTO v_health;
  IF COALESCE((v_health->>'authorized')::boolean, false) IS NOT true
     OR COALESCE((v_health->>'admin_users_locked')::boolean, false) IS NOT true THEN
    RAISE EXCEPTION 'FAIL Test 3f: cms_health_check failed assertions: %', v_health;
  END IF;
  RAISE NOTICE 'PASS Test 3f: cms_health_check() reported authorized=true & admin_users_locked=true';

  RESET ROLE;
END $$;

ROLLBACK;
