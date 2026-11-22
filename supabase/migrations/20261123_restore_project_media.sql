-- ============================================================================
-- PRODUCTION MIGRATION: RESTORE public.project_media TABLE & BACKFILL
-- Migration: 20261123_restore_project_media.sql
-- Target: Supabase PostgreSQL Database
--
-- REVISION SUMMARY (Targeted Final Review):
--   1. Full Schema Compatibility Verification:
--      - Validates column names, exact UDT data types, nullability, constraints,
--        primary key, foreign key, and check constraint on media_type.
--      - If an existing table is incompatible, halts immediately with a clear error.
--   2. Integer Overflow Protection:
--      - Validates `display_order` against 32-bit INTEGER limits (-2,147,483,648
--        to 2,147,483,647) before casting. Out-of-range values safely default to 0.
--   3. Secure Trigger Placement:
--      - Places `set_project_media_updated_at()` inside the unexposed `private` schema.
--      - Sets `search_path = ''` and revokes execution grants to prevent API exposure.
--   4. RLS Verification:
--      - Sweeps all existing/legacy policies before re-establishing tight rules.
--      - Public & anon can ONLY read published media belonging to published projects.
--      - Mutations strictly restricted to admins verified via `private.is_admin()`.
--   5. Non-Destructive Backfill:
--      - Uses `ON CONFLICT (id) DO NOTHING` to protect admin edits from being overwritten.
--      - Source records in `public.media` remain 100% untouched.
--   6. Schema Cache:
--      - Reloads PostgREST cache immediately via NOTIFY.
--
-- SECURITY GUARANTEES:
--   - Non-destructive: Existing `public.media` and `public.projects` remain intact.
--   - Strict Authorization: Uses `private.is_admin()` exclusively.
--   - Scoped: Affects ONLY public.project_media.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schema Detection, Detailed Validation & Table Creation
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_incompatibilities TEXT[] := ARRAY[]::TEXT[];
    v_has_pk BOOLEAN := false;
    v_has_fk BOOLEAN := false;
    v_has_type_check BOOLEAN := false;
    rec RECORD;
BEGIN
    IF to_regclass('public.project_media') IS NOT NULL THEN
        -- Table already exists: Perform rigorous deep validation

        -- 1. Check required columns, exact data types, and nullability
        FOR rec IN
            WITH expected_cols AS (
                SELECT 'id'::text AS col, 'uuid'::text AS udt, 'NO'::text AS nullable UNION ALL
                SELECT 'project_id', 'uuid', 'NO' UNION ALL
                SELECT 'media_type', 'text', 'NO' UNION ALL
                SELECT 'media_url', 'text', 'NO' UNION ALL
                SELECT 'caption', 'text', 'YES' UNION ALL
                SELECT 'display_order', 'int4', 'NO' UNION ALL
                SELECT 'is_featured', 'bool', 'NO' UNION ALL
                SELECT 'is_published', 'bool', 'NO' UNION ALL
                SELECT 'alt_text', 'text', 'YES' UNION ALL
                SELECT 'created_at', 'timestamptz', 'NO' UNION ALL
                SELECT 'updated_at', 'timestamptz', 'NO'
            )
            SELECT
                e.col,
                e.udt AS exp_udt,
                e.nullable AS exp_null,
                c.udt_name AS act_udt,
                c.is_nullable AS act_null
            FROM expected_cols e
            LEFT JOIN information_schema.columns c
                ON c.table_schema = 'public'
               AND c.table_name = 'project_media'
               AND c.column_name = e.col
        LOOP
            IF rec.act_udt IS NULL THEN
                v_incompatibilities := array_append(v_incompatibilities, format('Missing column: %s', rec.col));
            ELSIF rec.act_udt <> rec.exp_udt THEN
                v_incompatibilities := array_append(
                    v_incompatibilities,
                    format('Column %s has type %s (expected %s)', rec.col, rec.act_udt, rec.exp_udt)
                );
            ELSIF rec.exp_null = 'NO' AND rec.act_null = 'YES' THEN
                v_incompatibilities := array_append(
                    v_incompatibilities,
                    format('Column %s allows NULL (expected NOT NULL)', rec.col)
                );
            END IF;
        END LOOP;

        -- 2. Verify Primary Key on id
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name = 'project_media'
              AND tc.constraint_type = 'PRIMARY KEY'
              AND kcu.column_name = 'id'
        ) INTO v_has_pk;

        IF NOT v_has_pk THEN
            v_incompatibilities := array_append(v_incompatibilities, 'Missing primary key constraint on column: id');
        END IF;

        -- 3. Verify Foreign Key to public.projects(id)
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name = 'project_media'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'project_id'
        ) INTO v_has_fk;

        IF NOT v_has_fk THEN
            v_incompatibilities := array_append(v_incompatibilities, 'Missing foreign key on project_id referencing public.projects');
        END IF;

        -- 4. Verify media_type CHECK constraint ('image', 'video')
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu
                ON cc.constraint_name = ccu.constraint_name
               AND cc.constraint_schema = ccu.constraint_schema
            WHERE ccu.table_schema = 'public'
              AND ccu.table_name = 'project_media'
              AND ccu.column_name = 'media_type'
              AND cc.check_clause LIKE '%image%'
              AND cc.check_clause LIKE '%video%'
        ) INTO v_has_type_check;

        IF NOT v_has_type_check THEN
            v_incompatibilities := array_append(v_incompatibilities, 'Missing CHECK constraint on media_type (image/video)');
        END IF;

        -- Halt if any incompatibility was detected
        IF array_length(v_incompatibilities, 1) > 0 THEN
            RAISE EXCEPTION
                'Table public.project_media exists with an incompatible schema:% - %Halting migration to prevent schema corruption. Please inspect the existing table.',
                chr(10),
                array_to_string(v_incompatibilities, chr(10) || ' - ');
        END IF;

        RAISE NOTICE 'Table public.project_media already exists and passed all schema compatibility validations.';
    ELSE
        -- Table does not exist: create with authoritative schema
        CREATE TABLE public.project_media (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
            media_url TEXT NOT NULL,
            caption TEXT DEFAULT '',
            display_order INTEGER NOT NULL DEFAULT 0,
            is_featured BOOLEAN NOT NULL DEFAULT false,
            is_published BOOLEAN NOT NULL DEFAULT true,
            alt_text TEXT DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        RAISE NOTICE 'Created table public.project_media with authoritative schema.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Indexes for High-Performance Queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_media_project_id
    ON public.project_media(project_id);

CREATE INDEX IF NOT EXISTS idx_project_media_display_order
    ON public.project_media(display_order);

CREATE INDEX IF NOT EXISTS idx_project_media_featured
    ON public.project_media(is_featured);

CREATE INDEX IF NOT EXISTS idx_project_media_published
    ON public.project_media(is_published);

-- Composite index covering the primary public gallery query:
-- .in('project_id', [...]).eq('is_published', true).order('is_featured', false).order('display_order', true)
CREATE INDEX IF NOT EXISTS idx_project_media_lookup
    ON public.project_media(project_id, is_published, is_featured DESC, display_order ASC);

-- ----------------------------------------------------------------------------
-- 3. Secure Automatic updated_at Trigger (Placed in unexposed private schema)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.set_project_media_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Ensure trigger function is never callable directly via PostgREST API
REVOKE ALL ON FUNCTION private.set_project_media_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.set_project_media_updated_at() FROM anon;
REVOKE ALL ON FUNCTION private.set_project_media_updated_at() FROM authenticated;

DROP TRIGGER IF EXISTS trigger_set_project_media_updated_at ON public.project_media;
CREATE TRIGGER trigger_set_project_media_updated_at
    BEFORE UPDATE ON public.project_media
    FOR EACH ROW
    EXECUTE FUNCTION private.set_project_media_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Clean Policy Slate & Strict Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

-- Apply least-privilege role permissions
REVOKE ALL ON TABLE public.project_media FROM PUBLIC;
REVOKE ALL ON TABLE public.project_media FROM anon;
REVOKE ALL ON TABLE public.project_media FROM authenticated;

GRANT SELECT ON TABLE public.project_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.project_media TO authenticated;

-- Dynamic policy sweep: Drop ALL pre-existing policies on project_media
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'project_media'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_media', pol.policyname);
        RAISE NOTICE 'Dropped legacy policy % on public.project_media', pol.policyname;
    END LOOP;
END $$;

-- Policy 1: Public Read Access
-- Anonymous and authenticated visitors can ONLY view published media for published projects
CREATE POLICY "Public users can view published project media"
    ON public.project_media
    FOR SELECT
    TO anon, authenticated
    USING (
        is_published = true
        AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_media.project_id
              AND p.is_published = true
        )
    );

-- Policy 2: Admin Full Management Access
-- All mutations (INSERT, UPDATE, DELETE) and admin queries require private.is_admin()
CREATE POLICY "Admins can manage project_media"
    ON public.project_media
    FOR ALL
    TO authenticated
    USING (
        (SELECT private.is_admin())
    )
    WITH CHECK (
        (SELECT private.is_admin())
    );

-- ----------------------------------------------------------------------------
-- 5. Robust & Non-Destructive Idempotent Backfill from public.media
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
    v_meta JSONB;
    v_raw_proj_id TEXT;
    v_proj_id UUID;
    v_slug TEXT;
    v_caption TEXT;
    v_raw_order TEXT;
    v_display_order INTEGER;
    v_raw_featured TEXT;
    v_is_featured BOOLEAN;
    v_raw_published TEXT;
    v_is_published BOOLEAN;
    v_media_type TEXT;
    v_inserted_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
BEGIN
    IF to_regclass('public.media') IS NULL THEN
        RAISE NOTICE 'public.media table not found. Skipping project media backfill.';
        RETURN;
    END IF;

    FOR r IN
        SELECT
            m.id,
            m.public_url,
            m.media_type,
            m.alt_text,
            m.file_name,
            m.file_path,
            m.created_at
        FROM public.media m
        WHERE m.file_path LIKE 'projects/%'
          AND m.alt_text LIKE '{%'
    LOOP
        -- 1. Validate JSON in alt_text
        BEGIN
            v_meta := r.alt_text::jsonb;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping media record %: alt_text is not valid JSON.', r.id;
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END;

        -- 2. Validate Project Identifier (UUID or Folder Slug)
        v_raw_proj_id := trim(v_meta->>'project_id');
        v_proj_id := NULL;

        IF v_raw_proj_id IS NOT NULL AND v_raw_proj_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_proj_id := v_raw_proj_id::uuid;
        ELSE
            -- Attempt resolution from file_path: projects/<slug>/...
            v_slug := split_part(r.file_path, '/', 2);
            IF v_slug <> '' THEN
                SELECT p.id INTO v_proj_id
                FROM public.projects p
                WHERE lower(p.slug) = lower(v_slug)
                LIMIT 1;
            END IF;
        END IF;

        -- Ensure resolved project_id exists in public.projects
        IF v_proj_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.projects WHERE id = v_proj_id) THEN
            RAISE NOTICE 'Skipping media record %: project reference "%" not found in public.projects.', r.id, COALESCE(v_raw_proj_id, '<null>');
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END IF;

        -- 3. Validate persistent media URL
        IF r.public_url IS NULL OR NOT (r.public_url ~* '^https?://.+') THEN
            RAISE NOTICE 'Skipping media record %: invalid or non-persistent public_url.', r.id;
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END IF;

        -- 4. Parse display_order with 32-bit integer overflow protection
        v_raw_order := trim(v_meta->>'display_order');
        IF v_raw_order IS NOT NULL AND v_raw_order ~ '^-?[0-9]+$' THEN
            -- Check bounds: -2,147,483,648 to 2,147,483,647
            IF length(v_raw_order) > 11 OR (v_raw_order::numeric < -2147483648 OR v_raw_order::numeric > 2147483647) THEN
                RAISE NOTICE 'Record %: display_order "%" exceeds 32-bit INTEGER bounds. Defaulting to 0.', r.id, v_raw_order;
                v_display_order := 0;
            ELSE
                v_display_order := v_raw_order::integer;
            END IF;
        ELSE
            IF v_raw_order IS NOT NULL AND v_raw_order <> '' THEN
                RAISE NOTICE 'Record %: display_order "%" is not a valid integer. Defaulting to 0.', r.id, v_raw_order;
            END IF;
            v_display_order := 0;
        END IF;

        -- 5. Parse booleans safely
        v_raw_featured := lower(trim(COALESCE(v_meta->>'is_featured', 'false')));
        v_is_featured := (v_raw_featured IN ('true', 't', '1', 'yes'));

        v_raw_published := lower(trim(COALESCE(v_meta->>'is_published', 'true')));
        v_is_published := (v_raw_published IN ('true', 't', '1', 'yes'));

        -- 6. Derive media_type safely
        IF r.media_type LIKE '%video%' OR r.file_path ~* '\.(mp4|webm|mov)$' THEN
            v_media_type := 'video';
        ELSE
            v_media_type := 'image';
        END IF;

        -- 7. Extract caption & alt_text
        v_caption := COALESCE(NULLIF(trim(v_meta->>'caption'), ''), r.file_name, '');

        -- 8. Idempotent Insert (DO NOTHING on conflict: never overwrites existing target records or admin edits)
        INSERT INTO public.project_media (
            id,
            project_id,
            media_type,
            media_url,
            caption,
            display_order,
            is_featured,
            is_published,
            alt_text,
            created_at,
            updated_at
        )
        VALUES (
            r.id,
            v_proj_id,
            v_media_type,
            r.public_url,
            v_caption,
            v_display_order,
            v_is_featured,
            v_is_published,
            COALESCE(NULLIF(trim(v_meta->>'alt_text'), ''), v_caption),
            COALESCE(r.created_at, now()),
            COALESCE(r.created_at, now())
        )
        ON CONFLICT (id) DO NOTHING;

        IF FOUND THEN
            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'project_media backfill finished: % new records inserted, % skipped.', v_inserted_count, v_skipped_count;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Reload PostgREST Schema Cache
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
