-- ============================================================================
-- ABOUT SECTION CMS MIGRATION (NON-DESTRUCTIVE, IDEMPOTENT)
-- Extends existing Supabase portfolio database for dynamic About management:
--   - public.about_content (published settings & legacy compatibility)
--   - public.about_interests (normalized dynamic interest tags)
--   - public.about_highlights (normalized dynamic bottom highlight pillars)
--   - public.about_drafts (admin-only unpublished drafts)
-- ============================================================================

-- 1. Safely extend public.about_content without dropping existing columns/data
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

-- Ensure constraints on visual bounds if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'about_content_portrait_fit_check'
  ) THEN
    ALTER TABLE public.about_content
      ADD CONSTRAINT about_content_portrait_fit_check
      CHECK (portrait_fit IN ('cover', 'contain'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'about_content_portrait_scale_check'
  ) THEN
    ALTER TABLE public.about_content
      ADD CONSTRAINT about_content_portrait_scale_check
      CHECK (portrait_scale >= 0.80 AND portrait_scale <= 1.25);
  END IF;
END $$;

-- 2. Create normalized public.about_interests table
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

CREATE INDEX IF NOT EXISTS idx_about_interests_about_order
  ON public.about_interests(about_id, display_order);

-- 3. Create normalized public.about_highlights table
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

CREATE INDEX IF NOT EXISTS idx_about_highlights_about_order
  ON public.about_highlights(about_id, display_order);

-- 4. Create admin-only public.about_drafts table
CREATE TABLE IF NOT EXISTS public.about_drafts (
  id TEXT PRIMARY KEY DEFAULT 'global',
  draft_payload JSONB NOT NULL,
  has_unpublished_changes BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_drafts ENABLE ROW LEVEL SECURITY;

-- Ensure private.is_admin() helper exists and public.admin_users remains locked
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

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
      SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
    )
  END;
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Minimum table grants
REVOKE ALL ON TABLE public.about_content FROM PUBLIC;
GRANT SELECT ON TABLE public.about_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_content TO authenticated;

REVOKE ALL ON TABLE public.about_interests FROM PUBLIC;
GRANT SELECT ON TABLE public.about_interests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_interests TO authenticated;

REVOKE ALL ON TABLE public.about_highlights FROM PUBLIC;
GRANT SELECT ON TABLE public.about_highlights TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.about_highlights TO authenticated;

REVOKE ALL ON TABLE public.about_drafts FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.about_drafts TO authenticated;

-- 6. Recreate clean RLS policies using private.is_admin()
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
      SELECT 1 FROM public.about_content
      WHERE about_content.id = about_interests.about_id
        AND COALESCE(about_content.is_published, true) = true
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
      SELECT 1 FROM public.about_content
      WHERE about_content.id = about_highlights.about_id
        AND COALESCE(about_content.is_published, true) = true
    )
  );

CREATE POLICY "Admins can manage about_highlights"
  ON public.about_highlights
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- Strictly admin-only access for about_drafts (public has NO access)
DROP POLICY IF EXISTS "Admins can manage about_drafts" ON public.about_drafts;

CREATE POLICY "Admins can manage about_drafts"
  ON public.about_drafts
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- 7. Seed initial global about_content row if missing (non-destructive)
INSERT INTO public.about_content (
  id,
  heading,
  heading_accent,
  section_label,
  subtitle,
  statement,
  bio,
  intro_text,
  about_image_url,
  badge,
  graduation_tag,
  photo_caption_role,
  full_name,
  name_accent,
  academic_role,
  degree_program,
  institution,
  edu_institution,
  edu_program,
  edu_graduation_year,
  edu_icon,
  is_published
)
SELECT
  'global',
  'ABOUT',
  'ME',
  'THE PERSON BEHIND THE CODE',
  'Curious by default. Building by choice.',
  'CURIOUS BY DEFAULT. BUILDING BY CHOICE.',
  '["I am a Computer Science undergraduate exploring artificial intelligence, machine learning, physical computing, and software development. Rather than treating technology as abstract theory, I prefer learning through hands-on building—from configuring microcontrollers like the ESP32-S3 to writing reactive software interfaces.","As a technology creator, I produce digital media breaking down complex computing architectures and developer workflows into clear, engaging visual stories. I believe that teaching concepts simply is the best test of truly understanding them.","My current focus is building disciplined technical competence across algorithms, systems, and automation. Looking ahead toward 2030, I am driven by the prospect of entrepreneurship as a future direction—turning solid engineering principles into meaningful products and independent ventures."]',
  'I am a Computer Science undergraduate exploring artificial intelligence, machine learning, physical computing, and software development. Rather than treating technology as abstract theory, I prefer learning through hands-on building—from configuring microcontrollers like the ESP32-S3 to writing reactive software interfaces.',
  '/images/afrid-about.jpg',
  'THE PERSON BEHIND THE CODE',
  'EXPECTED GRADUATION: 2030',
  'CS UNDERGRADUATE · CREATOR',
  'Afrid',
  'Ahmed',
  'SLIIT Undergraduate',
  'BSc (Hons) in Computer Science',
  'SLIIT',
  'SLIIT',
  'CS',
  'Class of 2030',
  'GraduationCap',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.about_content WHERE id = 'global'
);

-- 8. Seed initial interests if public.about_interests is empty
INSERT INTO public.about_interests (about_id, title, icon_name, description, display_order, is_visible, is_published)
SELECT * FROM (
  VALUES
    ('global', 'AI/ML', 'BrainCircuit', 'Artificial intelligence and machine learning systems', 1, true, true),
    ('global', 'Cloud', 'Cloud', 'Scalable cloud infrastructure and deployment workflows', 2, true, true),
    ('global', 'Cybersecurity', 'ShieldCheck', 'Secure software systems and defensive computing', 3, true, true),
    ('global', 'Automation', 'Workflow', 'Automated developer pipelines and intelligent tooling', 4, true, true)
) AS seed(about_id, title, icon_name, description, display_order, is_visible, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.about_interests WHERE about_id = 'global');

-- 9. Seed initial highlights if public.about_highlights is empty
INSERT INTO public.about_highlights (about_id, title, supporting_text, icon_name, description, display_order, is_visible, is_published)
SELECT * FROM (
  VALUES
    ('global', 'Python / Programming', '', 'Terminal', 'Software architecture, algorithms, and systems scripting', 1, true, true),
    ('global', 'Content Creation & YouTube', '', 'Youtube', 'Explaining engineering concepts through visual storytelling', 2, true, true),
    ('global', 'Freelancing & Business', '', 'Briefcase', 'Building useful digital solutions and venture exploration', 3, true, true),
    ('global', 'Innovation', '', 'Lightbulb', 'Combining hardware, AI, and code into practical builds', 4, true, true)
) AS seed(about_id, title, supporting_text, icon_name, description, display_order, is_visible, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.about_highlights WHERE about_id = 'global');

-- 10. Ensure portfolio-media storage bucket policies support authenticated admin uploads & public reads
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read portfolio-media" ON storage.objects;
  CREATE POLICY "Public read portfolio-media"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'portfolio-media');

  DROP POLICY IF EXISTS "Admins manage portfolio-media" ON storage.objects;
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
END $$;

-- 11. Public read bundle RPC (returns published data only; distinguishes unpublished vs unseeded cleanly)
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

