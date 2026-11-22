-- ============================================================================
-- CMS SECURITY, ADMIN AUTHORIZATION & ATOMIC PUBLISHING REPAIR MIGRATION
-- Version: 2026-11-21
-- Idempotent & Non-Destructive:
--   - Preserves all existing tables, rows, and public.admin_users records.
--   - Repairs `permission denied for table admin_users` caused by inline
--     invoker subqueries against locked-down `public.admin_users`.
--   - Establishes centralized `private.is_admin()` (SECURITY DEFINER, empty
--     search_path, schema-qualified) + `public.check_is_admin()` RPC.
--   - Audits minimal PostgreSQL GRANTs & strict RLS across ALL CMS tables.
--   - Adds atomic transactional RPCs `public.publish_about_cms(JSONB)` and
--     `public.unpublish_about_cms()` so partial publishing cannot occur.
--   - Adds diagnostic RPC `public.cms_health_check()` for the Admin Console.
-- ============================================================================

-- ============================================================================
-- 1. CENTRALIZED SECURITY-DEFINER ADMIN VERIFICATION
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS private;

-- Ensure private schema is never broadly browsable; authenticated can execute
-- the explicitly granted helper needed for RLS policy evaluation.
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Ensure public.admin_users exists (no-op if already created) and remains strictly locked
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Remove any broad client access to admin_users (no client role reads or mutates it directly)
REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_users FROM anon;
REVOKE ALL ON TABLE public.admin_users FROM authenticated;

-- Drop any legacy client-accessible policies on admin_users if they exist
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
  END LOOP;
END $$;

-- Centralized admin check evaluated with owner privileges inside `private` schema.
-- SET search_path = '' prevents search-path hijacking; every identifier is schema-qualified.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  END;
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Safe client-callable RPC for Admin UI session verification (returns boolean only; never leaks admin_users rows)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_admin();
$$;

REVOKE ALL ON FUNCTION public.check_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;

-- ============================================================================
-- 2. ABOUT SECTION SCHEMA SAFEGUARDS (ENSURE ALL COLUMNS & TABLES EXIST)
-- ============================================================================
ALTER TABLE IF EXISTS public.about_content
  ADD COLUMN IF NOT EXISTS section_label TEXT DEFAULT 'THE PERSON BEHIND THE CODE',
  ADD COLUMN IF NOT EXISTS heading_accent TEXT DEFAULT 'ME',
  ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT 'Curious by default. Building by choice.',
  ADD COLUMN IF NOT EXISTS show_section_divider BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portrait_alt TEXT DEFAULT 'Afrid Ahmed',
  ADD COLUMN IF NOT EXISTS portrait_focal_point TEXT DEFAULT '50% 15%',
  ADD COLUMN IF NOT EXISTS portrait_fit TEXT DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS portrait_scale NUMERIC(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS edu_institution TEXT DEFAULT 'SLIIT',
  ADD COLUMN IF NOT EXISTS edu_program TEXT DEFAULT 'CS',
  ADD COLUMN IF NOT EXISTS edu_graduation_year TEXT DEFAULT 'Class of 2030',
  ADD COLUMN IF NOT EXISTS edu_icon TEXT DEFAULT 'GraduationCap',
  ADD COLUMN IF NOT EXISTS edu_supporting_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Afrid',
  ADD COLUMN IF NOT EXISTS name_accent TEXT DEFAULT 'Ahmed',
  ADD COLUMN IF NOT EXISTS academic_role TEXT DEFAULT 'SLIIT Undergraduate',
  ADD COLUMN IF NOT EXISTS degree_program TEXT DEFAULT 'BSc (Hons) in Computer Science',
  ADD COLUMN IF NOT EXISTS institution TEXT DEFAULT 'SLIIT',
  ADD COLUMN IF NOT EXISTS intro_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS signature_image_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS visual_settings JSONB NOT NULL DEFAULT '{
    "showPortrait": true,
    "showEducationBadge": true,
    "showSignature": true,
    "showInterestTags": true,
    "showHighlights": true,
    "showSectionDivider": false,
    "showProfileCard": true,
    "showCosmicDecor": true,
    "portraitScale": 1,
    "portraitFit": "cover",
    "portraitPosition": "50% 15%",
    "cardSpacing": "balanced",
    "cardRadius": "xl",
    "glowIntensity": "medium"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.about_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  about_id TEXT NOT NULL DEFAULT 'global' REFERENCES public.about_content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'BrainCircuit',
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.about_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  about_id TEXT NOT NULL DEFAULT 'global' REFERENCES public.about_content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  supporting_text TEXT DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Terminal',
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.about_drafts (
  id TEXT PRIMARY KEY DEFAULT 'global',
  draft_payload JSONB NOT NULL,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. AUDIT & REPAIR GRANTS + RLS ACROSS ALL CMS TABLES
-- ============================================================================

-- 3A. About Content, Interests, Highlights, Drafts
REVOKE ALL ON TABLE public.about_content FROM PUBLIC;
GRANT SELECT ON TABLE public.about_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_content TO authenticated;

REVOKE ALL ON TABLE public.about_interests FROM PUBLIC;
GRANT SELECT ON TABLE public.about_interests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_interests TO authenticated;

REVOKE ALL ON TABLE public.about_highlights FROM PUBLIC;
GRANT SELECT ON TABLE public.about_highlights TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_highlights TO authenticated;

REVOKE ALL ON TABLE public.about_drafts FROM PUBLIC;
REVOKE ALL ON TABLE public.about_drafts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.about_drafts TO authenticated;

ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published about_content" ON public.about_content;
DROP POLICY IF EXISTS "Admins can manage about_content" ON public.about_content;

CREATE POLICY "Public can view published about_content"
  ON public.about_content
  FOR SELECT
  TO anon, authenticated
  USING (COALESCE(is_published, true) = true);

CREATE POLICY "Admins can manage about_content"
  ON public.about_content
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Public can view published about_interests" ON public.about_interests;
DROP POLICY IF EXISTS "Admins can manage about_interests" ON public.about_interests;

CREATE POLICY "Public can view published about_interests"
  ON public.about_interests
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.about_content ac
      WHERE ac.id = about_interests.about_id
        AND COALESCE(ac.is_published, true) = true
    )
  );

CREATE POLICY "Admins can manage about_interests"
  ON public.about_interests
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Public can view published about_highlights" ON public.about_highlights;
DROP POLICY IF EXISTS "Admins can manage about_highlights" ON public.about_highlights;

CREATE POLICY "Public can view published about_highlights"
  ON public.about_highlights
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.about_content ac
      WHERE ac.id = about_highlights.about_id
        AND COALESCE(ac.is_published, true) = true
    )
  );

CREATE POLICY "Admins can manage about_highlights"
  ON public.about_highlights
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins can manage about_drafts" ON public.about_drafts;

CREATE POLICY "Admins can manage about_drafts"
  ON public.about_drafts
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- 3B. Audit & standardize ALL other CMS tables (Hero, Projects, Project Media,
--     Journey, Creator Videos, Site Settings, Media Library) using conditional
--     guards so existing schemas remain intact and any weak policies are repaired.
DO $$
DECLARE
  tbl TEXT;
  cms_tables TEXT[] := ARRAY[
    'hero_content',
    'projects',
    'project_media',
    'journey_milestones',
    'creator_videos',
    'site_settings',
    'media'
  ];
BEGIN
  FOREACH tbl IN ARRAY cms_tables LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', tbl);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', tbl);
      EXECUTE format('GRANT INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', tbl);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- Repair public.hero_content policies
DO $$
BEGIN
  IF to_regclass('public.hero_content') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public can view hero_content" ON public.hero_content;
    DROP POLICY IF EXISTS "Admins can manage hero_content" ON public.hero_content;
    CREATE POLICY "Public can view hero_content"
      ON public.hero_content FOR SELECT TO anon, authenticated
      USING (true);
    CREATE POLICY "Admins can manage hero_content"
      ON public.hero_content FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair public.site_settings policies
DO $$
BEGIN
  IF to_regclass('public.site_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public can view site_settings" ON public.site_settings;
    DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
    CREATE POLICY "Public can view site_settings"
      ON public.site_settings FOR SELECT TO anon, authenticated
      USING (true);
    CREATE POLICY "Admins can manage site_settings"
      ON public.site_settings FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair public.projects policies
DO $$
BEGIN
  IF to_regclass('public.projects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
    DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
    CREATE POLICY "Public can view published projects"
      ON public.projects FOR SELECT TO anon, authenticated
      USING (is_published = true);
    CREATE POLICY "Admins can manage projects"
      ON public.projects FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair public.project_media policies (FIXES overly permissive `auth.role() = 'authenticated'` flaw!)
DO $$
BEGIN
  IF to_regclass('public.project_media') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public users can view published project media" ON public.project_media;
    DROP POLICY IF EXISTS "Admins have full access to project_media" ON public.project_media;
    DROP POLICY IF EXISTS "Admins can manage project_media" ON public.project_media;
    CREATE POLICY "Public users can view published project media"
      ON public.project_media FOR SELECT TO anon, authenticated
      USING (
        is_published = true
        AND EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_media.project_id
            AND p.is_published = true
        )
      );
    CREATE POLICY "Admins can manage project_media"
      ON public.project_media FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair public.journey_milestones policies
DO $$
BEGIN
  IF to_regclass('public.journey_milestones') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public can view published journey_milestones" ON public.journey_milestones;
    DROP POLICY IF EXISTS "Admins can manage journey_milestones" ON public.journey_milestones;
    CREATE POLICY "Public can view published journey_milestones"
      ON public.journey_milestones FOR SELECT TO anon, authenticated
      USING (is_published = true);
    CREATE POLICY "Admins can manage journey_milestones"
      ON public.journey_milestones FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair public.creator_videos policies
DO $$
BEGIN
  IF to_regclass('public.creator_videos') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public can view published creator_videos" ON public.creator_videos;
    DROP POLICY IF EXISTS "Admins can manage creator_videos" ON public.creator_videos;
    CREATE POLICY "Public can view published creator_videos"
      ON public.creator_videos FOR SELECT TO anon, authenticated
      USING (is_published = true);
    CREATE POLICY "Admins can manage creator_videos"
      ON public.creator_videos FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair public.media policies
DO $$
BEGIN
  IF to_regclass('public.media') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public can view media" ON public.media;
    DROP POLICY IF EXISTS "Admins can manage media" ON public.media;
    CREATE POLICY "Public can view media"
      ON public.media FOR SELECT TO anon, authenticated
      USING (true);
    CREATE POLICY "Admins can manage media"
      ON public.media FOR ALL TO authenticated
      USING ((SELECT private.is_admin()))
      WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

-- Repair storage.objects policies for portfolio-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read portfolio-media" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage portfolio-media" ON storage.objects;

CREATE POLICY "Public read portfolio-media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio-media');

CREATE POLICY "Admins manage portfolio-media"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'portfolio-media'
    AND (SELECT private.is_admin())
  )
  WITH CHECK (
    bucket_id = 'portfolio-media'
    AND (SELECT private.is_admin())
  );

-- ============================================================================
-- 4. HARDEN PUBLIC BUNDLE RPC (EMPTY search_path + SCHEMA QUALIFICATION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_public_about_bundle()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_about public.about_content%ROWTYPE;
  v_interests JSONB;
  v_highlights JSONB;
BEGIN
  SELECT * INTO v_about
  FROM public.about_content
  WHERE id = 'global'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'seeded', false,
      'is_published', true,
      'about', null,
      'interests', '[]'::jsonb,
      'highlights', '[]'::jsonb
    );
  END IF;

  IF COALESCE(v_about.is_published, true) = false THEN
    RETURN jsonb_build_object(
      'seeded', true,
      'is_published', false,
      'about', null,
      'interests', '[]'::jsonb,
      'highlights', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'title', i.title,
        'icon_name', i.icon_name,
        'description', COALESCE(i.description, ''),
        'display_order', i.display_order,
        'is_visible', i.is_visible
      ) ORDER BY i.display_order ASC, i.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_interests
  FROM public.about_interests i
  WHERE i.about_id = 'global'
    AND i.is_published = true
    AND i.is_visible = true;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', h.id,
        'title', h.title,
        'supporting_text', COALESCE(h.supporting_text, ''),
        'icon_name', h.icon_name,
        'description', COALESCE(h.description, ''),
        'display_order', h.display_order,
        'is_visible', h.is_visible
      ) ORDER BY h.display_order ASC, h.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_highlights
  FROM public.about_highlights h
  WHERE h.about_id = 'global'
    AND h.is_published = true
    AND h.is_visible = true;

  RETURN jsonb_build_object(
    'seeded', true,
    'is_published', true,
    'about', to_jsonb(v_about),
    'interests', v_interests,
    'highlights', v_highlights
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_about_bundle() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_about_bundle() TO anon, authenticated;

-- ============================================================================
-- 5. ATOMIC TRANSACTIONAL ABOUT PUBLISHING & UNPUBLISHING RPCS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.publish_about_cms(p_draft JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_now TIMESTAMPTZ := now();
  v_header JSONB;
  v_portrait JSONB;
  v_badge JSONB;
  v_card JSONB;
  v_visual JSONB;
  v_legacy JSONB;
  v_heading TEXT;
  v_full_name TEXT;
  v_intro TEXT;
  v_bio_arr JSONB;
  v_portrait_url TEXT;
  v_sig_url TEXT;
  v_fit TEXT;
  v_scale NUMERIC(3,2);
  v_interest JSONB;
  v_highlight JSONB;
  v_item_id UUID;
  v_raw_id TEXT;
  v_title TEXT;
  v_order INTEGER := 0;
  v_keep_interest_ids UUID[] := ARRAY[]::UUID[];
  v_keep_highlight_ids UUID[] := ARRAY[]::UUID[];
  v_synced_interests JSONB := '[]'::jsonb;
  v_synced_highlights JSONB := '[]'::jsonb;
  v_synced_draft JSONB;
BEGIN
  -- 1. Enforce strict admin authentication & authorization
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Session expired or not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: user % is not an authorized administrator', v_uid USING ERRCODE = '42501';
  END IF;

  IF p_draft IS NULL OR jsonb_typeof(p_draft) <> 'object' THEN
    RAISE EXCEPTION 'Invalid draft payload provided' USING ERRCODE = '22023';
  END IF;

  v_header   := COALESCE(p_draft->'header', '{}'::jsonb);
  v_portrait := COALESCE(p_draft->'portrait', '{}'::jsonb);
  v_badge    := COALESCE(p_draft->'educationBadge', '{}'::jsonb);
  v_card     := COALESCE(p_draft->'profileCard', '{}'::jsonb);
  v_visual   := COALESCE(p_draft->'visualSettings', '{}'::jsonb);
  v_legacy   := COALESCE(p_draft->'legacyMeta', '{}'::jsonb);

  -- 2. Required field validation
  v_heading   := btrim(COALESCE(v_header->>'heading', ''));
  v_full_name := btrim(COALESCE(v_card->>'fullName', ''));
  v_intro     := btrim(COALESCE(v_card->>'introduction', ''));

  IF v_heading = '' THEN
    RAISE EXCEPTION 'Main Heading cannot be empty' USING ERRCODE = '22023';
  END IF;
  IF v_full_name = '' THEN
    RAISE EXCEPTION 'Profile Full Name cannot be empty' USING ERRCODE = '22023';
  END IF;
  IF v_intro = '' THEN
    RAISE EXCEPTION 'Profile Introduction cannot be empty' USING ERRCODE = '22023';
  END IF;

  -- 3. URL protocol validation (block dangerous schemes & ephemeral blob/data URLs)
  v_portrait_url := btrim(COALESCE(v_portrait->>'imageUrl', ''));
  IF v_portrait_url <> '' THEN
    IF lower(v_portrait_url) ~ '^(javascript|vbscript|data|blob):' THEN
      RAISE EXCEPTION 'Invalid portrait image URL scheme' USING ERRCODE = '22023';
    END IF;
    IF NOT (v_portrait_url ~ '^(/|https?://)') THEN
      RAISE EXCEPTION 'Portrait URL must be an HTTPS/HTTP URL or relative asset path' USING ERRCODE = '22023';
    END IF;
  END IF;

  v_sig_url := btrim(COALESCE(v_card->>'signatureImageUrl', ''));
  IF v_sig_url <> '' THEN
    IF lower(v_sig_url) ~ '^(javascript|vbscript|data|blob):' THEN
      RAISE EXCEPTION 'Invalid signature image URL scheme' USING ERRCODE = '22023';
    END IF;
    IF NOT (v_sig_url ~ '^(/|https?://)') THEN
      RAISE EXCEPTION 'Signature URL must be an HTTPS/HTTP URL or relative asset path' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 4. Bounded visual controls
  v_fit := CASE WHEN v_portrait->>'fit' = 'contain' THEN 'contain' ELSE 'cover' END;
  v_scale := LEAST(1.15, GREATEST(0.85, COALESCE((v_portrait->>'scale')::numeric, 1.00)))::numeric(3,2);

  -- Build synchronized legacy biography array cleanly
  v_bio_arr := COALESCE(v_legacy->'biographyParagraphs', '[]'::jsonb);
  IF jsonb_typeof(v_bio_arr) <> 'array' OR jsonb_array_length(v_bio_arr) = 0 THEN
    v_bio_arr := jsonb_build_array(v_intro);
  ELSE
    v_bio_arr := jsonb_set(v_bio_arr, '{0}', to_jsonb(v_intro), true);
  END IF;

  -- 5. Upsert about_content (atomic part 1)
  INSERT INTO public.about_content (
    id,
    heading,
    heading_accent,
    section_label,
    subtitle,
    show_section_divider,
    badge,
    statement,
    bio,
    quote,
    graduation_tag,
    photo_caption_role,
    about_image_url,
    portrait_alt,
    portrait_focal_point,
    portrait_fit,
    portrait_scale,
    edu_institution,
    edu_program,
    edu_graduation_year,
    edu_icon,
    edu_supporting_text,
    full_name,
    name_accent,
    academic_role,
    degree_program,
    institution,
    intro_text,
    signature_image_url,
    visual_settings,
    is_published,
    published_at,
    updated_at
  ) VALUES (
    'global',
    v_heading,
    btrim(COALESCE(v_header->>'headingAccent', '')),
    btrim(COALESCE(v_header->>'sectionLabel', '')),
    btrim(COALESCE(v_header->>'subtitle', '')),
    COALESCE((v_header->>'showDivider')::boolean, false),
    COALESCE(NULLIF(btrim(COALESCE(v_header->>'sectionLabel', '')), ''), 'THE PERSON BEHIND THE CODE'),
    COALESCE(NULLIF(btrim(COALESCE(v_header->>'subtitle', '')), ''), 'Curious by default. Building by choice.'),
    v_bio_arr::text,
    COALESCE(NULLIF(btrim(COALESCE(v_legacy->>'quote', '')), ''), 'Learning through building, exploring through systems.'),
    COALESCE(NULLIF(btrim(COALESCE(v_badge->>'graduationYear', '')), ''), 'Class of 2030'),
    COALESCE(NULLIF(btrim(COALESCE(v_card->>'academicRole', '')), ''), 'SLIIT Undergraduate'),
    v_portrait_url,
    COALESCE(NULLIF(btrim(COALESCE(v_portrait->>'altText', '')), ''), 'Afrid Ahmed'),
    COALESCE(NULLIF(btrim(COALESCE(v_portrait->>'focalPoint', '')), ''), '50% 15%'),
    v_fit,
    v_scale,
    btrim(COALESCE(v_badge->>'institution', '')),
    btrim(COALESCE(v_badge->>'program', '')),
    btrim(COALESCE(v_badge->>'graduationYear', '')),
    COALESCE(NULLIF(btrim(COALESCE(v_badge->>'iconName', '')), ''), 'GraduationCap'),
    btrim(COALESCE(v_badge->>'supportingText', '')),
    v_full_name,
    btrim(COALESCE(v_card->>'nameAccent', '')),
    btrim(COALESCE(v_card->>'academicRole', '')),
    btrim(COALESCE(v_card->>'degreeProgram', '')),
    btrim(COALESCE(v_card->>'institution', '')),
    v_intro,
    v_sig_url,
    v_visual,
    true,
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    heading               = EXCLUDED.heading,
    heading_accent        = EXCLUDED.heading_accent,
    section_label         = EXCLUDED.section_label,
    subtitle              = EXCLUDED.subtitle,
    show_section_divider  = EXCLUDED.show_section_divider,
    badge                 = EXCLUDED.badge,
    statement             = EXCLUDED.statement,
    bio                   = EXCLUDED.bio,
    quote                 = EXCLUDED.quote,
    graduation_tag        = EXCLUDED.graduation_tag,
    photo_caption_role    = EXCLUDED.photo_caption_role,
    about_image_url       = EXCLUDED.about_image_url,
    portrait_alt          = EXCLUDED.portrait_alt,
    portrait_focal_point  = EXCLUDED.portrait_focal_point,
    portrait_fit          = EXCLUDED.portrait_fit,
    portrait_scale        = EXCLUDED.portrait_scale,
    edu_institution       = EXCLUDED.edu_institution,
    edu_program           = EXCLUDED.edu_program,
    edu_graduation_year   = EXCLUDED.edu_graduation_year,
    edu_icon              = EXCLUDED.edu_icon,
    edu_supporting_text   = EXCLUDED.edu_supporting_text,
    full_name             = EXCLUDED.full_name,
    name_accent           = EXCLUDED.name_accent,
    academic_role         = EXCLUDED.academic_role,
    degree_program        = EXCLUDED.degree_program,
    institution           = EXCLUDED.institution,
    intro_text            = EXCLUDED.intro_text,
    signature_image_url   = EXCLUDED.signature_image_url,
    visual_settings       = EXCLUDED.visual_settings,
    is_published          = true,
    published_at          = EXCLUDED.published_at,
    updated_at            = EXCLUDED.updated_at;

  -- 6. Synchronize about_interests atomically (validate every row, deduplicate, delete removed)
  v_order := 0;
  IF jsonb_typeof(p_draft->'interests') = 'array' THEN
    FOR v_interest IN SELECT value FROM jsonb_array_elements(p_draft->'interests') LOOP
      v_order := v_order + 1;
      v_title := btrim(COALESCE(v_interest->>'title', ''));
      IF v_title = '' THEN
        RAISE EXCEPTION 'Interest tag #% cannot have an empty title', v_order USING ERRCODE = '22023';
      END IF;

      v_raw_id := btrim(COALESCE(v_interest->>'id', ''));
      IF v_raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND NOT (v_raw_id::uuid = ANY(v_keep_interest_ids)) THEN
        v_item_id := v_raw_id::uuid;
      ELSE
        v_item_id := gen_random_uuid();
      END IF;

      v_keep_interest_ids := array_append(v_keep_interest_ids, v_item_id);

      INSERT INTO public.about_interests (
        id, about_id, title, icon_name, description, display_order, is_visible, is_published, updated_at
      ) VALUES (
        v_item_id,
        'global',
        v_title,
        COALESCE(NULLIF(btrim(COALESCE(v_interest->>'iconName', '')), ''), 'BrainCircuit'),
        btrim(COALESCE(v_interest->>'description', '')),
        v_order,
        COALESCE((v_interest->>'isVisible')::boolean, true),
        true,
        v_now
      )
      ON CONFLICT (id) DO UPDATE SET
        about_id      = 'global',
        title         = EXCLUDED.title,
        icon_name     = EXCLUDED.icon_name,
        description   = EXCLUDED.description,
        display_order = EXCLUDED.display_order,
        is_visible    = EXCLUDED.is_visible,
        is_published  = true,
        updated_at    = v_now;

      v_synced_interests := v_synced_interests || jsonb_build_array(
        jsonb_build_object(
          'id', v_item_id,
          'title', v_title,
          'iconName', COALESCE(NULLIF(btrim(COALESCE(v_interest->>'iconName', '')), ''), 'BrainCircuit'),
          'description', btrim(COALESCE(v_interest->>'description', '')),
          'displayOrder', v_order,
          'isVisible', COALESCE((v_interest->>'isVisible')::boolean, true)
        )
      );
    END LOOP;
  END IF;

  DELETE FROM public.about_interests
  WHERE about_id = 'global'
    AND NOT (id = ANY(v_keep_interest_ids));

  -- 7. Synchronize about_highlights atomically
  v_order := 0;
  IF jsonb_typeof(p_draft->'highlights') = 'array' THEN
    FOR v_highlight IN SELECT value FROM jsonb_array_elements(p_draft->'highlights') LOOP
      v_order := v_order + 1;
      v_title := btrim(COALESCE(v_highlight->>'title', ''));
      IF v_title = '' THEN
        RAISE EXCEPTION 'Highlight #% cannot have an empty title', v_order USING ERRCODE = '22023';
      END IF;

      v_raw_id := btrim(COALESCE(v_highlight->>'id', ''));
      IF v_raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND NOT (v_raw_id::uuid = ANY(v_keep_highlight_ids)) THEN
        v_item_id := v_raw_id::uuid;
      ELSE
        v_item_id := gen_random_uuid();
      END IF;

      v_keep_highlight_ids := array_append(v_keep_highlight_ids, v_item_id);

      INSERT INTO public.about_highlights (
        id, about_id, title, supporting_text, icon_name, description, display_order, is_visible, is_published, updated_at
      ) VALUES (
        v_item_id,
        'global',
        v_title,
        btrim(COALESCE(v_highlight->>'supportingText', '')),
        COALESCE(NULLIF(btrim(COALESCE(v_highlight->>'iconName', '')), ''), 'Terminal'),
        btrim(COALESCE(v_highlight->>'description', '')),
        v_order,
        COALESCE((v_highlight->>'isVisible')::boolean, true),
        true,
        v_now
      )
      ON CONFLICT (id) DO UPDATE SET
        about_id        = 'global',
        title           = EXCLUDED.title,
        supporting_text = EXCLUDED.supporting_text,
        icon_name       = EXCLUDED.icon_name,
        description     = EXCLUDED.description,
        display_order   = EXCLUDED.display_order,
        is_visible      = EXCLUDED.is_visible,
        is_published    = true,
        updated_at      = v_now;

      v_synced_highlights := v_synced_highlights || jsonb_build_array(
        jsonb_build_object(
          'id', v_item_id,
          'title', v_title,
          'supportingText', btrim(COALESCE(v_highlight->>'supportingText', '')),
          'iconName', COALESCE(NULLIF(btrim(COALESCE(v_highlight->>'iconName', '')), ''), 'Terminal'),
          'description', btrim(COALESCE(v_highlight->>'description', '')),
          'displayOrder', v_order,
          'isVisible', COALESCE((v_highlight->>'isVisible')::boolean, true)
        )
      );
    END LOOP;
  END IF;

  DELETE FROM public.about_highlights
  WHERE about_id = 'global'
    AND NOT (id = ANY(v_keep_highlight_ids));

  -- 8. Sync draft snapshot as published
  v_synced_draft := p_draft
    || jsonb_build_object('interests', v_synced_interests, 'highlights', v_synced_highlights);

  INSERT INTO public.about_drafts (
    id, draft_payload, has_unpublished_changes, updated_by, updated_at
  ) VALUES (
    'global', v_synced_draft, false, v_uid, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    draft_payload           = EXCLUDED.draft_payload,
    has_unpublished_changes = false,
    updated_by              = EXCLUDED.updated_by,
    updated_at              = EXCLUDED.updated_at;

  RETURN jsonb_build_object(
    'success', true,
    'published_at', v_now,
    'interests_count', jsonb_array_length(v_synced_interests),
    'highlights_count', jsonb_array_length(v_synced_highlights),
    'draft', v_synced_draft
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_about_cms(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_about_cms(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_about_cms(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.unpublish_about_cms()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_now TIMESTAMPTZ := now();
BEGIN
  IF v_uid IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: administrator privileges required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.about_content
  SET is_published = false, updated_at = v_now
  WHERE id = 'global';

  RETURN jsonb_build_object('success', true, 'is_published', false, 'updated_at', v_now);
END;
$$;

REVOKE ALL ON FUNCTION public.unpublish_about_cms() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpublish_about_cms() FROM anon;
GRANT EXECUTE ON FUNCTION public.unpublish_about_cms() TO authenticated;

-- ============================================================================
-- 6. REUSABLE CMS PERMISSION & SYSTEM HEALTH DIAGNOSTIC RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cms_health_check()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_admin BOOLEAN := false;
  v_tbl TEXT;
  v_cms_tables TEXT[] := ARRAY[
    'hero_content',
    'about_content',
    'about_interests',
    'about_highlights',
    'about_drafts',
    'projects',
    'project_media',
    'journey_milestones',
    'creator_videos',
    'site_settings',
    'media'
  ];
  v_tables_report JSONB := '[]'::jsonb;
  v_exists BOOLEAN;
  v_rls BOOLEAN;
  v_policy_count INTEGER;
  v_anon_sel BOOLEAN;
  v_auth_sel BOOLEAN;
  v_auth_ins BOOLEAN;
  v_auth_upd BOOLEAN;
  v_auth_del BOOLEAN;
  v_admin_table_locked BOOLEAN := false;
  v_bucket_public BOOLEAN := false;
  v_storage_policy_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'authorized', false,
      'error', 'No authenticated session'
    );
  END IF;

  v_is_admin := private.is_admin();
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'authorized', false,
      'user_id', v_uid,
      'error', 'Authenticated account is not an authorized administrator'
    );
  END IF;

  -- Verify public.admin_users cannot be read or written by anon or authenticated directly
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    v_admin_table_locked := NOT (
      pg_catalog.has_table_privilege('anon', 'public.admin_users', 'SELECT')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'SELECT')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'INSERT')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'UPDATE')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'DELETE')
    );
  END IF;

  -- Inspect all CMS tables
  FOREACH v_tbl IN ARRAY v_cms_tables LOOP
    v_exists := to_regclass(format('public.%I', v_tbl)) IS NOT NULL;
    IF v_exists THEN
      SELECT c.relrowsecurity INTO v_rls
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_tbl;

      SELECT count(*)::integer INTO v_policy_count
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = v_tbl;

      v_anon_sel := pg_catalog.has_table_privilege('anon', format('public.%I', v_tbl), 'SELECT');
      v_auth_sel := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'SELECT');
      v_auth_ins := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'INSERT');
      v_auth_upd := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'UPDATE');
      v_auth_del := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'DELETE');
    ELSE
      v_rls := false;
      v_policy_count := 0;
      v_anon_sel := false;
      v_auth_sel := false;
      v_auth_ins := false;
      v_auth_upd := false;
      v_auth_del := false;
    END IF;

    v_tables_report := v_tables_report || jsonb_build_array(
      jsonb_build_object(
        'table', v_tbl,
        'exists', v_exists,
        'rls_enabled', COALESCE(v_rls, false),
        'policy_count', COALESCE(v_policy_count, 0),
        'anon_select', v_anon_sel,
        'auth_select', v_auth_sel,
        'auth_write', (v_auth_ins AND v_auth_upd AND v_auth_del)
      )
    );
  END LOOP;

  -- Inspect Storage bucket and policies
  SELECT COALESCE(b.public, false) INTO v_bucket_public
  FROM storage.buckets b
  WHERE b.id = 'portfolio-media'
  LIMIT 1;

  SELECT count(*)::integer INTO v_storage_policy_count
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname IN ('Public read portfolio-media', 'Admins manage portfolio-media');

  RETURN jsonb_build_object(
    'authenticated', true,
    'authorized', true,
    'user_id', v_uid,
    'admin_users_locked', v_admin_table_locked,
    'functions', jsonb_build_object(
      'private_is_admin', to_regprocedure('private.is_admin()') IS NOT NULL,
      'check_is_admin', to_regprocedure('public.check_is_admin()') IS NOT NULL,
      'publish_about_cms', to_regprocedure('public.publish_about_cms(jsonb)') IS NOT NULL,
      'unpublish_about_cms', to_regprocedure('public.unpublish_about_cms()') IS NOT NULL,
      'get_public_about_bundle', to_regprocedure('public.get_public_about_bundle()') IS NOT NULL
    ),
    'storage', jsonb_build_object(
      'bucket_exists', v_bucket_public IS NOT NULL,
      'bucket_public', COALESCE(v_bucket_public, false),
      'policy_count', COALESCE(v_storage_policy_count, 0)
    ),
    'tables', v_tables_report,
    'checked_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cms_health_check() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cms_health_check() FROM anon;
GRANT EXECUTE ON FUNCTION public.cms_health_check() TO authenticated;

-- Prompt PostgREST to reload its schema cache immediately so new RPCs are callable right away
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- ROLLBACK / RECOVERY GUIDANCE (Reference Only — Do Not Auto-Execute)
-- ============================================================================
-- This migration is additive and non-destructive:
--   1. All existing rows in admin_users, about_content, projects, hero_content,
--      journey_milestones, site_settings, creator_videos, and media remain untouched.
--   2. If needed to revert only the new transactional RPCs without losing data:
--        DROP FUNCTION IF EXISTS public.publish_about_cms(JSONB);
--        DROP FUNCTION IF EXISTS public.unpublish_about_cms();
--        DROP FUNCTION IF EXISTS public.cms_health_check();
--        DROP FUNCTION IF EXISTS public.check_is_admin();
