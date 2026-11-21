// =============================================================================
// IDEMPOTENT SUPABASE CMS PERMISSION REPAIR & ATOMIC PUBLISHING MIGRATION SQL
// Keep synchronized with /supabase/migrations/20261121_repair_admin_auth_and_cms_permissions.sql
// =============================================================================

export const CMS_REPAIR_SQL_MIGRATION = `-- ============================================================================
-- AFRID AHMED PORTFOLIO CMS — ADMIN AUTH & PERMISSIONS REPAIR MIGRATION
-- Safe & Idempotent (Re-runnable in Supabase Dashboard -> SQL Editor)
-- ============================================================================

-- 1. PRIVATE SCHEMA & CENTRALIZED ADMIN VERIFICATION FUNCTION
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep public.admin_users strictly locked down (no direct client reads/writes)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_users FROM anon;
REVOKE ALL ON TABLE public.admin_users FROM authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.admin_users a
       WHERE a.user_id = auth.uid()
     );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

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

-- 2. ENSURE ABOUT SECTION SCHEMA COLUMNS & TABLES EXIST
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
  ADD COLUMN IF NOT EXISTS visual_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
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

-- 3. LEAST-PRIVILEGE GRANTS & CENTRALIZED RLS ACROSS ALL CMS TABLES
REVOKE ALL ON TABLE public.about_content, public.about_interests, public.about_highlights, public.about_drafts FROM PUBLIC;
GRANT SELECT ON TABLE public.about_content, public.about_interests, public.about_highlights TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_content, public.about_interests, public.about_highlights TO authenticated;
REVOKE ALL ON TABLE public.about_drafts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.about_drafts TO authenticated;

ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published about_content" ON public.about_content;
DROP POLICY IF EXISTS "Admins can manage about_content" ON public.about_content;
CREATE POLICY "Public can view published about_content"
  ON public.about_content FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can manage about_content"
  ON public.about_content FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Public can view published about_interests" ON public.about_interests;
DROP POLICY IF EXISTS "Admins can manage about_interests" ON public.about_interests;
CREATE POLICY "Public can view published about_interests"
  ON public.about_interests FOR SELECT TO anon, authenticated USING (is_published = true AND is_visible = true);
CREATE POLICY "Admins can manage about_interests"
  ON public.about_interests FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Public can view published about_highlights" ON public.about_highlights;
DROP POLICY IF EXISTS "Admins can manage about_highlights" ON public.about_highlights;
CREATE POLICY "Public can view published about_highlights"
  ON public.about_highlights FOR SELECT TO anon, authenticated USING (is_published = true AND is_visible = true);
CREATE POLICY "Admins can manage about_highlights"
  ON public.about_highlights FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins can manage about_drafts" ON public.about_drafts;
CREATE POLICY "Admins can manage about_drafts"
  ON public.about_drafts FOR ALL TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['hero_content', 'site_settings', 'projects', 'journey_milestones', 'creator_videos', 'media'] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', tbl);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', tbl);
      EXECUTE format('GRANT INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', tbl);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.project_media') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.project_media FROM PUBLIC;
    GRANT SELECT ON TABLE public.project_media TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON TABLE public.project_media TO authenticated;
    ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access to project_media" ON public.project_media;
    CREATE POLICY "Admins have full access to project_media"
      ON public.project_media FOR ALL TO authenticated
      USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
  END IF;
END $$;

DROP POLICY IF EXISTS "Public read portfolio-media" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage portfolio-media" ON storage.objects;
CREATE POLICY "Public read portfolio-media"
  ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'portfolio-media');
CREATE POLICY "Admins manage portfolio-media"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'portfolio-media' AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id = 'portfolio-media' AND (SELECT private.is_admin()));

-- 4. HARDENED PUBLIC ABOUT BUNDLE RPC
CREATE OR REPLACE FUNCTION public.get_public_about_bundle()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_about public.about_content%ROWTYPE; v_interests JSONB; v_highlights JSONB;
BEGIN
  SELECT * INTO v_about FROM public.about_content WHERE id = 'global' LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('seeded', false, 'is_published', true, 'about', null, 'interests', '[]'::jsonb, 'highlights', '[]'::jsonb); END IF;
  IF COALESCE(v_about.is_published, true) = false THEN RETURN jsonb_build_object('seeded', true, 'is_published', false, 'about', null, 'interests', '[]'::jsonb, 'highlights', '[]'::jsonb); END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'icon_name', i.icon_name, 'description', COALESCE(i.description, ''), 'display_order', i.display_order, 'is_visible', i.is_visible) ORDER BY i.display_order ASC, i.created_at ASC), '[]'::jsonb)
  INTO v_interests FROM public.about_interests i WHERE i.about_id = 'global' AND i.is_published = true AND i.is_visible = true;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', h.id, 'title', h.title, 'supporting_text', COALESCE(h.supporting_text, ''), 'icon_name', h.icon_name, 'description', COALESCE(h.description, ''), 'display_order', h.display_order, 'is_visible', h.is_visible) ORDER BY h.display_order ASC, h.created_at ASC), '[]'::jsonb)
  INTO v_highlights FROM public.about_highlights h WHERE h.about_id = 'global' AND h.is_published = true AND h.is_visible = true;
  RETURN jsonb_build_object('seeded', true, 'is_published', true, 'about', to_jsonb(v_about), 'interests', v_interests, 'highlights', v_highlights);
END; $$;
REVOKE ALL ON FUNCTION public.get_public_about_bundle() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_about_bundle() TO anon, authenticated;

-- 5. ATOMIC TRANSACTIONAL ABOUT PUBLISH / UNPUBLISH RPCS
CREATE OR REPLACE FUNCTION public.publish_about_cms(p_draft JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid UUID := auth.uid(); v_now TIMESTAMPTZ := now();
  v_header JSONB; v_portrait JSONB; v_badge JSONB; v_card JSONB; v_visual JSONB; v_legacy JSONB;
  v_heading TEXT; v_full_name TEXT; v_intro TEXT; v_bio_arr JSONB;
  v_portrait_url TEXT; v_sig_url TEXT; v_fit TEXT; v_scale NUMERIC(3,2);
  v_interest JSONB; v_highlight JSONB; v_item_id UUID; v_raw_id TEXT; v_title TEXT; v_order INTEGER := 0;
  v_keep_interest_ids UUID[] := ARRAY[]::UUID[]; v_keep_highlight_ids UUID[] := ARRAY[]::UUID[];
  v_synced_interests JSONB := '[]'::jsonb; v_synced_highlights JSONB := '[]'::jsonb; v_synced_draft JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Session expired or not authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Unauthorized: user % is not an authorized administrator', v_uid USING ERRCODE = '42501'; END IF;
  IF p_draft IS NULL OR jsonb_typeof(p_draft) <> 'object' THEN RAISE EXCEPTION 'Invalid draft payload provided' USING ERRCODE = '22023'; END IF;

  v_header := COALESCE(p_draft->'header', '{}'::jsonb); v_portrait := COALESCE(p_draft->'portrait', '{}'::jsonb);
  v_badge := COALESCE(p_draft->'educationBadge', '{}'::jsonb); v_card := COALESCE(p_draft->'profileCard', '{}'::jsonb);
  v_visual := COALESCE(p_draft->'visualSettings', '{}'::jsonb); v_legacy := COALESCE(p_draft->'legacyMeta', '{}'::jsonb);

  v_heading := btrim(COALESCE(v_header->>'heading', '')); v_full_name := btrim(COALESCE(v_card->>'fullName', '')); v_intro := btrim(COALESCE(v_card->>'introduction', ''));
  IF v_heading = '' THEN RAISE EXCEPTION 'Main Heading cannot be empty' USING ERRCODE = '22023'; END IF;
  IF v_full_name = '' THEN RAISE EXCEPTION 'Profile Full Name cannot be empty' USING ERRCODE = '22023'; END IF;
  IF v_intro = '' THEN RAISE EXCEPTION 'Profile Introduction cannot be empty' USING ERRCODE = '22023'; END IF;

  v_portrait_url := btrim(COALESCE(v_portrait->>'imageUrl', ''));
  IF v_portrait_url <> '' AND (lower(v_portrait_url) ~ '^(javascript|vbscript|data|blob):' OR NOT (v_portrait_url ~ '^(/|https?://)')) THEN
    RAISE EXCEPTION 'Invalid portrait URL scheme' USING ERRCODE = '22023';
  END IF;
  v_sig_url := btrim(COALESCE(v_card->>'signatureImageUrl', ''));
  IF v_sig_url <> '' AND (lower(v_sig_url) ~ '^(javascript|vbscript|data|blob):' OR NOT (v_sig_url ~ '^(/|https?://)')) THEN
    RAISE EXCEPTION 'Invalid signature URL scheme' USING ERRCODE = '22023';
  END IF;

  v_fit := CASE WHEN v_portrait->>'fit' = 'contain' THEN 'contain' ELSE 'cover' END;
  v_scale := LEAST(1.15, GREATEST(0.85, COALESCE((v_portrait->>'scale')::numeric, 1.00)))::numeric(3,2);
  v_bio_arr := COALESCE(v_legacy->'biographyParagraphs', '[]'::jsonb);
  IF jsonb_typeof(v_bio_arr) <> 'array' OR jsonb_array_length(v_bio_arr) = 0 THEN v_bio_arr := jsonb_build_array(v_intro);
  ELSE v_bio_arr := jsonb_set(v_bio_arr, '{0}', to_jsonb(v_intro), true); END IF;

  INSERT INTO public.about_content (
    id, heading, heading_accent, section_label, subtitle, show_section_divider, badge, statement, bio, quote,
    graduation_tag, photo_caption_role, about_image_url, portrait_alt, portrait_focal_point, portrait_fit, portrait_scale,
    edu_institution, edu_program, edu_graduation_year, edu_icon, edu_supporting_text,
    full_name, name_accent, academic_role, degree_program, institution, intro_text, signature_image_url,
    visual_settings, is_published, published_at, updated_at
  ) VALUES (
    'global', v_heading, btrim(COALESCE(v_header->>'headingAccent', '')), btrim(COALESCE(v_header->>'sectionLabel', '')),
    btrim(COALESCE(v_header->>'subtitle', '')), COALESCE((v_header->>'showDivider')::boolean, false),
    COALESCE(NULLIF(btrim(COALESCE(v_header->>'sectionLabel', '')), ''), 'THE PERSON BEHIND THE CODE'),
    COALESCE(NULLIF(btrim(COALESCE(v_header->>'subtitle', '')), ''), 'Curious by default. Building by choice.'),
    v_bio_arr::text, COALESCE(NULLIF(btrim(COALESCE(v_legacy->>'quote', '')), ''), 'Learning through building, exploring through systems.'),
    COALESCE(NULLIF(btrim(COALESCE(v_badge->>'graduationYear', '')), ''), 'Class of 2030'),
    COALESCE(NULLIF(btrim(COALESCE(v_card->>'academicRole', '')), ''), 'SLIIT Undergraduate'),
    v_portrait_url, COALESCE(NULLIF(btrim(COALESCE(v_portrait->>'altText', '')), ''), 'Afrid Ahmed'),
    COALESCE(NULLIF(btrim(COALESCE(v_portrait->>'focalPoint', '')), ''), '50% 15%'), v_fit, v_scale,
    btrim(COALESCE(v_badge->>'institution', '')), btrim(COALESCE(v_badge->>'program', '')), btrim(COALESCE(v_badge->>'graduationYear', '')),
    COALESCE(NULLIF(btrim(COALESCE(v_badge->>'iconName', '')), ''), 'GraduationCap'), btrim(COALESCE(v_badge->>'supportingText', '')),
    v_full_name, btrim(COALESCE(v_card->>'nameAccent', '')), btrim(COALESCE(v_card->>'academicRole', '')),
    btrim(COALESCE(v_card->>'degreeProgram', '')), btrim(COALESCE(v_card->>'institution', '')), v_intro, v_sig_url,
    v_visual, true, v_now, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    heading = EXCLUDED.heading, heading_accent = EXCLUDED.heading_accent, section_label = EXCLUDED.section_label,
    subtitle = EXCLUDED.subtitle, show_section_divider = EXCLUDED.show_section_divider, badge = EXCLUDED.badge,
    statement = EXCLUDED.statement, bio = EXCLUDED.bio, quote = EXCLUDED.quote, graduation_tag = EXCLUDED.graduation_tag,
    photo_caption_role = EXCLUDED.photo_caption_role, about_image_url = EXCLUDED.about_image_url, portrait_alt = EXCLUDED.portrait_alt,
    portrait_focal_point = EXCLUDED.portrait_focal_point, portrait_fit = EXCLUDED.portrait_fit, portrait_scale = EXCLUDED.portrait_scale,
    edu_institution = EXCLUDED.edu_institution, edu_program = EXCLUDED.edu_program, edu_graduation_year = EXCLUDED.edu_graduation_year,
    edu_icon = EXCLUDED.edu_icon, edu_supporting_text = EXCLUDED.edu_supporting_text, full_name = EXCLUDED.full_name,
    name_accent = EXCLUDED.name_accent, academic_role = EXCLUDED.academic_role, degree_program = EXCLUDED.degree_program,
    institution = EXCLUDED.institution, intro_text = EXCLUDED.intro_text, signature_image_url = EXCLUDED.signature_image_url,
    visual_settings = EXCLUDED.visual_settings, is_published = true, published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at;

  v_order := 0;
  IF jsonb_typeof(p_draft->'interests') = 'array' THEN
    FOR v_interest IN SELECT value FROM jsonb_array_elements(p_draft->'interests') LOOP
      v_order := v_order + 1;
      v_title := btrim(COALESCE(v_interest->>'title', ''));
      IF v_title = '' THEN RAISE EXCEPTION 'Interest tag #% cannot have an empty title', v_order USING ERRCODE = '22023'; END IF;
      v_raw_id := btrim(COALESCE(v_interest->>'id', ''));
      IF v_raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND NOT (v_raw_id::uuid = ANY(v_keep_interest_ids)) THEN v_item_id := v_raw_id::uuid;
      ELSE v_item_id := gen_random_uuid(); END IF;
      v_keep_interest_ids := array_append(v_keep_interest_ids, v_item_id);
      INSERT INTO public.about_interests (id, about_id, title, icon_name, description, display_order, is_visible, is_published, updated_at)
      VALUES (v_item_id, 'global', v_title, COALESCE(NULLIF(btrim(COALESCE(v_interest->>'iconName', '')), ''), 'BrainCircuit'), btrim(COALESCE(v_interest->>'description', '')), v_order, COALESCE((v_interest->>'isVisible')::boolean, true), true, v_now)
      ON CONFLICT (id) DO UPDATE SET about_id = 'global', title = EXCLUDED.title, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description, display_order = EXCLUDED.display_order, is_visible = EXCLUDED.is_visible, is_published = true, updated_at = v_now;
      v_synced_interests := v_synced_interests || jsonb_build_array(jsonb_build_object('id', v_item_id, 'title', v_title, 'iconName', COALESCE(NULLIF(btrim(COALESCE(v_interest->>'iconName', '')), ''), 'BrainCircuit'), 'description', btrim(COALESCE(v_interest->>'description', '')), 'displayOrder', v_order, 'isVisible', COALESCE((v_interest->>'isVisible')::boolean, true)));
    END LOOP;
  END IF;
  DELETE FROM public.about_interests WHERE about_id = 'global' AND NOT (id = ANY(v_keep_interest_ids));

  v_order := 0;
  IF jsonb_typeof(p_draft->'highlights') = 'array' THEN
    FOR v_highlight IN SELECT value FROM jsonb_array_elements(p_draft->'highlights') LOOP
      v_order := v_order + 1;
      v_title := btrim(COALESCE(v_highlight->>'title', ''));
      IF v_title = '' THEN RAISE EXCEPTION 'Highlight #% cannot have an empty title', v_order USING ERRCODE = '22023'; END IF;
      v_raw_id := btrim(COALESCE(v_highlight->>'id', ''));
      IF v_raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND NOT (v_raw_id::uuid = ANY(v_keep_highlight_ids)) THEN v_item_id := v_raw_id::uuid;
      ELSE v_item_id := gen_random_uuid(); END IF;
      v_keep_highlight_ids := array_append(v_keep_highlight_ids, v_item_id);
      INSERT INTO public.about_highlights (id, about_id, title, supporting_text, icon_name, description, display_order, is_visible, is_published, updated_at)
      VALUES (v_item_id, 'global', v_title, btrim(COALESCE(v_highlight->>'supportingText', '')), COALESCE(NULLIF(btrim(COALESCE(v_highlight->>'iconName', '')), ''), 'Terminal'), btrim(COALESCE(v_highlight->>'description', '')), v_order, COALESCE((v_highlight->>'isVisible')::boolean, true), true, v_now)
      ON CONFLICT (id) DO UPDATE SET about_id = 'global', title = EXCLUDED.title, supporting_text = EXCLUDED.supporting_text, icon_name = EXCLUDED.icon_name, description = EXCLUDED.description, display_order = EXCLUDED.display_order, is_visible = EXCLUDED.is_visible, is_published = true, updated_at = v_now;
      v_synced_highlights := v_synced_highlights || jsonb_build_array(jsonb_build_object('id', v_item_id, 'title', v_title, 'supportingText', btrim(COALESCE(v_highlight->>'supportingText', '')), 'iconName', COALESCE(NULLIF(btrim(COALESCE(v_highlight->>'iconName', '')), ''), 'Terminal'), 'description', btrim(COALESCE(v_highlight->>'description', '')), 'displayOrder', v_order, 'isVisible', COALESCE((v_highlight->>'isVisible')::boolean, true)));
    END LOOP;
  END IF;
  DELETE FROM public.about_highlights WHERE about_id = 'global' AND NOT (id = ANY(v_keep_highlight_ids));

  v_synced_draft := p_draft || jsonb_build_object('interests', v_synced_interests, 'highlights', v_synced_highlights);
  INSERT INTO public.about_drafts (id, draft_payload, has_unpublished_changes, updated_by, updated_at)
  VALUES ('global', v_synced_draft, false, v_uid, v_now)
  ON CONFLICT (id) DO UPDATE SET draft_payload = EXCLUDED.draft_payload, has_unpublished_changes = false, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('success', true, 'published_at', v_now, 'interests_count', jsonb_array_length(v_synced_interests), 'highlights_count', jsonb_array_length(v_synced_highlights), 'draft', v_synced_draft);
END; $$;
REVOKE ALL ON FUNCTION public.publish_about_cms(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_about_cms(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.unpublish_about_cms()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid UUID := auth.uid(); v_now TIMESTAMPTZ := now();
BEGIN
  IF v_uid IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Unauthorized: administrator privileges required' USING ERRCODE = '42501'; END IF;
  UPDATE public.about_content SET is_published = false, updated_at = v_now WHERE id = 'global';
  RETURN jsonb_build_object('success', true, 'is_published', false, 'updated_at', v_now);
END; $$;
REVOKE ALL ON FUNCTION public.unpublish_about_cms() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_about_cms() TO authenticated;

-- 6. CMS PERMISSION & HEALTH CHECK RPC
CREATE OR REPLACE FUNCTION public.cms_health_check()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid UUID := auth.uid(); v_tbl TEXT;
  v_cms_tables TEXT[] := ARRAY['hero_content','about_content','about_interests','about_highlights','about_drafts','projects','project_media','journey_milestones','creator_videos','site_settings','media'];
  v_tables_report JSONB := '[]'::jsonb; v_exists BOOLEAN; v_rls BOOLEAN; v_policy_count INTEGER;
  v_anon_sel BOOLEAN; v_auth_sel BOOLEAN; v_auth_ins BOOLEAN; v_auth_upd BOOLEAN; v_auth_del BOOLEAN;
  v_admin_table_locked BOOLEAN := false; v_bucket_public BOOLEAN; v_storage_policy_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('authenticated', false, 'authorized', false, 'error', 'No authenticated session'); END IF;
  IF NOT private.is_admin() THEN RETURN jsonb_build_object('authenticated', true, 'authorized', false, 'user_id', v_uid, 'error', 'Authenticated account is not an authorized administrator'); END IF;
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    v_admin_table_locked := NOT (
      pg_catalog.has_table_privilege('anon', 'public.admin_users', 'SELECT')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'SELECT')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'INSERT')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'UPDATE')
      OR pg_catalog.has_table_privilege('authenticated', 'public.admin_users', 'DELETE')
    );
  END IF;
  FOREACH v_tbl IN ARRAY v_cms_tables LOOP
    v_exists := to_regclass(format('public.%I', v_tbl)) IS NOT NULL;
    IF v_exists THEN
      SELECT c.relrowsecurity INTO v_rls FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = v_tbl;
      SELECT count(*)::integer INTO v_policy_count FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = v_tbl;
      v_anon_sel := pg_catalog.has_table_privilege('anon', format('public.%I', v_tbl), 'SELECT');
      v_auth_sel := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'SELECT');
      v_auth_ins := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'INSERT');
      v_auth_upd := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'UPDATE');
      v_auth_del := pg_catalog.has_table_privilege('authenticated', format('public.%I', v_tbl), 'DELETE');
    ELSE v_rls := false; v_policy_count := 0; v_anon_sel := false; v_auth_sel := false; v_auth_ins := false; v_auth_upd := false; v_auth_del := false; END IF;
    v_tables_report := v_tables_report || jsonb_build_array(jsonb_build_object('table', v_tbl, 'exists', v_exists, 'rls_enabled', COALESCE(v_rls, false), 'policy_count', COALESCE(v_policy_count, 0), 'anon_select', v_anon_sel, 'auth_select', v_auth_sel, 'auth_write', (v_auth_ins AND v_auth_upd AND v_auth_del)));
  END LOOP;
  SELECT COALESCE(b.public, false) INTO v_bucket_public FROM storage.buckets b WHERE b.id = 'portfolio-media' LIMIT 1;
  SELECT count(*)::integer INTO v_storage_policy_count FROM pg_catalog.pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname IN ('Public read portfolio-media', 'Admins manage portfolio-media');
  RETURN jsonb_build_object(
    'authenticated', true, 'authorized', true, 'user_id', v_uid, 'admin_users_locked', v_admin_table_locked,
    'functions', jsonb_build_object('private_is_admin', to_regprocedure('private.is_admin()') IS NOT NULL, 'check_is_admin', to_regprocedure('public.check_is_admin()') IS NOT NULL, 'publish_about_cms', to_regprocedure('public.publish_about_cms(jsonb)') IS NOT NULL, 'unpublish_about_cms', to_regprocedure('public.unpublish_about_cms()') IS NOT NULL, 'get_public_about_bundle', to_regprocedure('public.get_public_about_bundle()') IS NOT NULL),
    'storage', jsonb_build_object('bucket_exists', v_bucket_public IS NOT NULL, 'bucket_public', COALESCE(v_bucket_public, false), 'policy_count', COALESCE(v_storage_policy_count, 0)),
    'tables', v_tables_report, 'checked_at', now()
  );
END; $$;
REVOKE ALL ON FUNCTION public.cms_health_check() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cms_health_check() TO authenticated;`;
