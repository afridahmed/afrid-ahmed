import { supabase } from '../lib/supabase';
import { 
  HeroContent, 
  AboutContent, 
  SiteInfo, 
  SocialLink,
  TechStackGroup 
} from '../types';
import { 
  HERO_CONTENT, 
  ABOUT_CONTENT, 
  SITE_INFO, 
  SOCIAL_LINKS 
} from '../data/siteContent';

// Re-export project services from projectService
export * from './projectService';
// Re-export creator video services from creatorVideoService
export * from './creatorVideoService';
// Re-export journey services from journeyService
export * from './journeyService';
// Re-export media services from mediaService
export * from './mediaService';

// =============================================================================
// DATABASE RECORD INTERFACES (Mapped to Supabase schema)
// =============================================================================

export interface DbHeroContent {
  id: string; // 'global'
  name: string;
  identity: string;
  rotating_phrases: string[];
  tagline: string;
  description: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  hero_image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbAboutRow {
  id: string; // 'global'
  heading?: string | null;
  statement?: string | null;
  bio?: string | null; // Supabase TEXT column storing JSON string
  about_image_url?: string | null;
  skills?: unknown;
  pillars?: string[] | Record<string, unknown> | null;
  quote?: string | null;
  badge?: string | null;
  graduation_tag?: string | null;
  photo_caption_role?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbAboutContent {
  id: string; // 'global'
  heading: string;
  statement: string;
  biography: string[];
  bio?: string[];
  about_image_url: string;
  skills: TechStackGroup[];
  pillars?: string[] | Record<string, unknown>;
  quote: string;
  badge: string;
  graduation_tag: string;
  photo_caption_role: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbSiteSettings {
  id: string; // 'global'
  site_title: string;
  owner_name: string;
  primary_email: string;
  github_url: string;
  linkedin_url: string;
  youtube_url: string;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// DEFAULT INITIALIZATION HELPERS (Based on authoritative static content)
// =============================================================================

export const DEFAULT_DB_HERO: DbHeroContent = {
  id: 'global',
  name: HERO_CONTENT.name,
  identity: HERO_CONTENT.degreeTrack || 'COMPUTER SCIENCE',
  rotating_phrases: [...HERO_CONTENT.rotatingStatements],
  tagline: HERO_CONTENT.tagline,
  description: HERO_CONTENT.description,
  primary_cta_label: HERO_CONTENT.primaryLinkText,
  primary_cta_url: '#projects',
  secondary_cta_label: HERO_CONTENT.secondaryLinkText,
  secondary_cta_url: '#contact',
  hero_image_url: HERO_CONTENT.photo || '/images/afrid-hero.jpg',
};

export const DEFAULT_DB_ABOUT: DbAboutContent = {
  id: 'global',
  heading: ABOUT_CONTENT.title,
  statement: ABOUT_CONTENT.statement,
  biography: [...ABOUT_CONTENT.biography],
  bio: [...ABOUT_CONTENT.biography],
  about_image_url: ABOUT_CONTENT.photo || '/images/afrid-about.jpg',
  skills: JSON.parse(JSON.stringify(ABOUT_CONTENT.techStack)),
  quote: ABOUT_CONTENT.quote,
  badge: ABOUT_CONTENT.badge,
  graduation_tag: ABOUT_CONTENT.graduationTag,
  photo_caption_role: ABOUT_CONTENT.photoCaption.role,
};

export const DEFAULT_DB_SETTINGS: DbSiteSettings = {
  id: 'global',
  site_title: `${SITE_INFO.fullName} · Portfolio`,
  owner_name: SITE_INFO.fullName,
  primary_email: SITE_INFO.email,
  github_url: 'https://github.com/afridaskar',
  linkedin_url: 'https://linkedin.com',
  youtube_url: 'https://youtube.com',
};

// =============================================================================
// PUBLIC FRONTEND MAPPERS (With safe static fallback)
// =============================================================================

export function mapDbToHeroContent(db: DbHeroContent | null): HeroContent {
  if (!db) return HERO_CONTENT;
  return {
    badge: HERO_CONTENT.badge,
    degreeTrack: db.identity || HERO_CONTENT.degreeTrack,
    graduationLabel: HERO_CONTENT.graduationLabel,
    tagline: db.tagline || HERO_CONTENT.tagline,
    name: db.name || HERO_CONTENT.name,
    category: HERO_CONTENT.category,
    rotatingStatements: Array.isArray(db.rotating_phrases) && db.rotating_phrases.length > 0 
      ? db.rotating_phrases 
      : HERO_CONTENT.rotatingStatements,
    description: db.description || HERO_CONTENT.description,
    primaryLinkText: db.primary_cta_label || HERO_CONTENT.primaryLinkText,
    secondaryLinkText: db.secondary_cta_label || HERO_CONTENT.secondaryLinkText,
    aboutLinkText: HERO_CONTENT.aboutLinkText,
    photo: db.hero_image_url || HERO_CONTENT.photo,
    scrollPromptText: HERO_CONTENT.scrollPromptText,
  };
}

function tryParseJson(val: unknown): unknown {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return val;
      }
    }
  }
  return val;
}

function cleanSkillItem(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    const parsed = tryParseJson(val);
    if (parsed !== val) {
      return cleanSkillItem(parsed);
    }
    const trimmed = val.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed === '[object Object]') {
      return '';
    }
    return trimmed;
  }
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(cleanSkillItem).filter(Boolean).join(', ');
    }
    const obj = val as Record<string, unknown>;
    const label = obj.name || obj.skill || obj.title || obj.label;
    return typeof label === 'string' ? label : '';
  }
  return String(val).trim();
}

function cleanCategory(val: unknown): string {
  if (val === null || val === undefined) return 'Technical Proficiencies';
  if (typeof val === 'string') {
    const parsed = tryParseJson(val);
    if (parsed !== val) {
      return cleanCategory(parsed);
    }
    const trimmed = val.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed === '[object Object]') {
      return 'Technical Proficiencies';
    }
    return trimmed || 'Technical Proficiencies';
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const cat = obj.category || obj.name || obj.title;
    return typeof cat === 'string' && cat.trim() ? cat.trim() : 'Technical Proficiencies';
  }
  return String(val).trim() || 'Technical Proficiencies';
}

export function normalizeTechStackSkills(raw: unknown): TechStackGroup[] {
  if (!raw) return JSON.parse(JSON.stringify(ABOUT_CONTENT.techStack));

  let parsedRaw = tryParseJson(raw);

  // If parsed is a single group object
  if (parsedRaw && typeof parsedRaw === 'object' && !Array.isArray(parsedRaw)) {
    const obj = parsedRaw as Record<string, unknown>;
    if ('category' in obj || 'items' in obj || 'skills' in obj) {
      parsedRaw = [obj];
    } else {
      // It's a dictionary e.g. { "Languages": ["C++", "Python"], "Frameworks": ["React"] }
      const entries = Object.entries(obj);
      if (entries.length > 0) {
        const groups: TechStackGroup[] = entries.map(([cat, val]) => {
          const parsedVal = tryParseJson(val);
          let items: string[] = [];
          if (Array.isArray(parsedVal)) {
            items = parsedVal.map(cleanSkillItem).filter(Boolean);
          } else if (typeof parsedVal === 'string') {
            items = parsedVal.split(',').map((s) => cleanSkillItem(s)).filter(Boolean);
          }
          return {
            category: cleanCategory(cat),
            items: items.length > 0 ? items : ['General Competency'],
          };
        });
        return groups.filter((g) => g.items.length > 0);
      }
    }
  }

  if (Array.isArray(parsedRaw)) {
    if (parsedRaw.length === 0) {
      return JSON.parse(JSON.stringify(ABOUT_CONTENT.techStack));
    }

    const groups: TechStackGroup[] = [];
    const looseSkills: string[] = [];

    for (let element of parsedRaw) {
      element = tryParseJson(element);

      if (element && typeof element === 'object' && !Array.isArray(element)) {
        const obj = element as Record<string, unknown>;
        const category = cleanCategory(obj.category || obj.name || obj.title || obj.group);
        const rawItems = obj.items ?? obj.skills ?? obj.list ?? obj.technologies ?? [];
        const parsedItems = tryParseJson(rawItems);

        let items: string[] = [];
        if (Array.isArray(parsedItems)) {
          for (let it of parsedItems) {
            it = tryParseJson(it);
            const cleaned = cleanSkillItem(it);
            if (cleaned) items.push(cleaned);
          }
        } else if (typeof parsedItems === 'string') {
          items = parsedItems.split(',').map(cleanSkillItem).filter(Boolean);
        }

        if (items.length > 0) {
          groups.push({
            category,
            items,
          });
        }
      } else if (typeof element === 'string') {
        const cleaned = cleanSkillItem(element);
        if (cleaned) {
          looseSkills.push(cleaned);
        }
      }
    }

    if (looseSkills.length > 0) {
      groups.push({
        category: 'Core Proficiencies',
        items: looseSkills,
      });
    }

    if (groups.length > 0) {
      return groups;
    }
  }

  return JSON.parse(JSON.stringify(ABOUT_CONTENT.techStack));
}

/**
 * Deserializes biography from the Supabase `bio` TEXT column into string[].
 * - If bio is a JSON-encoded string containing an array, JSON.parse it.
 * - If parsing succeeds and produces a string[], use it.
 * - If bio is null/empty, use the static fallback biography.
 * - If parsing fails or is malformed, safely fall back to static biography.
 * - Ensures no raw JSON text or objects leak to the UI.
 */
export function deserializeBiography(rawBio: unknown): string[] {
  const fallback = ABOUT_CONTENT.biography;

  if (rawBio === null || rawBio === undefined) {
    return [...fallback];
  }

  // If already an array in memory
  if (Array.isArray(rawBio)) {
    const validStrings = rawBio
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return validStrings.length > 0 ? validStrings : [...fallback];
  }

  // If rawBio is stored as a string in the TEXT column
  if (typeof rawBio === 'string') {
    const trimmed = rawBio.trim();
    if (!trimmed) {
      return [...fallback];
    }

    // Try parsing as JSON array
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const validStrings = parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        return validStrings.length > 0 ? validStrings : [...fallback];
      }
    } catch {
      // JSON.parse failed
    }

    // If it looks like JSON structure or object error, do not expose raw JSON brackets
    if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed === '[object Object]') {
      return [...fallback];
    }

    // Plain text single paragraph
    return [trimmed];
  }

  return [...fallback];
}

/**
 * Sanitizes biography array before serialization:
 * - trim each paragraph
 * - remove empty paragraphs
 * - preserve original order
 * - do not invent or modify paragraph wording
 * - preserve intentional user edits exactly
 */
export function sanitizeBiography(paragraphs: unknown): string[] {
  if (!Array.isArray(paragraphs)) {
    return [];
  }

  return paragraphs
    .filter((item): item is string => typeof item === 'string')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Explicitly serializes biography string[] to JSON string for the Supabase TEXT column.
 */
export function serializeBiography(paragraphs: string[]): string {
  const cleanBiography = sanitizeBiography(paragraphs);
  const finalBio = cleanBiography.length > 0 ? cleanBiography : ABOUT_CONTENT.biography;
  return JSON.stringify(finalBio);
}

export function mapDbToAboutContent(db: DbAboutRow | DbAboutContent | null): AboutContent {
  if (!db) return ABOUT_CONTENT;

  const rawBio = ('bio' in db && db.bio !== undefined) ? db.bio : (db as DbAboutContent).biography;
  const biography = deserializeBiography(rawBio);

  return {
    badge: db.badge || ABOUT_CONTENT.badge,
    title: db.heading || ABOUT_CONTENT.title,
    statement: db.statement || ABOUT_CONTENT.statement,
    biography,
    quote: db.quote || ABOUT_CONTENT.quote,
    graduationTag: db.graduation_tag || ABOUT_CONTENT.graduationTag,
    photo: db.about_image_url || ABOUT_CONTENT.photo,
    photoCaption: {
      name: ABOUT_CONTENT.photoCaption.name,
      role: db.photo_caption_role || ABOUT_CONTENT.photoCaption.role,
      classYear: ABOUT_CONTENT.photoCaption.classYear,
      verifiedText: ABOUT_CONTENT.photoCaption.verifiedText,
    },
    techStack: normalizeTechStackSkills(db.skills),
  };
}

export function mapDbToSiteInfoAndSocials(db: DbSiteSettings | null): { siteInfo: SiteInfo; socialLinks: SocialLink[] } {
  if (!db) {
    return {
      siteInfo: SITE_INFO,
      socialLinks: SOCIAL_LINKS,
    };
  }

  const updatedSiteInfo: SiteInfo = {
    ...SITE_INFO,
    fullName: db.owner_name || SITE_INFO.fullName,
    email: db.primary_email || SITE_INFO.email,
  };

  const updatedSocials: SocialLink[] = [
    {
      platform: 'GitHub',
      label: db.github_url.replace(/^https?:\/\//, ''),
      url: db.github_url || 'https://github.com/afridaskar',
      iconName: 'Github',
    },
    {
      platform: 'LinkedIn',
      label: db.linkedin_url.replace(/^https?:\/\//, ''),
      url: db.linkedin_url || 'https://linkedin.com',
      iconName: 'Linkedin',
    },
    {
      platform: 'YouTube',
      label: db.youtube_url.replace(/^https?:\/\//, ''),
      url: db.youtube_url || 'https://youtube.com',
      iconName: 'Youtube',
    },
    {
      platform: 'Email',
      label: db.primary_email || SITE_INFO.email,
      url: `mailto:${db.primary_email || SITE_INFO.email}`,
      iconName: 'Mail',
    },
  ];

  return {
    siteInfo: updatedSiteInfo,
    socialLinks: updatedSocials,
  };
}

// =============================================================================
// PUBLIC READ SERVICES (Safe fallback on network error/empty state)
// =============================================================================

export async function fetchPublicHeroContent(): Promise<HeroContent> {
  try {
    const { data, error } = await supabase
      .from('hero_content')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return HERO_CONTENT;
    }
    return mapDbToHeroContent(data as DbHeroContent);
  } catch (err) {
    console.warn('Public Hero fetch fallback:', err);
    return HERO_CONTENT;
  }
}

export async function fetchPublicAboutContent(): Promise<AboutContent> {
  try {
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return ABOUT_CONTENT;
    }
    return mapDbToAboutContent(data as DbAboutRow);
  } catch (err) {
    console.warn('Public About fetch fallback:', err);
    return ABOUT_CONTENT;
  }
}

export async function fetchPublicSiteSettings(): Promise<{ siteInfo: SiteInfo; socialLinks: SocialLink[] }> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return { siteInfo: SITE_INFO, socialLinks: SOCIAL_LINKS };
    }
    return mapDbToSiteInfoAndSocials(data as DbSiteSettings);
  } catch (err) {
    console.warn('Public SiteSettings fetch fallback:', err);
    return { siteInfo: SITE_INFO, socialLinks: SOCIAL_LINKS };
  }
}

// =============================================================================
// ADMIN CRUD SERVICES (Authenticated admin operations)
// =============================================================================

export async function getAdminHeroContent(): Promise<{ data: DbHeroContent | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('hero_content')
      .select('id, name, identity, tagline, description, rotating_phrases, hero_image_url, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, created_at, updated_at')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }
    if (!data) {
      return { data: null };
    }
    
    // Normalize safely to preserve all expected fields with sensible fallbacks
    const normalized: DbHeroContent = {
      id: 'global',
      name: data.name ?? DEFAULT_DB_HERO.name,
      identity: data.identity ?? DEFAULT_DB_HERO.identity,
      rotating_phrases: Array.isArray(data.rotating_phrases) && data.rotating_phrases.length > 0
        ? data.rotating_phrases
        : DEFAULT_DB_HERO.rotating_phrases,
      tagline: data.tagline ?? DEFAULT_DB_HERO.tagline,
      description: data.description ?? DEFAULT_DB_HERO.description,
      primary_cta_label: data.primary_cta_label ?? DEFAULT_DB_HERO.primary_cta_label,
      primary_cta_url: data.primary_cta_url ?? DEFAULT_DB_HERO.primary_cta_url,
      secondary_cta_label: data.secondary_cta_label ?? DEFAULT_DB_HERO.secondary_cta_label,
      secondary_cta_url: data.secondary_cta_url ?? DEFAULT_DB_HERO.secondary_cta_url,
      hero_image_url: data.hero_image_url ?? DEFAULT_DB_HERO.hero_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: normalized };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch Hero content' };
  }
}

export async function saveAdminHeroContent(payload: DbHeroContent): Promise<{ success: boolean; error?: string }> {
  try {
    // Only send the exact, real database columns to Supabase
    const cleanPayload = {
      id: 'global',
      name: (payload.name || '').trim() || DEFAULT_DB_HERO.name,
      identity: (payload.identity || '').trim() || DEFAULT_DB_HERO.identity,
      tagline: (payload.tagline || '').trim() || DEFAULT_DB_HERO.tagline,
      description: (payload.description || '').trim() || DEFAULT_DB_HERO.description,
      rotating_phrases: Array.isArray(payload.rotating_phrases) && payload.rotating_phrases.length > 0
        ? payload.rotating_phrases.filter((s) => typeof s === 'string' && s.trim().length > 0)
        : DEFAULT_DB_HERO.rotating_phrases,
      hero_image_url: (payload.hero_image_url || '').trim() || DEFAULT_DB_HERO.hero_image_url,
      primary_cta_label: (payload.primary_cta_label || '').trim() || DEFAULT_DB_HERO.primary_cta_label,
      primary_cta_url: (payload.primary_cta_url || '').trim() || DEFAULT_DB_HERO.primary_cta_url,
      secondary_cta_label: (payload.secondary_cta_label || '').trim() || DEFAULT_DB_HERO.secondary_cta_label,
      secondary_cta_url: (payload.secondary_cta_url || '').trim() || DEFAULT_DB_HERO.secondary_cta_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('hero_content')
      .upsert(cleanPayload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save Hero content' };
  }
}

export async function getAdminAboutContent(): Promise<{ data: DbAboutContent | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('about_content')
      .select('id, heading, statement, bio, about_image_url, skills, pillars, quote, badge, graduation_tag, photo_caption_role, created_at, updated_at')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }
    if (!data) {
      return { data: null };
    }

    const row = data as DbAboutRow;
    const biography = deserializeBiography(row.bio);
    const normalizedSkills: TechStackGroup[] = normalizeTechStackSkills(row.skills);

    const normalized: DbAboutContent = {
      id: 'global',
      heading: row.heading ?? DEFAULT_DB_ABOUT.heading,
      statement: row.statement ?? DEFAULT_DB_ABOUT.statement,
      biography,
      bio: biography,
      about_image_url: row.about_image_url ?? DEFAULT_DB_ABOUT.about_image_url,
      skills: normalizedSkills,
      pillars: row.pillars ?? undefined,
      quote: row.quote ?? DEFAULT_DB_ABOUT.quote,
      badge: row.badge ?? DEFAULT_DB_ABOUT.badge,
      graduation_tag: row.graduation_tag ?? DEFAULT_DB_ABOUT.graduation_tag,
      photo_caption_role: row.photo_caption_role ?? DEFAULT_DB_ABOUT.photo_caption_role,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return { data: normalized };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch About content';
    return { data: null, error: message };
  }
}

export async function saveAdminAboutContent(payload: DbAboutContent): Promise<{ success: boolean; error?: string }> {
  try {
    // Biography can be provided via payload.biography (standard) or payload.bio (alias)
    const sourceBio = payload.biography ?? payload.bio ?? [];
    const cleanBiography = sanitizeBiography(sourceBio);
    const finalBiography = cleanBiography.length > 0 ? cleanBiography : ABOUT_CONTENT.biography;

    // Only send the exact, real database columns to Supabase.
    // The bio column is TEXT in Postgres, so serialize explicitly as a JSON-encoded string:
    const cleanPayload: Record<string, unknown> = {
      id: 'global',
      heading: (payload.heading || '').trim() || DEFAULT_DB_ABOUT.heading,
      statement: (payload.statement || '').trim() || DEFAULT_DB_ABOUT.statement,
      bio: JSON.stringify(finalBiography),
      about_image_url: (payload.about_image_url || '').trim() || DEFAULT_DB_ABOUT.about_image_url,
      skills: Array.isArray(payload.skills) && payload.skills.length > 0
        ? payload.skills
        : DEFAULT_DB_ABOUT.skills,
      quote: (payload.quote || '').trim() || DEFAULT_DB_ABOUT.quote,
      badge: (payload.badge || '').trim() || DEFAULT_DB_ABOUT.badge,
      graduation_tag: (payload.graduation_tag || '').trim() || DEFAULT_DB_ABOUT.graduation_tag,
      photo_caption_role: (payload.photo_caption_role || '').trim() || DEFAULT_DB_ABOUT.photo_caption_role,
      updated_at: new Date().toISOString(),
    };

    if (payload.pillars !== undefined) {
      cleanPayload.pillars = payload.pillars;
    }

    const { error } = await supabase
      .from('about_content')
      .upsert(cleanPayload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save About content';
    return { success: false, error: message };
  }
}

export async function getAdminSiteSettings(): Promise<{ data: DbSiteSettings | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: (data as DbSiteSettings) || null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch Site Settings' };
  }
}

export async function saveAdminSiteSettings(payload: DbSiteSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPayload = {
      ...payload,
      id: 'global',
    };
    const { error } = await supabase
      .from('site_settings')
      .upsert(cleanPayload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save Site Settings' };
  }
}
