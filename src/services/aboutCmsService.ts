import { supabase } from '../lib/supabase';
import {
  AboutContent,
  AboutEducationBadge,
  AboutHighlightItem,
  AboutInterestItem,
  AboutProfileCard,
  AboutVisualSettings,
} from '../types';
import { ABOUT_CONTENT } from '../data/siteContent';

// =============================================================================
// CONSTANTS & AUTHORITATIVE DEFAULTS
// =============================================================================

export const DEFAULT_ABOUT_VISUAL_SETTINGS: AboutVisualSettings = {
  showPortrait: true,
  showEducationBadge: true,
  showSignature: true,
  showInterestTags: true,
  showHighlights: true,
  showSectionDivider: false,
  showProfileCard: true,
  showCosmicDecor: true,
  portraitScale: 1,
  portraitFit: 'cover',
  portraitPosition: '50% 15%',
  cardSpacing: 'balanced',
  cardRadius: 'xl',
  glowIntensity: 'medium',
};

export const DEFAULT_ABOUT_INTERESTS: AboutInterestItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    title: 'AI/ML',
    iconName: 'BrainCircuit',
    description: 'Artificial intelligence and machine learning systems',
    displayOrder: 1,
    isVisible: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    title: 'Cloud',
    iconName: 'Cloud',
    description: 'Scalable cloud infrastructure and deployment workflows',
    displayOrder: 2,
    isVisible: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    title: 'Cybersecurity',
    iconName: 'ShieldCheck',
    description: 'Secure software systems and defensive computing',
    displayOrder: 3,
    isVisible: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    title: 'Automation',
    iconName: 'Workflow',
    description: 'Automated developer pipelines and intelligent tooling',
    displayOrder: 4,
    isVisible: true,
  },
];

export const DEFAULT_ABOUT_HIGHLIGHTS: AboutHighlightItem[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    title: 'Python / Programming',
    supportingText: '',
    iconName: 'Terminal',
    description: 'Software architecture, algorithms, and systems scripting',
    displayOrder: 1,
    isVisible: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    title: 'Content Creation & YouTube',
    supportingText: '',
    iconName: 'Youtube',
    description: 'Explaining engineering concepts through visual storytelling',
    displayOrder: 2,
    isVisible: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    title: 'Freelancing & Business',
    supportingText: '',
    iconName: 'Briefcase',
    description: 'Building useful digital solutions and venture exploration',
    displayOrder: 3,
    isVisible: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    title: 'Innovation',
    supportingText: '',
    iconName: 'Lightbulb',
    description: 'Combining hardware, AI, and code into practical builds',
    displayOrder: 4,
    isVisible: true,
  },
];

export interface AboutCmsDraftPayload {
  header: {
    sectionLabel: string;
    heading: string;
    headingAccent: string;
    subtitle: string;
    showDivider: boolean;
  };
  portrait: {
    imageUrl: string;
    altText: string;
    focalPoint: string;
    fit: 'cover' | 'contain';
    scale: number;
  };
  educationBadge: AboutEducationBadge;
  profileCard: AboutProfileCard;
  interests: AboutInterestItem[];
  highlights: AboutHighlightItem[];
  visualSettings: AboutVisualSettings;
  legacyMeta?: {
    quote: string;
    biographyParagraphs: string[];
  };
}

export interface AboutCmsAdminState {
  draft: AboutCmsDraftPayload;
  published: AboutCmsDraftPayload | null;
  isPublished: boolean;
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
  schemaNeedsMigration: boolean;
  diagnosticNote?: string;
}

export const DEFAULT_ABOUT_CMS_DRAFT: AboutCmsDraftPayload = {
  header: {
    sectionLabel: ABOUT_CONTENT.badge,
    heading: 'ABOUT',
    headingAccent: 'ME',
    subtitle: 'Curious by default. Building by choice.',
    showDivider: false,
  },
  portrait: {
    imageUrl: ABOUT_CONTENT.photo || '/images/afrid-about.jpg',
    altText: 'Afrid Ahmed',
    focalPoint: '50% 15%',
    fit: 'cover',
    scale: 1,
  },
  educationBadge: {
    institution: 'SLIIT',
    program: 'CS',
    graduationYear: 'Class of 2030',
    iconName: 'GraduationCap',
    supportingText: '',
  },
  profileCard: {
    fullName: 'Afrid',
    nameAccent: 'Ahmed',
    academicRole: 'SLIIT Undergraduate',
    degreeProgram: 'BSc (Hons) in Computer Science',
    institution: 'SLIIT',
    introduction: ABOUT_CONTENT.biography[0],
    signatureImageUrl: '',
  },
  interests: DEFAULT_ABOUT_INTERESTS.map((item) => ({ ...item })),
  highlights: DEFAULT_ABOUT_HIGHLIGHTS.map((item) => ({ ...item })),
  visualSettings: { ...DEFAULT_ABOUT_VISUAL_SETTINGS },
  legacyMeta: {
    quote: ABOUT_CONTENT.quote,
    biographyParagraphs: [...ABOUT_CONTENT.biography],
  },
};

// =============================================================================
// SQL MIGRATION SCRIPT (Exposed to Admin UI when schema needs upgrade)
// =============================================================================

export const ABOUT_CMS_SQL_SCHEMA = `-- Run this idempotent migration in your Supabase SQL Editor
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

ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published about_content" ON public.about_content;
DROP POLICY IF EXISTS "Admins can manage about_content" ON public.about_content;
CREATE POLICY "Public can view published about_content" ON public.about_content FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage about_content" ON public.about_content FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view published about_interests" ON public.about_interests;
DROP POLICY IF EXISTS "Admins can manage about_interests" ON public.about_interests;
CREATE POLICY "Public can view published about_interests" ON public.about_interests FOR SELECT
  USING (is_published = true AND is_visible = true);
CREATE POLICY "Admins can manage about_interests" ON public.about_interests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view published about_highlights" ON public.about_highlights;
DROP POLICY IF EXISTS "Admins can manage about_highlights" ON public.about_highlights;
CREATE POLICY "Public can view published about_highlights" ON public.about_highlights FOR SELECT
  USING (is_published = true AND is_visible = true);
CREATE POLICY "Admins can manage about_highlights" ON public.about_highlights FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage about_drafts" ON public.about_drafts;
CREATE POLICY "Admins can manage about_drafts" ON public.about_drafts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_public_about_bundle()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_about public.about_content%ROWTYPE; v_interests JSONB; v_highlights JSONB;
BEGIN
  SELECT * INTO v_about FROM public.about_content WHERE id = 'global' LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('seeded', false, 'is_published', true, 'about', null, 'interests', '[]'::jsonb, 'highlights', '[]'::jsonb); END IF;
  IF COALESCE(v_about.is_published, true) = false THEN RETURN jsonb_build_object('seeded', true, 'is_published', false, 'about', null, 'interests', '[]'::jsonb, 'highlights', '[]'::jsonb); END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', i.id, 'title', i.title, 'icon_name', i.icon_name, 'description', COALESCE(i.description, ''), 'display_order', i.display_order, 'is_visible', i.is_visible) ORDER BY i.display_order ASC), '[]'::jsonb) INTO v_interests FROM public.about_interests i WHERE i.about_id = 'global' AND i.is_published = true AND i.is_visible = true;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', h.id, 'title', h.title, 'supporting_text', COALESCE(h.supporting_text, ''), 'icon_name', h.icon_name, 'description', COALESCE(h.description, ''), 'display_order', h.display_order, 'is_visible', h.is_visible) ORDER BY h.display_order ASC), '[]'::jsonb) INTO v_highlights FROM public.about_highlights h WHERE h.about_id = 'global' AND h.is_published = true AND h.is_visible = true;
  RETURN jsonb_build_object('seeded', true, 'is_published', true, 'about', to_jsonb(v_about), 'interests', v_interests, 'highlights', v_highlights);
END; $$;
REVOKE ALL ON FUNCTION public.get_public_about_bundle() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_about_bundle() TO anon, authenticated;`;

// =============================================================================
// HELPERS & SANITIZATION
// =============================================================================

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeAboutUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return '';

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return '';

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
}

function clampScale(val: unknown): number {
  const num = Number(val);
  if (Number.isNaN(num)) return 1;
  return Math.min(1.15, Math.max(0.85, Math.round(num * 100) / 100));
}

function parseBioArray(rawBio: unknown): string[] {
  if (Array.isArray(rawBio)) {
    const clean = rawBio.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim());
    return clean.length > 0 ? clean : [...ABOUT_CONTENT.biography];
  }
  if (typeof rawBio === 'string') {
    const trimmed = rawBio.trim();
    if (!trimmed) return [...ABOUT_CONTENT.biography];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim());
        if (clean.length > 0) return clean;
      }
    } catch {
      // plain string
    }
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
      return [trimmed];
    }
  }
  return [...ABOUT_CONTENT.biography];
}

function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the')
  );
}

function normalizeVisualSettings(raw: unknown, row?: Record<string, any> | null): AboutVisualSettings {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const fit = obj.portraitFit === 'contain' || row?.portrait_fit === 'contain' ? 'contain' : 'cover';
  const spacing =
    obj.cardSpacing === 'compact' || obj.cardSpacing === 'relaxed' ? obj.cardSpacing : 'balanced';
  const radius = obj.cardRadius === 'lg' || obj.cardRadius === '2xl' ? obj.cardRadius : 'xl';
  const glow = obj.glowIntensity === 'subtle' || obj.glowIntensity === 'vivid' ? obj.glowIntensity : 'medium';

  return {
    showPortrait: typeof obj.showPortrait === 'boolean' ? obj.showPortrait : true,
    showEducationBadge: typeof obj.showEducationBadge === 'boolean' ? obj.showEducationBadge : true,
    showSignature: typeof obj.showSignature === 'boolean' ? obj.showSignature : true,
    showInterestTags: typeof obj.showInterestTags === 'boolean' ? obj.showInterestTags : true,
    showHighlights: typeof obj.showHighlights === 'boolean' ? obj.showHighlights : true,
    showSectionDivider:
      typeof obj.showSectionDivider === 'boolean'
        ? obj.showSectionDivider
        : Boolean(row?.show_section_divider),
    showProfileCard: typeof obj.showProfileCard === 'boolean' ? obj.showProfileCard : true,
    showCosmicDecor: typeof obj.showCosmicDecor === 'boolean' ? obj.showCosmicDecor : true,
    portraitScale: clampScale(obj.portraitScale ?? row?.portrait_scale ?? 1),
    portraitFit: fit,
    portraitPosition:
      typeof obj.portraitPosition === 'string' && obj.portraitPosition.trim()
        ? obj.portraitPosition.trim()
        : typeof row?.portrait_focal_point === 'string' && row.portrait_focal_point.trim()
        ? row.portrait_focal_point.trim()
        : '50% 15%',
    cardSpacing: spacing,
    cardRadius: radius,
    glowIntensity: glow,
  };
}

function mapInterestsRows(rows: unknown): AboutInterestItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === 'object'))
    .map((r, idx) => ({
      id: typeof r.id === 'string' && r.id ? r.id : generateUuid(),
      title: typeof r.title === 'string' && r.title.trim() ? r.title.trim() : 'Interest',
      iconName: typeof r.icon_name === 'string' && r.icon_name
        ? r.icon_name
        : typeof r.iconName === 'string' && r.iconName
        ? r.iconName
        : 'BrainCircuit',
      description: typeof r.description === 'string' ? r.description : '',
      displayOrder:
        typeof r.display_order === 'number'
          ? r.display_order
          : typeof r.displayOrder === 'number'
          ? r.displayOrder
          : idx + 1,
      isVisible:
        typeof r.is_visible === 'boolean'
          ? r.is_visible
          : typeof r.isVisible === 'boolean'
          ? r.isVisible
          : true,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function mapHighlightsRows(rows: unknown): AboutHighlightItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === 'object'))
    .map((r, idx) => ({
      id: typeof r.id === 'string' && r.id ? r.id : generateUuid(),
      title: typeof r.title === 'string' && r.title.trim() ? r.title.trim() : 'Highlight',
      supportingText:
        typeof r.supporting_text === 'string'
          ? r.supporting_text
          : typeof r.supportingText === 'string'
          ? r.supportingText
          : '',
      iconName: typeof r.icon_name === 'string' && r.icon_name
        ? r.icon_name
        : typeof r.iconName === 'string' && r.iconName
        ? r.iconName
        : 'Terminal',
      description: typeof r.description === 'string' ? r.description : '',
      displayOrder:
        typeof r.display_order === 'number'
          ? r.display_order
          : typeof r.displayOrder === 'number'
          ? r.displayOrder
          : idx + 1,
      isVisible:
        typeof r.is_visible === 'boolean'
          ? r.is_visible
          : typeof r.isVisible === 'boolean'
          ? r.isVisible
          : true,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function normalizeDraftPayload(raw: unknown): AboutCmsDraftPayload {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT));
  }
  const obj = raw as Record<string, any>;
  const headerObj = obj.header || {};
  const portraitObj = obj.portrait || {};
  const badgeObj = obj.educationBadge || {};
  const cardObj = obj.profileCard || {};
  const visual = normalizeVisualSettings(obj.visualSettings, null);

  return {
    header: {
      sectionLabel:
        typeof headerObj.sectionLabel === 'string'
          ? headerObj.sectionLabel
          : DEFAULT_ABOUT_CMS_DRAFT.header.sectionLabel,
      heading:
        typeof headerObj.heading === 'string'
          ? headerObj.heading
          : DEFAULT_ABOUT_CMS_DRAFT.header.heading,
      headingAccent:
        typeof headerObj.headingAccent === 'string'
          ? headerObj.headingAccent
          : DEFAULT_ABOUT_CMS_DRAFT.header.headingAccent,
      subtitle:
        typeof headerObj.subtitle === 'string'
          ? headerObj.subtitle
          : DEFAULT_ABOUT_CMS_DRAFT.header.subtitle,
      showDivider:
        typeof headerObj.showDivider === 'boolean'
          ? headerObj.showDivider
          : visual.showSectionDivider,
    },
    portrait: {
      imageUrl: sanitizeAboutUrl(portraitObj.imageUrl) || (portraitObj.imageUrl === '' ? '' : DEFAULT_ABOUT_CMS_DRAFT.portrait.imageUrl),
      altText:
        typeof portraitObj.altText === 'string'
          ? portraitObj.altText
          : DEFAULT_ABOUT_CMS_DRAFT.portrait.altText,
      focalPoint:
        typeof portraitObj.focalPoint === 'string' && portraitObj.focalPoint
          ? portraitObj.focalPoint
          : visual.portraitPosition,
      fit: portraitObj.fit === 'contain' ? 'contain' : 'cover',
      scale: clampScale(portraitObj.scale ?? visual.portraitScale),
    },
    educationBadge: {
      institution:
        typeof badgeObj.institution === 'string'
          ? badgeObj.institution
          : DEFAULT_ABOUT_CMS_DRAFT.educationBadge.institution,
      program:
        typeof badgeObj.program === 'string'
          ? badgeObj.program
          : DEFAULT_ABOUT_CMS_DRAFT.educationBadge.program,
      graduationYear:
        typeof badgeObj.graduationYear === 'string'
          ? badgeObj.graduationYear
          : DEFAULT_ABOUT_CMS_DRAFT.educationBadge.graduationYear,
      iconName:
        typeof badgeObj.iconName === 'string' && badgeObj.iconName
          ? badgeObj.iconName
          : DEFAULT_ABOUT_CMS_DRAFT.educationBadge.iconName,
      supportingText:
        typeof badgeObj.supportingText === 'string' ? badgeObj.supportingText : '',
    },
    profileCard: {
      fullName:
        typeof cardObj.fullName === 'string'
          ? cardObj.fullName
          : DEFAULT_ABOUT_CMS_DRAFT.profileCard.fullName,
      nameAccent:
        typeof cardObj.nameAccent === 'string'
          ? cardObj.nameAccent
          : DEFAULT_ABOUT_CMS_DRAFT.profileCard.nameAccent,
      academicRole:
        typeof cardObj.academicRole === 'string'
          ? cardObj.academicRole
          : DEFAULT_ABOUT_CMS_DRAFT.profileCard.academicRole,
      degreeProgram:
        typeof cardObj.degreeProgram === 'string'
          ? cardObj.degreeProgram
          : DEFAULT_ABOUT_CMS_DRAFT.profileCard.degreeProgram,
      institution:
        typeof cardObj.institution === 'string'
          ? cardObj.institution
          : DEFAULT_ABOUT_CMS_DRAFT.profileCard.institution,
      introduction:
        typeof cardObj.introduction === 'string'
          ? cardObj.introduction
          : DEFAULT_ABOUT_CMS_DRAFT.profileCard.introduction,
      signatureImageUrl: sanitizeAboutUrl(cardObj.signatureImageUrl),
    },
    interests: Array.isArray(obj.interests)
      ? mapInterestsRows(obj.interests)
      : DEFAULT_ABOUT_INTERESTS.map((i) => ({ ...i })),
    highlights: Array.isArray(obj.highlights)
      ? mapHighlightsRows(obj.highlights)
      : DEFAULT_ABOUT_HIGHLIGHTS.map((h) => ({ ...h })),
    visualSettings: {
      ...visual,
      portraitFit: portraitObj.fit === 'contain' ? 'contain' : visual.portraitFit,
      portraitPosition:
        typeof portraitObj.focalPoint === 'string' && portraitObj.focalPoint
          ? portraitObj.focalPoint
          : visual.portraitPosition,
      portraitScale: clampScale(portraitObj.scale ?? visual.portraitScale),
      showSectionDivider:
        typeof headerObj.showDivider === 'boolean'
          ? headerObj.showDivider
          : visual.showSectionDivider,
    },
    legacyMeta: obj.legacyMeta || DEFAULT_ABOUT_CMS_DRAFT.legacyMeta,
  };
}

export function buildDraftFromDbRow(
  aboutRow: Record<string, any> | null,
  interestRows?: unknown[] | null,
  highlightRows?: unknown[] | null
): AboutCmsDraftPayload {
  if (!aboutRow) {
    return JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT));
  }

  const bioArr = parseBioArray(aboutRow.bio);
  const visualSettings = normalizeVisualSettings(aboutRow.visual_settings, aboutRow);

  // Extract heading/accent intelligently if legacy row only had "ABOUT AFRID"
  const rawHeading = typeof aboutRow.heading === 'string' && aboutRow.heading.trim()
    ? aboutRow.heading.trim()
    : 'ABOUT';
  const isLegacyDefaultHeading = rawHeading.toUpperCase() === 'ABOUT AFRID';
  const heading = isLegacyDefaultHeading ? 'ABOUT' : rawHeading;
  const headingAccent =
    typeof aboutRow.heading_accent === 'string'
      ? aboutRow.heading_accent
      : isLegacyDefaultHeading
      ? 'ME'
      : '';

  const rawStatement = typeof aboutRow.statement === 'string' ? aboutRow.statement.trim() : '';
  const subtitle =
    typeof aboutRow.subtitle === 'string' && aboutRow.subtitle.trim()
      ? aboutRow.subtitle.trim()
      : rawStatement === 'CURIOUS BY DEFAULT. BUILDING BY CHOICE.' || !rawStatement
      ? 'Curious by default. Building by choice.'
      : rawStatement;

  // Notice: if about_image_url was explicitly cleared to '', preserve '' rather than forcing fallback!
  const portraitUrl =
    aboutRow.about_image_url === ''
      ? ''
      : sanitizeAboutUrl(aboutRow.about_image_url) || DEFAULT_ABOUT_CMS_DRAFT.portrait.imageUrl;

  const interests =
    Array.isArray(interestRows) && interestRows.length > 0
      ? mapInterestsRows(interestRows)
      : interestRows !== undefined && interestRows !== null
      ? [] // Explicit empty list if admin deleted all items in DB
      : DEFAULT_ABOUT_INTERESTS.map((i) => ({ ...i }));

  const highlights =
    Array.isArray(highlightRows) && highlightRows.length > 0
      ? mapHighlightsRows(highlightRows)
      : highlightRows !== undefined && highlightRows !== null
      ? []
      : DEFAULT_ABOUT_HIGHLIGHTS.map((h) => ({ ...h }));

  return {
    header: {
      sectionLabel:
        typeof aboutRow.section_label === 'string' && aboutRow.section_label.trim()
          ? aboutRow.section_label.trim()
          : aboutRow.badge || DEFAULT_ABOUT_CMS_DRAFT.header.sectionLabel,
      heading,
      headingAccent,
      subtitle,
      showDivider:
        typeof aboutRow.show_section_divider === 'boolean'
          ? aboutRow.show_section_divider
          : visualSettings.showSectionDivider,
    },
    portrait: {
      imageUrl: portraitUrl,
      altText:
        typeof aboutRow.portrait_alt === 'string' && aboutRow.portrait_alt.trim()
          ? aboutRow.portrait_alt.trim()
          : 'Afrid Ahmed',
      focalPoint: visualSettings.portraitPosition,
      fit: visualSettings.portraitFit,
      scale: visualSettings.portraitScale,
    },
    educationBadge: {
      institution:
        typeof aboutRow.edu_institution === 'string'
          ? aboutRow.edu_institution
          : 'SLIIT',
      program:
        typeof aboutRow.edu_program === 'string'
          ? aboutRow.edu_program
          : 'CS',
      graduationYear:
        typeof aboutRow.edu_graduation_year === 'string'
          ? aboutRow.edu_graduation_year
          : 'Class of 2030',
      iconName:
        typeof aboutRow.edu_icon === 'string' && aboutRow.edu_icon
          ? aboutRow.edu_icon
          : 'GraduationCap',
      supportingText:
        typeof aboutRow.edu_supporting_text === 'string' ? aboutRow.edu_supporting_text : '',
    },
    profileCard: {
      fullName:
        typeof aboutRow.full_name === 'string' ? aboutRow.full_name : 'Afrid',
      nameAccent:
        typeof aboutRow.name_accent === 'string' ? aboutRow.name_accent : 'Ahmed',
      academicRole:
        typeof aboutRow.academic_role === 'string'
          ? aboutRow.academic_role
          : 'SLIIT Undergraduate',
      degreeProgram:
        typeof aboutRow.degree_program === 'string'
          ? aboutRow.degree_program
          : 'BSc (Hons) in Computer Science',
      institution:
        typeof aboutRow.institution === 'string' ? aboutRow.institution : 'SLIIT',
      introduction:
        typeof aboutRow.intro_text === 'string' && aboutRow.intro_text.trim()
          ? aboutRow.intro_text.trim()
          : bioArr[0] || ABOUT_CONTENT.biography[0],
      signatureImageUrl: sanitizeAboutUrl(aboutRow.signature_image_url),
    },
    interests,
    highlights,
    visualSettings,
    legacyMeta: {
      quote: typeof aboutRow.quote === 'string' && aboutRow.quote ? aboutRow.quote : ABOUT_CONTENT.quote,
      biographyParagraphs: bioArr,
    },
  };
}

export function convertDraftToAboutContent(
  draft: AboutCmsDraftPayload,
  isPublished: boolean = true
): AboutContent {
  const intro = draft.profileCard.introduction.trim();
  const baseBio = draft.legacyMeta?.biographyParagraphs?.length
    ? [...draft.legacyMeta.biographyParagraphs]
    : [...ABOUT_CONTENT.biography];
  if (intro) {
    baseBio[0] = intro;
  }

  return {
    ...ABOUT_CONTENT,
    isPublished,
    badge: draft.header.sectionLabel,
    title: [draft.header.heading, draft.header.headingAccent].filter(Boolean).join(' ').trim(),
    statement: draft.header.subtitle,
    biography: baseBio,
    quote: draft.legacyMeta?.quote || ABOUT_CONTENT.quote,
    graduationTag: draft.educationBadge.graduationYear,
    photo: draft.portrait.imageUrl,
    portraitAlt: draft.portrait.altText || `${draft.profileCard.fullName} ${draft.profileCard.nameAccent}`.trim(),
    photoCaption: {
      ...ABOUT_CONTENT.photoCaption,
      name: `${draft.profileCard.fullName} ${draft.profileCard.nameAccent}`.trim() || 'Afrid Ahmed',
      role: draft.profileCard.academicRole,
      classYear: draft.educationBadge.graduationYear,
    },
    sectionLabel: draft.header.sectionLabel,
    heading: draft.header.heading,
    headingAccent: draft.header.headingAccent,
    subtitle: draft.header.subtitle,
    educationBadge: { ...draft.educationBadge },
    profileCard: { ...draft.profileCard },
    interests: draft.interests.map((item) => ({ ...item })),
    highlights: draft.highlights.map((item) => ({ ...item })),
    visualSettings: {
      ...draft.visualSettings,
      showSectionDivider: draft.header.showDivider,
      portraitFit: draft.portrait.fit,
      portraitPosition: draft.portrait.focalPoint,
      portraitScale: draft.portrait.scale,
    },
  };
}

// =============================================================================
// AUTHORIZATION GUARD
// =============================================================================

async function verifyAdminAccess(): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  try {
    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userRes?.user) {
      return { authorized: false, error: 'Authentication required. Please sign in to the Admin CMS.' };
    }

    const userId = userRes.user.id;
    const { data: adminRecord, error: adminErr } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!adminErr && adminRecord?.user_id === userId) {
      return { authorized: true, userId };
    }

    // Fallback check against RLS-protected site_settings (matches AdminAuthContext)
    const { data: fallbackCheck, error: fallbackErr } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1);

    if (!fallbackErr && Array.isArray(fallbackCheck)) {
      return { authorized: true, userId };
    }

    return { authorized: false, error: 'Unauthorized: Account lacks administrator privileges.' };
  } catch (err: any) {
    return { authorized: false, error: err?.message || 'Admin authorization check failed.' };
  }
}

// =============================================================================
// ADMIN CMS CRUD & DRAFT/PUBLISH OPERATIONS
// =============================================================================

export async function getAdminAboutCmsState(): Promise<{
  data: AboutCmsAdminState;
  error?: string;
}> {
  const defaultState: AboutCmsAdminState = {
    draft: JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT)),
    published: null,
    isPublished: true,
    hasUnpublishedChanges: false,
    publishedAt: null,
    updatedAt: null,
    schemaNeedsMigration: false,
  };

  try {
    const [aboutRes, interestsRes, highlightsRes, draftRes] = await Promise.all([
      supabase.from('about_content').select('*').eq('id', 'global').maybeSingle(),
      supabase.from('about_interests').select('*').eq('about_id', 'global').order('display_order', { ascending: true }),
      supabase.from('about_highlights').select('*').eq('about_id', 'global').order('display_order', { ascending: true }),
      supabase.from('about_drafts').select('*').eq('id', 'global').maybeSingle(),
    ]);

    const schemaNeedsMigration =
      isMissingSchemaError(interestsRes.error) ||
      isMissingSchemaError(highlightsRes.error) ||
      isMissingSchemaError(draftRes.error) ||
      (aboutRes.data ? !('visual_settings' in aboutRes.data) : false);

    if (aboutRes.error && !isMissingSchemaError(aboutRes.error)) {
      return {
        data: { ...defaultState, schemaNeedsMigration },
        error: aboutRes.error.message,
      };
    }

    const aboutRow = aboutRes.data as Record<string, any> | null;
    const interestRows = interestsRes.error ? null : (interestsRes.data as unknown[]);
    const highlightRows = highlightsRes.error ? null : (highlightsRes.data as unknown[]);

    const publishedPayload = aboutRow
      ? buildDraftFromDbRow(aboutRow, interestRows, highlightRows)
      : null;

    const draftRow = !draftRes.error ? (draftRes.data as Record<string, any> | null) : null;
    const activeDraft = draftRow?.draft_payload
      ? normalizeDraftPayload(draftRow.draft_payload)
      : publishedPayload
      ? JSON.parse(JSON.stringify(publishedPayload))
      : JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT));

    return {
      data: {
        draft: activeDraft,
        published: publishedPayload,
        isPublished: aboutRow ? aboutRow.is_published !== false : true,
        hasUnpublishedChanges: Boolean(draftRow?.has_unpublished_changes),
        publishedAt: aboutRow?.published_at || null,
        updatedAt: draftRow?.updated_at || aboutRow?.updated_at || null,
        schemaNeedsMigration,
      },
    };
  } catch (err: any) {
    return {
      data: defaultState,
      error: err?.message || 'Failed to load About CMS state.',
    };
  }
}

export async function saveAboutDraft(
  draft: AboutCmsDraftPayload
): Promise<{ success: boolean; error?: string; schemaNeedsMigration?: boolean }> {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const sanitizedDraft = normalizeDraftPayload(draft);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('about_drafts')
      .upsert(
        {
          id: 'global',
          draft_payload: sanitizedDraft,
          has_unpublished_changes: true,
          updated_by: auth.userId || null,
          updated_at: nowIso,
        },
        { onConflict: 'id' }
      );

    if (error) {
      if (isMissingSchemaError(error)) {
        return {
          success: false,
          schemaNeedsMigration: true,
          error: 'Database migration required: please run the About CMS SQL migration in Supabase SQL Editor to enable drafts.',
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save draft.' };
  }
}

export async function publishAboutCms(
  draft: AboutCmsDraftPayload
): Promise<{ success: boolean; error?: string; schemaNeedsMigration?: boolean }> {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const clean = normalizeDraftPayload(draft);
    const nowIso = new Date().toISOString();

    const intro = clean.profileCard.introduction.trim();
    const bioParagraphs = [...(clean.legacyMeta?.biographyParagraphs || ABOUT_CONTENT.biography)];
    if (intro) {
      bioParagraphs[0] = intro;
    }

    // 1. Upsert published about_content row (extended + legacy fields synchronized)
    const aboutUpsertPayload = {
      id: 'global',
      heading: clean.header.heading.trim() || 'ABOUT',
      heading_accent: clean.header.headingAccent.trim(),
      section_label: clean.header.sectionLabel.trim(),
      subtitle: clean.header.subtitle.trim(),
      show_section_divider: clean.header.showDivider,
      badge: clean.header.sectionLabel.trim() || ABOUT_CONTENT.badge,
      statement: clean.header.subtitle.trim() || ABOUT_CONTENT.statement,
      bio: JSON.stringify(bioParagraphs),
      quote: clean.legacyMeta?.quote || ABOUT_CONTENT.quote,
      graduation_tag: clean.educationBadge.graduationYear.trim() || ABOUT_CONTENT.graduationTag,
      photo_caption_role: clean.profileCard.academicRole.trim() || ABOUT_CONTENT.photoCaption.role,
      about_image_url: clean.portrait.imageUrl,
      portrait_alt: clean.portrait.altText.trim() || 'Afrid Ahmed',
      portrait_focal_point: clean.portrait.focalPoint,
      portrait_fit: clean.portrait.fit,
      portrait_scale: clean.portrait.scale,
      edu_institution: clean.educationBadge.institution.trim(),
      edu_program: clean.educationBadge.program.trim(),
      edu_graduation_year: clean.educationBadge.graduationYear.trim(),
      edu_icon: clean.educationBadge.iconName,
      edu_supporting_text: (clean.educationBadge.supportingText || '').trim(),
      full_name: clean.profileCard.fullName.trim(),
      name_accent: clean.profileCard.nameAccent.trim(),
      academic_role: clean.profileCard.academicRole.trim(),
      degree_program: clean.profileCard.degreeProgram.trim(),
      institution: clean.profileCard.institution.trim(),
      intro_text: intro,
      signature_image_url: clean.profileCard.signatureImageUrl,
      visual_settings: clean.visualSettings,
      is_published: true,
      published_at: nowIso,
      updated_at: nowIso,
    };

    const { error: aboutError } = await supabase
      .from('about_content')
      .upsert(aboutUpsertPayload, { onConflict: 'id' });

    if (aboutError) {
      if (isMissingSchemaError(aboutError)) {
        return {
          success: false,
          schemaNeedsMigration: true,
          error: 'Database columns missing: please run the About CMS SQL migration in Supabase SQL Editor before publishing.',
        };
      }
      return { success: false, error: `Failed to publish About settings: ${aboutError.message}` };
    }

    // 2. Sync normalized about_interests rows (upsert current + delete removed)
    const normalizedInterests = clean.interests.map((item, idx) => ({
      id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
        ? item.id
        : generateUuid(),
      about_id: 'global',
      title: item.title.trim(),
      icon_name: item.iconName || 'BrainCircuit',
      description: (item.description || '').trim(),
      display_order: idx + 1,
      is_visible: item.isVisible !== false,
      is_published: true,
      updated_at: nowIso,
    }));

    const { data: existingInterests } = await supabase
      .from('about_interests')
      .select('id')
      .eq('about_id', 'global');

    const keepInterestIds = new Set(normalizedInterests.map((i) => i.id));
    const interestIdsToDelete = (existingInterests || [])
      .map((r: any) => r.id)
      .filter((id: string) => !keepInterestIds.has(id));

    if (interestIdsToDelete.length > 0) {
      const { error: delIntErr } = await supabase
        .from('about_interests')
        .delete()
        .in('id', interestIdsToDelete);
      if (delIntErr) {
        return { success: false, error: `Failed updating interests: ${delIntErr.message}` };
      }
    }

    if (normalizedInterests.length > 0) {
      const { error: upsertIntErr } = await supabase
        .from('about_interests')
        .upsert(normalizedInterests, { onConflict: 'id' });
      if (upsertIntErr) {
        return { success: false, error: `Failed saving interests: ${upsertIntErr.message}` };
      }
    }

    // 3. Sync normalized about_highlights rows
    const normalizedHighlights = clean.highlights.map((item, idx) => ({
      id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
        ? item.id
        : generateUuid(),
      about_id: 'global',
      title: item.title.trim(),
      supporting_text: (item.supportingText || '').trim(),
      icon_name: item.iconName || 'Terminal',
      description: (item.description || '').trim(),
      display_order: idx + 1,
      is_visible: item.isVisible !== false,
      is_published: true,
      updated_at: nowIso,
    }));

    const { data: existingHighlights } = await supabase
      .from('about_highlights')
      .select('id')
      .eq('about_id', 'global');

    const keepHighlightIds = new Set(normalizedHighlights.map((h) => h.id));
    const highlightIdsToDelete = (existingHighlights || [])
      .map((r: any) => r.id)
      .filter((id: string) => !keepHighlightIds.has(id));

    if (highlightIdsToDelete.length > 0) {
      const { error: delHighErr } = await supabase
        .from('about_highlights')
        .delete()
        .in('id', highlightIdsToDelete);
      if (delHighErr) {
        return { success: false, error: `Failed updating highlights: ${delHighErr.message}` };
      }
    }

    if (normalizedHighlights.length > 0) {
      const { error: upsertHighErr } = await supabase
        .from('about_highlights')
        .upsert(normalizedHighlights, { onConflict: 'id' });
      if (upsertHighErr) {
        return { success: false, error: `Failed saving highlights: ${upsertHighErr.message}` };
      }
    }

    // 4. Sync synced draft record with has_unpublished_changes = false
    const syncedDraft: AboutCmsDraftPayload = {
      ...clean,
      interests: normalizedInterests.map((i) => ({
        id: i.id,
        title: i.title,
        iconName: i.icon_name,
        description: i.description,
        displayOrder: i.display_order,
        isVisible: i.is_visible,
      })),
      highlights: normalizedHighlights.map((h) => ({
        id: h.id,
        title: h.title,
        supportingText: h.supporting_text,
        iconName: h.icon_name,
        description: h.description,
        displayOrder: h.display_order,
        isVisible: h.is_visible,
      })),
    };

    await supabase.from('about_drafts').upsert(
      {
        id: 'global',
        draft_payload: syncedDraft,
        has_unpublished_changes: false,
        updated_by: auth.userId || null,
        updated_at: nowIso,
      },
      { onConflict: 'id' }
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unexpected error while publishing About section.' };
  }
}

export async function unpublishAboutSection(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const { error } = await supabase
      .from('about_content')
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .eq('id', 'global');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to unpublish About section.' };
  }
}

export async function discardAboutDraft(
  publishedSnapshot: AboutCmsDraftPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const clean = normalizeDraftPayload(publishedSnapshot);
    const { error } = await supabase.from('about_drafts').upsert(
      {
        id: 'global',
        draft_payload: clean,
        has_unpublished_changes: false,
        updated_by: auth.userId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error && !isMissingSchemaError(error)) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to discard draft.' };
  }
}

// =============================================================================
// PUBLIC READ LOADER (With fallback resilience & unpublished gate)
// =============================================================================

export async function fetchPublicAboutCmsContent(): Promise<AboutContent> {
  const defaultPublished = convertDraftToAboutContent(DEFAULT_ABOUT_CMS_DRAFT, true);

  try {
    // 1. Prefer the SECURITY DEFINER public bundle RPC (cleanly distinguishes unpublished vs unseeded)
    const { data: bundleData, error: rpcError } = await supabase.rpc('get_public_about_bundle');

    if (!rpcError && bundleData && typeof bundleData === 'object') {
      const bundle = bundleData as {
        seeded?: boolean;
        is_published?: boolean;
        about?: Record<string, any> | null;
        interests?: unknown[];
        highlights?: unknown[];
      };

      if (bundle.seeded && bundle.is_published === false) {
        return { ...defaultPublished, isPublished: false };
      }

      if (!bundle.seeded || !bundle.about) {
        return defaultPublished;
      }

      const structured = buildDraftFromDbRow(
        bundle.about,
        Array.isArray(bundle.interests) ? bundle.interests : [],
        Array.isArray(bundle.highlights) ? bundle.highlights : []
      );
      return convertDraftToAboutContent(structured, true);
    }

    // 2. Fallback: Direct table reads (supports older schemas before RPC is applied)
    const [aboutRes, interestsRes, highlightsRes] = await Promise.all([
      supabase.from('about_content').select('*').eq('id', 'global').maybeSingle(),
      supabase
        .from('about_interests')
        .select('*')
        .eq('about_id', 'global')
        .eq('is_published', true)
        .eq('is_visible', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('about_highlights')
        .select('*')
        .eq('about_id', 'global')
        .eq('is_published', true)
        .eq('is_visible', true)
        .order('display_order', { ascending: true }),
    ]);

    if (aboutRes.error || !aboutRes.data) {
      return defaultPublished;
    }

    const row = aboutRes.data as Record<string, any>;
    if (row.is_published === false) {
      return { ...defaultPublished, isPublished: false };
    }

    const interestRows = !interestsRes.error && Array.isArray(interestsRes.data) ? interestsRes.data : undefined;
    const highlightRows = !highlightsRes.error && Array.isArray(highlightsRes.data) ? highlightsRes.data : undefined;

    const structured = buildDraftFromDbRow(row, interestRows, highlightRows);
    return convertDraftToAboutContent(structured, true);
  } catch (err) {
    console.warn('Public About CMS fetch note (using safe defaults):', err);
    return defaultPublished;
  }
}
