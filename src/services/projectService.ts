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

export type DbProjectInsert = Omit<DbProject, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type DbProjectUpdate = Partial<DbProjectInsert>;

// =============================================================================
// DEFAULT INITIAL PROJECTS (Seed helper derived from authoritative PROJECTS)
// =============================================================================

export const DEFAULT_DB_PROJECTS: DbProjectInsert[] = PROJECTS.map((proj, idx) => ({
  slug: proj.id,
  number: proj.number || String(idx + 1).padStart(2, '0'),
  title: proj.title,
  subtitle: proj.subtitle || '',
  tagline: proj.tagline || '',
  category: proj.category || 'Engineering',
  description: proj.description || '',
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
    isPublished: db.is_published ?? true,
    displayOrder: db.display_order ?? 0,
  };
}

// =============================================================================
// PUBLIC READ SERVICES
// =============================================================================

/**
 * Fetches published projects sorted by display_order from Supabase source of truth.
 * Returns only projects where is_published === true.
 * Returns empty array [] if all projects in the database are unpublished.
 * Falls back to canonical static PROJECTS only if table has 0 records total or query errors.
 */
export async function fetchPublicProjects(): Promise<ProjectItem[]> {
  try {
    // 1. Check if the database projects table is completely empty (unseeded)
    const { data: anyRow, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (checkError) {
      console.warn('Public projects fetch note (using fallback):', checkError.message);
      return PROJECTS;
    }

    if (!anyRow || anyRow.length === 0) {
      // Table is empty in database; provide initial canonical projects fallback
      return PROJECTS;
    }

    // 2. Query only published projects sorted by display_order
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Public projects query note:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      // Table exists but all projects are unpublished
      return [];
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

    // 3. Prepare payload strictly with valid public.projects columns
    const insertPayload: Record<string, any> = {
      slug: payload.slug,
      number: payload.number,
      title: payload.title,
      subtitle: payload.subtitle || '',
      tagline: payload.tagline || '',
      category: payload.category || 'Engineering',
      description: payload.description || '',
      technologies: Array.isArray(payload.technologies) ? payload.technologies : [],
      highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
      github_url: payload.github_url || '',
      live_url: payload.live_url || '',
      is_flagship: !!payload.is_flagship,
      display_order: payload.display_order,
      is_published: payload.is_published,
    };

    if (payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)) {
      insertPayload.id = payload.id;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data?.[0] as DbProject) || null };
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

    // 3. Update record strictly with valid public.projects columns
    const allowedKeys: (keyof DbProject)[] = [
      'slug', 'number', 'title', 'subtitle', 'tagline', 'category',
      'description', 'technologies', 'highlights', 'github_url',
      'live_url', 'is_flagship', 'display_order', 'is_published'
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in payload && (payload as any)[key] !== undefined) {
        updateData[key] = (payload as any)[key];
      }
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
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
    for (const proj of orderedProjects) {
      const { error } = await supabase
        .from('projects')
        .update({ display_order: proj.display_order })
        .eq('id', proj.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to persist reordering' };
  }
}

export interface ImportProjectsResult {
  success: boolean;
  count: number;
  skippedCount?: number;
  error?: string;
  details?: string[];
  diagnostics?: {
    userId?: string;
    isAdmin: boolean;
    preparedCount: number;
    attemptedCount: number;
    successfulCount: number;
  };
}

/**
 * Imports canonical static projects into public.projects table.
 * Requires deliberate administrator action.
 * Idempotent & safe: inserts missing canonical projects, preserves existing rows,
 * and avoids duplicate rows on repeated execution.
 */
export async function importCanonicalProjects(): Promise<ImportProjectsResult> {
  const insertedRows: { id?: string; slug: string }[] = [];
  const errors: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // STEP 2 & 3: EXPOSE DIAGNOSTICS & VERIFY ADMIN AUTHORIZATION
    // -------------------------------------------------------------------------
    console.log('[Projects Import Diagnostic] Initiating canonical projects import...');

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[Projects Import Diagnostic] Session retrieval error:', sessionError.message);
      return { success: false, count: 0, error: `Authentication error: ${sessionError.message}` };
    }

    const userId = session?.user?.id;
    console.log('[Projects Import Diagnostic] Authenticated user ID:', userId || 'None (no session)');

    if (!session?.user) {
      const authErr = 'Administrator session not found. Please log in to the admin panel.';
      console.error('[Projects Import Diagnostic]', authErr);
      return { success: false, count: 0, error: authErr };
    }

    // Verify existing admin authorization logic (matches AdminAuthContext)
    let isAdmin = false;

    // Approach A: Query public.admin_users directly
    const { data: adminRecord, error: adminQueryError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!adminQueryError && adminRecord && adminRecord.user_id === userId) {
      isAdmin = true;
    } else {
      // Approach B: Query site_settings (protected by RLS private.is_admin())
      const { data: testData, error: testError } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1);

      isAdmin = !testError && Array.isArray(testData);
    }

    console.log('[Projects Import Diagnostic] Admin authorization result:', isAdmin);
    if (!isAdmin) {
      const authDenied = `Access Denied: Authenticated user (${userId}) is not authorized as an administrator in admin_users or RLS policy.`;
      console.error('[Projects Import Diagnostic]', authDenied);
      return {
        success: false,
        count: 0,
        error: authDenied,
        diagnostics: { userId, isAdmin: false, preparedCount: 0, attemptedCount: 0, successfulCount: 0 },
      };
    }

    // -------------------------------------------------------------------------
    // STEP 4 & 5: MAP CANONICAL SOURCE TO STRICTLY ALLOWED COLUMNS
    // -------------------------------------------------------------------------
    // Strictly allowed columns in public.projects:
    // slug, number, title, subtitle, tagline, category, description,
    // technologies, highlights, github_url, live_url, is_flagship,
    // display_order, is_published
    // (NO id, NO created_at, NO updated_at, NO frontend-only fields)
    const preparedProjects = PROJECTS.map((proj, idx) => ({
      slug: String(proj.id).trim(),
      number: String(proj.number || (idx + 1).toString().padStart(2, '0')).trim(),
      title: String(proj.title).trim(),
      subtitle: String(proj.subtitle || '').trim(),
      tagline: String(proj.tagline || '').trim(),
      category: String(proj.category || 'Engineering').trim(),
      description: String(proj.description || '').trim(),
      technologies: Array.isArray(proj.technologies) ? [...proj.technologies] : [],
      highlights: Array.isArray(proj.highlights) ? [...proj.highlights] : [],
      github_url: String(proj.githubUrl || '').trim(),
      live_url: String(proj.liveUrl || '').trim(),
      is_flagship: !!proj.isFlagship,
      display_order: idx + 1,
      is_published: true,
    }));

    // Ensure at most one flagship is designated among prepared projects
    let flagshipAssigned = false;
    for (const p of preparedProjects) {
      if (p.is_flagship) {
        if (!flagshipAssigned) {
          flagshipAssigned = true;
        } else {
          p.is_flagship = false;
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP 6: CHECK EXISTING DATABASE ROWS TO AVOID DUPLICATES
    // -------------------------------------------------------------------------
    const { data: existingRows, error: fetchError } = await supabase
      .from('projects')
      .select('id, slug, is_flagship, display_order');

    if (fetchError) {
      console.error('[Projects Import Diagnostic] Querying existing projects failed:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      return {
        success: false,
        count: 0,
        error: `Database check failed: [${fetchError.code}] ${fetchError.message}`,
      };
    }

    const existingSlugs = new Set((existingRows || []).map((r: any) => String(r.slug || '').toLowerCase().trim()));
    const existingHasFlagship = (existingRows || []).some((r: any) => r.is_flagship);

    // Identify which canonical projects are missing from the database
    const toInsert = preparedProjects.filter((p) => !existingSlugs.has(p.slug.toLowerCase()));
    const skippedCount = preparedProjects.length - toInsert.length;

    console.log(
      `[Projects Import Diagnostic] Canonical total: ${preparedProjects.length}, Already in DB: ${skippedCount}, To insert: ${toInsert.length}`
    );

    // If all canonical projects already exist in the database, return safe idempotence
    if (toInsert.length === 0) {
      const safeMsg = `All ${preparedProjects.length} canonical projects already exist in the database. 0 new projects inserted, ${skippedCount} skipped to prevent duplicates.`;
      console.log('[Projects Import Diagnostic]', safeMsg);
      return {
        success: true,
        count: 0,
        skippedCount,
        details: [safeMsg],
        diagnostics: {
          userId,
          isAdmin,
          preparedCount: preparedProjects.length,
          attemptedCount: 0,
          successfulCount: 0,
        },
      };
    }

    // If an existing record already has flagship set, unset flagship on new insertions
    if (existingHasFlagship) {
      for (const p of toInsert) {
        p.is_flagship = false;
      }
    }

    // -------------------------------------------------------------------------
    // STEP 7: TEST INSERTION PROJECT-BY-PROJECT
    // -------------------------------------------------------------------------
    for (let i = 0; i < toInsert.length; i++) {
      const projectPayload = toInsert[i];
      console.log(
        `[Projects Import Diagnostic] [Project ${i + 1}/${toInsert.length}] Inserting: "${projectPayload.title}" (slug: "${projectPayload.slug}", order: ${projectPayload.display_order}, flagship: ${projectPayload.is_flagship})`
      );

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(projectPayload)
        .select();

      if (insertError) {
        console.error(`[Projects Import Diagnostic] Insert FAILED for project "${projectPayload.title}" (${projectPayload.slug}):`, {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });

        const errorDesc = `Failed inserting "${projectPayload.title}" (${projectPayload.slug}): [${insertError.code}] ${insertError.message}${insertError.details ? ` - ${insertError.details}` : ''}${insertError.hint ? ` (Hint: ${insertError.hint})` : ''}`;
        errors.push(errorDesc);
        // Break early on first error so partial insertions can be rolled back cleanly
        break;
      }

      const insertedRow = data?.[0];
      const insertedId = insertedRow?.id;
      console.log(
        `[Projects Import Diagnostic] Insert SUCCEEDED for "${projectPayload.title}" (${projectPayload.slug}) -> Generated ID: ${insertedId || 'assigned'}`
      );
      insertedRows.push({ id: insertedId, slug: projectPayload.slug });
    }

    // -------------------------------------------------------------------------
    // ROLLBACK IF PARTIAL FAILURE OCCURRED
    // -------------------------------------------------------------------------
    if (errors.length > 0) {
      if (insertedRows.length > 0) {
        console.warn(`[Projects Import Diagnostic] Rolling back ${insertedRows.length} partially inserted project(s)...`);
        for (const row of insertedRows) {
          if (row.id) {
            await supabase.from('projects').delete().eq('id', row.id);
          } else {
            await supabase.from('projects').delete().eq('slug', row.slug);
          }
        }
        console.warn('[Projects Import Diagnostic] Rollback complete. Database cleaned.');
      }

      return {
        success: false,
        count: 0,
        skippedCount,
        error: errors.join('; '),
        details: errors,
        diagnostics: {
          userId,
          isAdmin,
          preparedCount: preparedProjects.length,
          attemptedCount: toInsert.length,
          successfulCount: 0,
        },
      };
    }

    console.log(
      `[Projects Import Diagnostic] SUCCESS: ${insertedRows.length} project(s) inserted, ${skippedCount} existing project(s) preserved.`
    );

    return {
      success: true,
      count: insertedRows.length,
      skippedCount,
      details: [`Successfully inserted ${insertedRows.length} canonical project(s) into database (${skippedCount} already existed).`],
      diagnostics: {
        userId,
        isAdmin,
        preparedCount: preparedProjects.length,
        attemptedCount: toInsert.length,
        successfulCount: insertedRows.length,
      },
    };
  } catch (err: any) {
    console.error('[Projects Import Diagnostic] Unexpected exception:', err);

    // Rollback any inserted rows in case of unexpected exception
    if (insertedRows.length > 0) {
      for (const row of insertedRows) {
        if (row.id) {
          await supabase.from('projects').delete().eq('id', row.id);
        } else {
          await supabase.from('projects').delete().eq('slug', row.slug);
        }
      }
    }

    return {
      success: false,
      count: 0,
      error: err.message || 'Unexpected exception during projects import',
    };
  }
}

/**
 * Legacy helper: delegates to importCanonicalProjects.
 */
export async function seedDefaultProjectsIfEmpty(): Promise<{ seeded: boolean; error?: string }> {
  const result = await importCanonicalProjects();
  return { seeded: result.success, error: result.error };
}
