import { supabase } from '../lib/supabase';
import { CreatorVideoItem, FEATURED_VIDEO, ADDITIONAL_VIDEOS } from '../data/creatorContent';

// =============================================================================
// DATABASE RECORD INTERFACE (public.creator_videos)
// =============================================================================

export interface DbCreatorVideo {
  id: string;
  video_id: string;
  title: string;
  category: string;
  duration: string;
  youtube_url: string;
  thumbnail_url: string;
  is_featured: boolean;
  display_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DbCreatorVideoInsert = Omit<DbCreatorVideo, 'created_at' | 'updated_at'>;
export type DbCreatorVideoUpdate = Partial<DbCreatorVideoInsert>;

// =============================================================================
// YOUTUBE URL & THUMBNAIL UTILITIES
// =============================================================================

/**
 * Extracts and normalizes a standard 11-character YouTube video ID
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID&feature=share
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Direct 11-character video ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Direct ID check (e.g. dQw4w9WgXcQ or similar 11-char pattern)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // 2. youtu.be shortlinks
    if (trimmed.includes('youtu.be/')) {
      const parts = trimmed.split('youtu.be/')[1]?.split(/[?&#]/)[0];
      if (parts && parts.length === 11) return parts;
      if (parts && parts.length > 0) return parts;
    }

    // 3. Standard youtube.com URLs
    if (trimmed.includes('youtube.com/')) {
      // Check for /shorts/
      if (trimmed.includes('/shorts/')) {
        const parts = trimmed.split('/shorts/')[1]?.split(/[?&#]/)[0];
        if (parts) return parts;
      }

      // Check for /embed/
      if (trimmed.includes('/embed/')) {
        const parts = trimmed.split('/embed/')[1]?.split(/[?&#]/)[0];
        if (parts) return parts;
      }

      // Check URL query parameters
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const v = url.searchParams.get('v');
      if (v) return v;
    }
  } catch {
    // Fallback regex match for common youtube patterns
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Derives a standard high quality YouTube thumbnail URL from video ID
 */
export function getDerivedYouTubeThumbnail(videoId: string): string {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Normalizes input to canonical watch URL
 */
export function getCanonicalYouTubeWatchUrl(videoId: string, rawUrl?: string): string {
  if (videoId && videoId.length === 11) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (rawUrl && rawUrl.trim().startsWith('http')) {
    return rawUrl.trim();
  }
  if (rawUrl && rawUrl.trim()) {
    return `https://${rawUrl.trim()}`;
  }
  return 'https://youtube.com';
}

// =============================================================================
// DEFAULT SEEDING DATA
// =============================================================================

export const DEFAULT_DB_CREATOR_VIDEOS: DbCreatorVideo[] = [
  {
    id: 'vid-featured',
    video_id: 'dQw4w9WgXcQ', // Clean default ID
    title: FEATURED_VIDEO.title,
    category: FEATURED_VIDEO.category,
    duration: FEATURED_VIDEO.duration,
    youtube_url: FEATURED_VIDEO.youtubeUrl || 'https://youtube.com',
    thumbnail_url: getDerivedYouTubeThumbnail('dQw4w9WgXcQ'),
    is_featured: true,
    display_order: 1,
    is_published: true,
  },
  ...ADDITIONAL_VIDEOS.map((v, idx) => ({
    id: v.id || `vid-0${idx + 1}`,
    video_id: `demo-vid-0${idx + 1}`,
    title: v.title,
    category: v.category,
    duration: v.duration,
    youtube_url: v.youtubeUrl || 'https://youtube.com',
    thumbnail_url: '',
    is_featured: false,
    display_order: idx + 2,
    is_published: true,
  }))
];

// =============================================================================
// PUBLIC CLIENT SERVICES
// =============================================================================

/**
 * Fetches published creator videos for public display.
 * Returns:
 * - featuredVideo (if any is marked is_featured=true and is_published=true)
 * - archiveVideos (up to 4 published videos ordered by display_order, excluding featured)
 * If none found, gracefully falls back to static creator content.
 */
export async function fetchPublicCreatorVideos(): Promise<{
  featuredVideo: DbCreatorVideo | null;
  archiveVideos: DbCreatorVideo[];
  allPublishedVideos: DbCreatorVideo[];
}> {
  try {
    const { data, error } = await supabase
      .from('creator_videos')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return {
        featuredVideo: DEFAULT_DB_CREATOR_VIDEOS.find(v => v.is_featured) || DEFAULT_DB_CREATOR_VIDEOS[0],
        archiveVideos: DEFAULT_DB_CREATOR_VIDEOS.filter(v => !v.is_featured).slice(0, 4),
        allPublishedVideos: DEFAULT_DB_CREATOR_VIDEOS,
      };
    }

    const allPublished = data as DbCreatorVideo[];
    // Find featured video among published
    const featured = allPublished.find(v => v.is_featured) || allPublished[0] || null;
    // Archive videos: exclude the chosen featured video, then take the first 4
    const archive = allPublished
      .filter(v => featured ? v.id !== featured.id : true)
      .slice(0, 4);

    return {
      featuredVideo: featured,
      archiveVideos: archive,
      allPublishedVideos: allPublished,
    };
  } catch (err) {
    console.warn('Fallback: Error fetching public creator videos:', err);
    return {
      featuredVideo: DEFAULT_DB_CREATOR_VIDEOS.find(v => v.is_featured) || DEFAULT_DB_CREATOR_VIDEOS[0],
      archiveVideos: DEFAULT_DB_CREATOR_VIDEOS.filter(v => !v.is_featured).slice(0, 4),
      allPublishedVideos: DEFAULT_DB_CREATOR_VIDEOS,
    };
  }
}

// =============================================================================
// ADMIN CLIENT SERVICES (Protected via Supabase Auth & RLS)
// =============================================================================

/**
 * Gets all creator videos for the CMS (ordered by display_order).
 */
export async function getAdminCreatorVideos(): Promise<{ data: DbCreatorVideo[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('creator_videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbCreatorVideo[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch admin creator videos' };
  }
}

/**
 * Creates a new creator video record.
 * Handles single-featured rule: if payload.is_featured is true, clears featured on other records.
 */
export async function createAdminCreatorVideo(
  payload: DbCreatorVideoInsert
): Promise<{ data: DbCreatorVideo | null; error: string | null }> {
  try {
    // If setting as featured, demote any currently featured video
    if (payload.is_featured) {
      await supabase
        .from('creator_videos')
        .update({ is_featured: false, updated_at: new Date().toISOString() })
        .eq('is_featured', true);
    }

    const { data, error } = await supabase
      .from('creator_videos')
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as DbCreatorVideo, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create creator video' };
  }
}

/**
 * Updates an existing creator video record.
 * Handles single-featured rule: if payload.is_featured is true, clears featured on other records.
 */
export async function updateAdminCreatorVideo(
  id: string,
  payload: DbCreatorVideoUpdate
): Promise<{ success: boolean; error: string | null }> {
  try {
    // If setting as featured, demote other videos
    if (payload.is_featured) {
      await supabase
        .from('creator_videos')
        .update({ is_featured: false, updated_at: new Date().toISOString() })
        .neq('id', id)
        .eq('is_featured', true);
    }

    const { error } = await supabase
      .from('creator_videos')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update creator video' };
  }
}

/**
 * Deletes a creator video by ID.
 */
export async function deleteAdminCreatorVideo(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('creator_videos')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete creator video' };
  }
}

/**
 * Toggles publication state (is_published).
 */
export async function togglePublishAdminCreatorVideo(
  id: string,
  currentStatus: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('creator_videos')
      .update({
        is_published: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle publication status' };
  }
}

/**
 * Sets a specific video as the single featured video.
 */
export async function setFeaturedAdminCreatorVideo(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // 1. Demote any other featured video
    await supabase
      .from('creator_videos')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .neq('id', id)
      .eq('is_featured', true);

    // 2. Set this video as featured
    const { error } = await supabase
      .from('creator_videos')
      .update({ is_featured: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set featured creator video' };
  }
}

/**
 * Removes featured status from a video.
 */
export async function removeFeaturedAdminCreatorVideo(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('creator_videos')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove featured status' };
  }
}

/**
 * Reorders creator videos sequentially.
 */
export async function reorderAdminCreatorVideos(
  orderedItems: { id: string; display_order: number }[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    for (const item of orderedItems) {
      const { error } = await supabase
        .from('creator_videos')
        .update({
          display_order: item.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reorder creator videos' };
  }
}

/**
 * Seeds default creator videos if table is empty.
 */
export async function seedDefaultCreatorVideosIfEmpty(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('creator_videos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Check creator_videos count note:', error.message);
      return false;
    }

    if (count === 0) {
      for (const video of DEFAULT_DB_CREATOR_VIDEOS) {
        await supabase.from('creator_videos').insert({
          ...video,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return true;
    }

    return false;
  } catch (err) {
    console.warn('Seed creator_videos note:', err);
    return false;
  }
}
