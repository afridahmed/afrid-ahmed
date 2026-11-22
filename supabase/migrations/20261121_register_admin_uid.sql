-- ============================================================================
-- SAFE ADMINISTRATOR BOOTSTRAP MIGRATION (SUPABASE SQL EDITOR)
-- Target Account Email: afridaskar@gmail.com
--
-- IMPORTANT SECURITY GUARANTEES:
--   - Does NOT invent an Auth UID (replace the placeholder below with your exact
--     User UID from Supabase Dashboard -> Authentication -> Users).
--   - Does NOT disable RLS or expose public.admin_users to client roles.
--   - Does NOT grant admin access to all authenticated users.
--   - Does NOT alter the existing schema of public.admin_users or drop data.
--   - Preserves all existing public.admin_users rows and all CMS content.
--
-- PREREQUISITE:
--   Run `supabase/migrations/20261121_repair_admin_auth_and_cms_permissions.sql`
--   first (or together before this block) so `private.is_admin()` and
--   `public.check_is_admin()` exist and table policies are repaired.
--
-- OPTIONAL READ-ONLY LOOKUP (run alone first if you want to check your UID):
--   SELECT id AS supabase_auth_uid, email, email_confirmed_at
--   FROM auth.users
--   WHERE lower(email) = lower('afridaskar@gmail.com');
-- ============================================================================

DO $$
DECLARE
  -- Replace this placeholder with your real UUID from:
  -- Supabase Dashboard -> Authentication -> Users -> afridaskar@gmail.com -> User UID
  v_raw_uid TEXT := 'PASTE-YOUR-SUPABASE-AUTH-UID-HERE';
  v_expected_email TEXT := 'afridaskar@gmail.com';
  v_admin_uid UUID;
  v_user_email TEXT;
  v_confirmed_at TIMESTAMPTZ;
BEGIN
  -- 1. Validate that the placeholder was replaced with a real UUID
  IF btrim(v_raw_uid) = '' OR btrim(v_raw_uid) = 'PASTE-YOUR-SUPABASE-AUTH-UID-HERE' THEN
    RAISE EXCEPTION
      'Replace PASTE-YOUR-SUPABASE-AUTH-UID-HERE with the exact User UID from Supabase Authentication -> Users for %.',
      v_expected_email;
  END IF;

  IF NOT (btrim(v_raw_uid) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
    RAISE EXCEPTION 'Invalid UUID format provided: %', v_raw_uid;
  END IF;

  v_admin_uid := btrim(v_raw_uid)::uuid;

  -- 2. Verify this UUID exists in auth.users and belongs to afridaskar@gmail.com
  SELECT u.email, u.email_confirmed_at
  INTO v_user_email, v_confirmed_at
  FROM auth.users u
  WHERE u.id = v_admin_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No Supabase Auth user found with UID % in auth.users.', v_admin_uid;
  END IF;

  IF lower(COALESCE(v_user_email, '')) <> lower(v_expected_email) THEN
    RAISE EXCEPTION
      'UID % belongs to email %, expected %.',
      v_admin_uid, COALESCE(v_user_email, '<null>'), v_expected_email;
  END IF;

  IF v_confirmed_at IS NULL THEN
    RAISE EXCEPTION
      'Auth user % (%) has not confirmed their email address yet.',
      v_admin_uid, v_user_email;
  END IF;

  -- 3. Ensure public.admin_users exists with the expected schema without modifying existing rows
  IF to_regclass('public.admin_users') IS NULL THEN
    CREATE TABLE public.admin_users (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;

  -- 4. Maintain strict table lockdown
  ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
  REVOKE ALL ON TABLE public.admin_users FROM anon;
  REVOKE ALL ON TABLE public.admin_users FROM authenticated;

  -- 5. Idempotently register the verified administrator UID (preserves existing admins)
  INSERT INTO public.admin_users (user_id)
  VALUES (v_admin_uid)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Verified and registered admin UID % (%) in public.admin_users.', v_admin_uid, v_user_email;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
