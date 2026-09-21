import { supabase } from '../lib/supabase';
import { JourneyMilestone } from '../types';
import { JOURNEY } from '../data/siteContent';

// =============================================================================
// DATABASE RECORD INTERFACE (public.journey_milestones)
// =============================================================================

export interface DbJourneyMilestone {
  id: string;
  year: string;
  phase: string;
  title: string;
  description: string;
  pillars: string[];
  is_current: boolean;
  is_horizon: boolean;
  display_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DbJourneyMilestoneInsert = Omit<DbJourneyMilestone, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
export type DbJourneyMilestoneUpdate = Partial<DbJourneyMilestoneInsert>;

/**
 * Ensures a valid UUID v4 format is used for database operations.
 */
export function ensureValidUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// DEFAULT INITIAL JOURNEY DATA (Authoritative Fallback)
// =============================================================================

export const DEFAULT_DB_JOURNEY_MILESTONES: DbJourneyMilestoneInsert[] = JOURNEY.milestones.map((m, idx) => ({
  year: m.year,
  phase: m.phase,
  title: m.title,
  description: m.description,
  pillars: [...m.pillars],
  is_current: m.status === 'current',
  is_horizon: m.status === 'aspirational' || m.year === '2030',
  display_order: idx + 1,
  is_published: true,
}));

// =============================================================================
// MAPPER: Database Milestone -> Frontend JourneyMilestone
// =============================================================================

export function mapDbToJourneyMilestone(db: DbJourneyMilestone): JourneyMilestone {
  // Determine frontend status: 'current' | 'upcoming' | 'aspirational'
  let status: 'current' | 'upcoming' | 'aspirational' = 'upcoming';
  if (db.is_current) {
    status = 'current';
  } else if (db.is_horizon) {
    status = 'aspirational';
  }

  const yearStr = String(db.year ?? '');

  // Derive focusAreas from existing fallback if matching year exists, or use default relevant tags
  const fallback = JOURNEY.milestones.find(m => String(m.year) === yearStr);
  const focusAreas = fallback?.focusAreas && fallback.focusAreas.length > 0
    ? fallback.focusAreas
    : ['Systems Engineering', 'Software Architecture', 'Continuous Building'];

  return {
    year: yearStr,
    phase: db.phase,
    status,
    title: db.title,
    description: db.description,
    pillars: Array.isArray(db.pillars) ? db.pillars : [],
    focusAreas,
  };
}

// =============================================================================
// PUBLIC CLIENT SERVICES
// =============================================================================

/**
 * Fetches published journey milestones for public display.
 * Sorted by display_order ascending.
 * Falls back to authoritative static JOURNEY data if Supabase request fails or is empty.
 */
export async function fetchPublicJourneyMilestones(): Promise<{
  milestones: JourneyMilestone[];
  dbMilestones: DbJourneyMilestone[];
}> {
  try {
    const { data, error } = await supabase
      .from('journey_milestones')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return {
        milestones: JOURNEY.milestones,
        dbMilestones: [],
      };
    }

    const dbMilestones = data as DbJourneyMilestone[];
    const mapped = dbMilestones.map(mapDbToJourneyMilestone);

    return {
      milestones: mapped,
      dbMilestones,
    };
  } catch (err) {
    console.warn('Fallback: Error fetching public journey milestones:', err);
    return {
      milestones: JOURNEY.milestones,
      dbMilestones: [],
    };
  }
}

// =============================================================================
// ADMIN CLIENT SERVICES (Protected via Supabase Auth & RLS)
// =============================================================================

/**
 * Gets all journey milestones for the CMS (ordered by display_order ascending).
 */
export async function getAdminJourneyMilestones(): Promise<{
  data: DbJourneyMilestone[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('journey_milestones')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbJourneyMilestone[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch admin journey milestones' };
  }
}

/**
 * Creates a new journey milestone record.
 * Handles current milestone rule: if payload.is_current is true, clears is_current on other records.
 */
export async function createAdminJourneyMilestone(
  payload: DbJourneyMilestoneInsert
): Promise<{ data: DbJourneyMilestone | null; error: string | null }> {
  try {
    // If setting as current, demote any currently active milestone
    if (payload.is_current) {
      await supabase
        .from('journey_milestones')
        .update({ is_current: false })
        .eq('is_current', true);
    }

    const milestoneId = ensureValidUuid(payload.id);

    const { data, error } = await supabase
      .from('journey_milestones')
      .insert({
        id: milestoneId,
        year: payload.year,
        phase: payload.phase,
        title: payload.title,
        description: payload.description,
        pillars: Array.isArray(payload.pillars) ? payload.pillars : [],
        is_current: !!payload.is_current,
        is_horizon: !!payload.is_horizon,
        display_order: payload.display_order || 1,
        is_published: payload.is_published !== false,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as DbJourneyMilestone, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create journey milestone' };
  }
}

/**
 * Updates an existing journey milestone record.
 * Handles single-current rule: if payload.is_current is true, clears is_current on other records.
 */
export async function updateAdminJourneyMilestone(
  id: string,
  payload: DbJourneyMilestoneUpdate
): Promise<{ success: boolean; error: string | null }> {
  try {
    // If setting as current, demote any other milestones
    if (payload.is_current) {
      await supabase
        .from('journey_milestones')
        .update({ is_current: false })
        .neq('id', id)
        .eq('is_current', true);
    }

    const allowedKeys: (keyof DbJourneyMilestoneInsert)[] = [
      'year', 'phase', 'title', 'description', 'pillars',
      'is_current', 'is_horizon', 'display_order', 'is_published'
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in payload && (payload as any)[key] !== undefined) {
        updateData[key] = (payload as any)[key];
      }
    }

    const { error } = await supabase
      .from('journey_milestones')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update journey milestone' };
  }
}

/**
 * Deletes a journey milestone by ID.
 */
export async function deleteAdminJourneyMilestone(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('journey_milestones')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete journey milestone' };
  }
}

/**
 * Toggles publication state (is_published).
 */
export async function togglePublishAdminJourneyMilestone(
  id: string,
  currentStatus: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('journey_milestones')
      .update({
        is_published: !currentStatus,
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
 * Sets a specific milestone as Current (and demotes all other current milestones).
 */
export async function setCurrentAdminJourneyMilestone(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // 1. Demote any other current milestone
    await supabase
      .from('journey_milestones')
      .update({ is_current: false })
      .neq('id', id)
      .eq('is_current', true);

    // 2. Set this milestone as current
    const { error } = await supabase
      .from('journey_milestones')
      .update({ is_current: true })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set current milestone' };
  }
}

/**
 * Removes Current status from a milestone.
 */
export async function removeCurrentAdminJourneyMilestone(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('journey_milestones')
      .update({ is_current: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove current status' };
  }
}

/**
 * Sets a specific milestone as Horizon anchor.
 */
export async function setHorizonAdminJourneyMilestone(
  id: string,
  isHorizon: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('journey_milestones')
      .update({ is_horizon: isHorizon })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update horizon status' };
  }
}

/**
 * Reorders journey milestones sequentially.
 */
export async function reorderAdminJourneyMilestones(
  orderedItems: { id: string; display_order: number }[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    for (const item of orderedItems) {
      const { error } = await supabase
        .from('journey_milestones')
        .update({
          display_order: item.display_order,
        })
        .eq('id', item.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reorder journey milestones' };
  }
}

/**
 * Seeds default journey milestones if table is empty.
 * Guarantees valid UUIDs and preserves canonical data structure.
 */
export async function seedDefaultJourneyMilestonesIfEmpty(): Promise<{
  seeded: boolean;
  count: number;
  error?: string;
}> {
  try {
    const { count, error } = await supabase
      .from('journey_milestones')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Check journey_milestones count note:', error.message);
      return { seeded: false, count: 0, error: error.message };
    }

    if (count === 0) {
      let insertedCount = 0;
      for (const m of DEFAULT_DB_JOURNEY_MILESTONES) {
        const payload = {
          id: ensureValidUuid(),
          year: m.year,
          phase: m.phase,
          title: m.title,
          description: m.description,
          pillars: Array.isArray(m.pillars) ? m.pillars : [],
          is_current: !!m.is_current,
          is_horizon: !!m.is_horizon,
          display_order: m.display_order,
          is_published: m.is_published !== false,
        };

        const { error: insertError } = await supabase
          .from('journey_milestones')
          .insert(payload);

        if (insertError) {
          console.error(`Failed to seed milestone ${m.year}:`, insertError);
          return { seeded: false, count: insertedCount, error: insertError.message };
        }
        insertedCount++;
      }
      return { seeded: true, count: insertedCount };
    }

    return { seeded: false, count: count || 0 };
  } catch (err: any) {
    console.warn('Seed journey_milestones note:', err);
    return { seeded: false, count: 0, error: err.message };
  }
}
