import { supabase } from '../lib/supabase';
import { ProjectMedia, ProjectMediaType } from '../types';
import { STORAGE_BUCKET, ensureMediaBucketExists } from './mediaService';

// =============================================================================
// DATABASE RECORD INTERFACE (public.project_media)
// =============================================================================

export interface DbProjectMedia {
  id: string;
  project_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string | null;
  display_order: number;
  is_featured: boolean;
  is_published: boolean;
  alt_text?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type DbProjectMediaInsert = Omit<DbProjectMedia, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

// =============================================================================
// SQL SCHEMA SCRIPT FOR USER TO RUN IN SUPABASE SQL EDITOR
// =============================================================================

export const PROJECT_MEDIA_SQL_SCHEMA = `-- ============================================================================
-- 1. Create public.project_media Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_media (
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

-- ============================================================================
-- 2. Indexes for High Performance Lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON public.project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_project_media_display_order ON public.project_media(display_order);
CREATE INDEX IF NOT EXISTS idx_project_media_featured ON public.project_media(is_featured);

-- ============================================================================
-- 3. Row Level Security (RLS) Configuration
-- ============================================================================
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public users can view published project media" ON public.project_media;
DROP POLICY IF EXISTS "Admins have full access to project_media" ON public.project_media;

-- Public read access: Only published media for published projects
CREATE POLICY "Public users can view published project media"
ON public.project_media
FOR SELECT
USING (
    is_published = true
    AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_media.project_id
        AND projects.is_published = true
    )
);

-- Admin full access: Authenticated administrators can manage all media
CREATE POLICY "Admins have full access to project_media"
ON public.project_media
FOR ALL
USING (
    auth.role() = 'authenticated'
)
WITH CHECK (
    auth.role() = 'authenticated'
);
`;

// =============================================================================
// LOCAL CACHE & RESILIENCY STORAGE KEY
// =============================================================================

const LOCAL_STORAGE_MEDIA_KEY = 'afrid_portfolio_project_media';

function getLocalMedia(): DbProjectMedia[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMedia(items: DbProjectMedia[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Could not save local project media:', err);
  }
}

// =============================================================================
// MAPPERS
// =============================================================================

export function mapDbToProjectMedia(db: DbProjectMedia): ProjectMedia {
  return {
    id: db.id,
    projectId: db.project_id,
    mediaType: (db.media_type as ProjectMediaType) || 'image',
    mediaUrl: db.media_url,
    caption: db.caption || '',
    displayOrder: db.display_order ?? 0,
    isFeatured: !!db.is_featured,
    isPublished: db.is_published ?? true,
    altText: db.alt_text || '',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// Helper to resolve project UUID from slug or vice-versa
async function resolveProjectIdentifiers(projectIdOrSlug: string): Promise<{ id: string; slug: string }> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectIdOrSlug);
  try {
    const query = supabase.from('projects').select('id, slug');
    const { data } = isUUID
      ? await query.eq('id', projectIdOrSlug).maybeSingle()
      : await query.eq('slug', projectIdOrSlug).maybeSingle();

    if (data) {
      return { id: data.id, slug: data.slug };
    }
  } catch {
    // ignore
  }
  return { id: projectIdOrSlug, slug: projectIdOrSlug };
}

// =============================================================================
// STORAGE HELPER
// =============================================================================

export async function uploadProjectMediaFile(
  file: File,
  projectIdOrSlug: string
): Promise<{ url: string; mediaType: ProjectMediaType; error: string | null }> {
  try {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      return {
        url: '',
        mediaType: 'image',
        error: 'Unsupported file format. Please upload an image (JPG, PNG, WebP) or video (MP4, WebM).',
      };
    }

    // 1. Ensure Storage bucket exists in Supabase
    await ensureMediaBucketExists();

    const cleanProject = projectIdOrSlug.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'general';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || (isVideo ? '.mp4' : '.jpg');
    const cleanFileName = file.name
      .substring(0, file.name.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase();
    
    const storagePath = `projects/${cleanProject}/${cleanFileName}-${timestamp}-${randomSuffix}${extension}`;

    // 2. Upload file object to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { url: '', mediaType: isVideo ? 'video' : 'image', error: `Storage upload failed: ${uploadError.message}` };
    }

    // 3. Obtain persistent Public Storage URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl || '';
    if (!publicUrl || publicUrl.startsWith('blob:')) {
      return { url: '', mediaType: isVideo ? 'video' : 'image', error: 'Failed to generate persistent public URL for uploaded media.' };
    }

    return {
      url: publicUrl,
      mediaType: isVideo ? 'video' : 'image',
      error: null,
    };
  } catch (err: any) {
    return {
      url: '',
      mediaType: 'image',
      error: err.message || 'File upload failed',
    };
  }
}

// =============================================================================
// PUBLIC READ SERVICES
// =============================================================================

/**
 * Helper to ensure a media URL is a persistent HTTP/HTTPS web address.
 */
function isPersistentMediaUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.startsWith('blob:');
}

/**
 * Fetch published project media for a specific project.
 * Returns only items where is_published === true and media_url is persistent.
 * Ordered by is_featured DESC (primary first), then display_order ASC.
 */
export async function fetchPublishedProjectMedia(projectIdOrSlug: string): Promise<ProjectMedia[]> {
  try {
    const { id: uuid, slug } = await resolveProjectIdentifiers(projectIdOrSlug);

    // Try Supabase project_media table first
    const { data, error } = await supabase
      .from('project_media')
      .select('*')
      .in('project_id', [uuid, slug])
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return (data as DbProjectMedia[])
        .filter((item) => isPersistentMediaUrl(item.media_url))
        .map(mapDbToProjectMedia);
    }

    // Try public.media table in Supabase
    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaData && mediaData.length > 0) {
      const matchedFromMedia: ProjectMedia[] = [];
      for (const m of mediaData) {
        if (!isPersistentMediaUrl(m.public_url)) continue;
        if (m.file_path?.includes(`/${uuid}/`) || m.file_path?.includes(`/${slug}/`)) {
          let meta: any = {};
          try {
            if (m.alt_text?.startsWith('{')) meta = JSON.parse(m.alt_text);
          } catch {}

          matchedFromMedia.push({
            id: m.id,
            projectId: uuid || slug,
            mediaType: m.media_type?.includes('video') ? 'video' : 'image',
            mediaUrl: m.public_url,
            caption: meta.caption || m.file_name || '',
            displayOrder: meta.display_order ?? 0,
            isFeatured: !!meta.is_featured,
            isPublished: meta.is_published ?? true,
            altText: meta.alt_text || m.alt_text || '',
            createdAt: m.created_at,
          });
        }
      }
      if (matchedFromMedia.length > 0) {
        matchedFromMedia.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.displayOrder - b.displayOrder;
        });
        return matchedFromMedia;
      }
    }

    // Fallback to local storage if table doesn't exist yet
    const local = getLocalMedia().filter(
      (m) => (m.project_id === uuid || m.project_id === slug) && m.is_published && isPersistentMediaUrl(m.media_url)
    );
    local.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.display_order - b.display_order;
    });

    return local.map(mapDbToProjectMedia);
  } catch {
    return [];
  }
}

/**
 * Fetches all published media across all projects, grouped by projectId/slug.
 * Efficient single-call loader for the public Work section.
 */
export async function fetchAllPublishedProjectMedia(): Promise<Record<string, ProjectMedia[]>> {
  const result: Record<string, ProjectMedia[]> = {};

  try {
    const { data, error } = await supabase
      .from('project_media')
      .select('*')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      for (const item of data as DbProjectMedia[]) {
        if (!isPersistentMediaUrl(item.media_url)) continue;
        const mapped = mapDbToProjectMedia(item);
        if (!result[item.project_id]) {
          result[item.project_id] = [];
        }
        result[item.project_id].push(mapped);
      }
      if (Object.keys(result).length > 0) {
        return result;
      }
    }

    // Try public.media table in Supabase
    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaData && mediaData.length > 0) {
      for (const m of mediaData) {
        if (!isPersistentMediaUrl(m.public_url)) continue;
        if (m.file_path?.startsWith('projects/')) {
          const parts = m.file_path.split('/');
          const projKey = parts[1];
          if (projKey) {
            let meta: any = {};
            try {
              if (m.alt_text?.startsWith('{')) meta = JSON.parse(m.alt_text);
            } catch {}

            const mappedItem: ProjectMedia = {
              id: m.id,
              projectId: projKey,
              mediaType: m.media_type?.includes('video') ? 'video' : 'image',
              mediaUrl: m.public_url,
              caption: meta.caption || m.file_name || '',
              displayOrder: meta.display_order ?? 0,
              isFeatured: !!meta.is_featured,
              isPublished: meta.is_published ?? true,
              altText: meta.alt_text || '',
              createdAt: m.created_at,
            };

            if (!result[projKey]) {
              result[projKey] = [];
            }
            result[projKey].push(mappedItem);
          }
        }
      }
      if (Object.keys(result).length > 0) {
        return result;
      }
    }

    // Fallback to local storage
    const local = getLocalMedia().filter((m) => m.is_published && isPersistentMediaUrl(m.media_url));
    for (const item of local) {
      const mapped = mapDbToProjectMedia(item);
      if (!result[item.project_id]) {
        result[item.project_id] = [];
      }
      result[item.project_id].push(mapped);
    }
  } catch {
    // ignore
  }

  return result;
}

// =============================================================================
// ADMIN CRUD SERVICES
// =============================================================================

/**
 * Retrieves all media items (published and unpublished) for a project.
 */
export async function getAdminProjectMedia(projectIdOrSlug: string): Promise<{ data: ProjectMedia[]; error?: string }> {
  try {
    const { id: uuid, slug } = await resolveProjectIdentifiers(projectIdOrSlug);

    const { data, error } = await supabase
      .from('project_media')
      .select('*')
      .in('project_id', [uuid, slug])
      .order('display_order', { ascending: true });

    if (!error && data) {
      const mapped = (data as DbProjectMedia[]).map(mapDbToProjectMedia);
      mapped.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.displayOrder - b.displayOrder;
      });
      return { data: mapped };
    }

    // Fallback to local storage
    const local = getLocalMedia().filter((m) => m.project_id === uuid || m.project_id === slug);
    local.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.display_order - b.display_order;
    });

    return { data: local.map(mapDbToProjectMedia) };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch project media' };
  }
}

/**
 * Creates a new media item for a project.
 * If marked as is_featured, safely unsets existing featured flags for this project.
 */
export async function createAdminProjectMedia(
  payload: DbProjectMediaInsert
): Promise<{ data: ProjectMedia | null; error?: string }> {
  try {
    if (!payload.media_url || payload.media_url.startsWith('blob:') || payload.media_url.startsWith('data:')) {
      return { data: null, error: 'Cannot save a temporary local preview URL. File upload to persistent Supabase Storage is required.' };
    }

    const { id: projectUuid } = await resolveProjectIdentifiers(payload.project_id);
    const resolvedProjectId = projectUuid || payload.project_id;

    // If setting as featured, unset others for this project
    if (payload.is_featured) {
      await supabase
        .from('project_media')
        .update({ is_featured: false })
        .eq('project_id', resolvedProjectId)
        .eq('is_featured', true);
    }

    const insertPayload = {
      project_id: resolvedProjectId,
      media_type: payload.media_type,
      media_url: payload.media_url,
      caption: payload.caption || '',
      display_order: payload.display_order ?? 0,
      is_featured: !!payload.is_featured,
      is_published: payload.is_published ?? true,
      alt_text: payload.alt_text || '',
    };

    const { data, error } = await supabase
      .from('project_media')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (!error && data) {
      return { data: mapDbToProjectMedia(data as DbProjectMedia) };
    }

    // Register metadata in public.media as well for cross-device query resilience
    try {
      await supabase.from('media').insert({
        bucket: STORAGE_BUCKET,
        file_path: payload.media_url.includes(STORAGE_BUCKET)
          ? payload.media_url.split(`/${STORAGE_BUCKET}/`)[1]?.split('?')[0] || `projects/${resolvedProjectId}/${Date.now()}.jpg`
          : `projects/${resolvedProjectId}/${Date.now()}.jpg`,
        public_url: payload.media_url,
        file_name: payload.caption || 'project_media',
        media_type: payload.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
        file_size_bytes: 0,
        alt_text: JSON.stringify({
          project_id: resolvedProjectId,
          caption: payload.caption,
          display_order: payload.display_order,
          is_featured: payload.is_featured,
          is_published: payload.is_published,
        }),
      });
    } catch {
      // non-blocking
    }

    // Fallback to local storage for offline resiliency
    const local = getLocalMedia();
    if (payload.is_featured) {
      local.forEach((m) => {
        if (m.project_id === resolvedProjectId || m.project_id === payload.project_id) {
          m.is_featured = false;
        }
      });
    }

    const newRecord: DbProjectMedia = {
      id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      project_id: resolvedProjectId,
      media_type: payload.media_type,
      media_url: payload.media_url,
      caption: payload.caption || '',
      display_order: payload.display_order ?? local.length + 1,
      is_featured: !!payload.is_featured,
      is_published: payload.is_published ?? true,
      alt_text: payload.alt_text || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    local.push(newRecord);
    saveLocalMedia(local);

    return { data: mapDbToProjectMedia(newRecord) };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create project media' };
  }
}

/**
 * Updates an existing project media record.
 */
export async function updateAdminProjectMedia(
  id: string,
  projectId: string,
  payload: Partial<DbProjectMediaInsert>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: projectUuid } = await resolveProjectIdentifiers(projectId);
    const resolvedProjectId = projectUuid || projectId;

    if (payload.is_featured) {
      await supabase
        .from('project_media')
        .update({ is_featured: false })
        .eq('project_id', resolvedProjectId)
        .neq('id', id)
        .eq('is_featured', true);
    }

    const { error } = await supabase
      .from('project_media')
      .update(payload)
      .eq('id', id);

    if (!error) {
      return { success: true };
    }

    // Fallback to local storage
    const local = getLocalMedia();
    const idx = local.findIndex((m) => m.id === id);
    if (idx !== -1) {
      if (payload.is_featured) {
        local.forEach((m) => {
          if (m.project_id === resolvedProjectId) m.is_featured = false;
        });
      }
      local[idx] = { ...local[idx], ...payload, updated_at: new Date().toISOString() };
      saveLocalMedia(local);
      return { success: true };
    }

    return { success: false, error: error?.message || 'Media item not found' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update project media' };
  }
}

/**
 * Sets one media item as primary / featured for a project and unsets all others.
 */
export async function setPrimaryAdminProjectMedia(
  id: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: projectUuid } = await resolveProjectIdentifiers(projectId);
    const resolvedProjectId = projectUuid || projectId;

    // 1. Unset all featured for this project
    await supabase
      .from('project_media')
      .update({ is_featured: false })
      .eq('project_id', resolvedProjectId)
      .eq('is_featured', true);

    // 2. Set this item as featured
    const { error } = await supabase
      .from('project_media')
      .update({ is_featured: true })
      .eq('id', id);

    if (!error) {
      return { success: true };
    }

    // Local storage fallback
    const local = getLocalMedia();
    local.forEach((m) => {
      if (m.project_id === resolvedProjectId || m.project_id === projectId) {
        m.is_featured = m.id === id;
      }
    });
    saveLocalMedia(local);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set primary media' };
  }
}

/**
 * Deletes a project media record. Also deletes file from storage if stored in portfolio-media.
 */
export async function deleteAdminProjectMedia(
  id: string,
  mediaUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Attempt storage file cleanup if URL belongs to our bucket
    if (mediaUrl && mediaUrl.includes(STORAGE_BUCKET)) {
      try {
        const parts = mediaUrl.split(`/${STORAGE_BUCKET}/`);
        if (parts[1]) {
          const filePath = decodeURIComponent(parts[1].split('?')[0]);
          await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
        }
      } catch (err) {
        console.warn('Storage cleanup note:', err);
      }
    }

    // 2. Delete database record
    const { error } = await supabase
      .from('project_media')
      .delete()
      .eq('id', id);

    if (!error) {
      return { success: true };
    }

    // Local fallback
    const local = getLocalMedia().filter((m) => m.id !== id);
    saveLocalMedia(local);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete project media' };
  }
}

/**
 * Reorders project media items.
 */
export async function reorderAdminProjectMedia(
  orderedItems: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const item of orderedItems) {
      await supabase
        .from('project_media')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
    }

    // Also update local storage
    const local = getLocalMedia();
    const map = new Map(orderedItems.map((o) => [o.id, o.display_order]));
    local.forEach((m) => {
      if (map.has(m.id)) {
        m.display_order = map.get(m.id)!;
      }
    });
    saveLocalMedia(local);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reorder project media' };
  }
}
