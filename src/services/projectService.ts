import { supabase } from '../lib/supabase';
import { ProjectItem } from '../types';
import { PROJECTS } from '../data/siteContent';

// =============================================================================
// DATABASE RECORD INTERFACE (public.projects)
// =============================================================================

export interface DbProject {
  id: string;
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  tagline: string;
  category: string;
  description: string;
  technologies: string[];
  highlights: string[];
  github_url: string;
  live_url: string;
  is_flagship: boolean;
  display_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DbProjectInsert = Omit<DbProject, 'created_at' | 'updated_at'>;
export type DbProjectUpdate = Partial<DbProjectInsert>;

// =============================================================================
// DEFAULT INITIAL PROJECTS (Seed helper derived from authoritative PROJECTS)
// =============================================================================

export const DEFAULT_DB_PROJECTS: DbProjectInsert[] = PROJECTS.map((proj, idx) => ({
  id: proj.id,
  slug: proj.id,
  number: proj.number,
  title: proj.title,
  subtitle: proj.subtitle,
  tagline: proj.tagline,
  category: proj.category,
  description: proj.description,
  technologies: [...proj.technologies],
  highlights: [...proj.highlights],
  github_url: proj.githubUrl || '',
  live_url: proj.liveUrl || '',
  is_flagship: !!proj.isFlagship,
  display_order: idx + 1,
  is_published: true,
}));

// =============================================================================
// MAPPERS
// =============================================================================

export function mapDbToProjectItem(db: DbProject): ProjectItem {
  return {
    id: db.slug || db.id,
    number: db.number || '01',
    title: db.title || 'Untitled Project',
    subtitle: db.subtitle || '',
    tagline: db.tagline || '',
    description: db.description || '',
    technologies: Array.isArray(db.technologies) ? db.technologies : [],
    category: db.category || 'Engineering',
    highlights: Array.isArray(db.highlights) ? db.highlights : [],
    githubUrl: db.github_url || '',
    liveUrl: db.live_url || '',
    isFlagship: !!db.is_flagship,
  };
}

// =============================================================================
// PUBLIC READ SERVICES
// =============================================================================

/**
 * Fetches published projects sorted by display_order.
 * Returns static fallback PROJECTS if error or if zero published projects exist.
 */
export async function fetchPublicProjects(): Promise<ProjectItem[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Public projects fetch note (using fallback):', error.message);
      return PROJECTS;
    }

    if (!data || data.length === 0) {
      return PROJECTS;
    }

    return (data as DbProject[]).map(mapDbToProjectItem);
  } catch (err) {
    console.warn('Public projects fetch exception (using fallback):', err);
    return PROJECTS;
  }
}

// =============================================================================
// ADMIN CRUD SERVICES (Authenticated admin operations)
// =============================================================================

/**
 * Retrieves all projects (published and unpublished) ordered by display_order.
 */
export async function getAdminProjects(): Promise<{ data: DbProject[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbProject[]) || [] };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch projects' };
  }
}

/**
 * Creates a new project in public.projects.
 * If marked as flagship, safely unsets existing flagship first.
 */
export async function createAdminProject(payload: DbProjectInsert): Promise<{ data: DbProject | null; error?: string }> {
  try {
    // 1. Slug uniqueness check
    const { data: existingSlug, error: slugCheckError } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', payload.slug)
      .maybeSingle();

    if (slugCheckError) {
      return { data: null, error: slugCheckError.message };
    }
    if (existingSlug) {
      return { data: null, error: `A project with the slug "${payload.slug}" already exists. Please choose a unique slug.` };
    }

    // 2. If setting as flagship, unset all other flagships first
    if (payload.is_flagship) {
      await supabase
        .from('projects')
        .update({ is_flagship: false })
        .eq('is_flagship', true);
    }

    // 3. Insert record
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as DbProject };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create project' };
  }
}

/**
 * Updates an existing project.
 * If marked as flagship, safely unsets existing flagship from other records.
 */
export async function updateAdminProject(id: string, payload: DbProjectUpdate): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. If slug is being updated, verify uniqueness against other projects
    if (payload.slug) {
      const { data: existingSlug, error: slugCheckError } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', payload.slug)
        .neq('id', id)
        .maybeSingle();

      if (slugCheckError) {
        return { success: false, error: slugCheckError.message };
      }
      if (existingSlug) {
        return { success: false, error: `A project with the slug "${payload.slug}" already exists. Please choose a unique slug.` };
      }
    }

    // 2. If setting as flagship, unset all others
    if (payload.is_flagship) {
      await supabase
        .from('projects')
        .update({ is_flagship: false })
        .neq('id', id)
        .eq('is_flagship', true);
    }

    // 3. Update record
    const { error } = await supabase
      .from('projects')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update project' };
  }
}

/**
 * Deletes a project by ID.
 */
export async function deleteAdminProject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete project' };
  }
}

/**
 * Toggles the published status of a project.
 */
export async function togglePublishAdminProject(id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ 
        is_published: !currentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle publication status' };
  }
}

/**
 * Sets a project as flagship and unsets all other projects.
 */
export async function setFlagshipAdminProject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Unset all flagships
    await supabase
      .from('projects')
      .update({ is_flagship: false })
      .neq('id', id)
      .eq('is_flagship', true);

    // 2. Set this project as flagship
    const { error } = await supabase
      .from('projects')
      .update({ 
        is_flagship: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set flagship project' };
  }
}

/**
 * Reorders two projects (moves one up or down) and persists updated display_order values.
 */
export async function reorderAdminProjects(
  orderedProjects: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update each project's display_order
    const updatePromises = orderedProjects.map((proj) =>
      supabase
        .from('projects')
        .update({ 
          display_order: proj.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', proj.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.find(r => r.error);
    if (hasError && hasError.error) {
      return { success: false, error: hasError.error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to persist reordering' };
  }
}

/**
 * Seeds default projects into Supabase if table is empty.
 */
export async function seedDefaultProjectsIfEmpty(): Promise<{ seeded: boolean; error?: string }> {
  try {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { seeded: false, error: error.message };
    }

    if (count === 0) {
      const { error: insertError } = await supabase
        .from('projects')
        .insert(DEFAULT_DB_PROJECTS);

      if (insertError) {
        return { seeded: false, error: insertError.message };
      }
      return { seeded: true };
    }

    return { seeded: false };
  } catch (err: any) {
    return { seeded: false, error: err.message };
  }
}
