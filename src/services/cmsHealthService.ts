import { supabase } from '../lib/supabase';
import { classifySupabaseError, verifyAdminSession } from './cmsAuthService';
import { STORAGE_BUCKET } from './mediaService';

// =============================================================================
// TYPES FOR PERMISSION & HEALTH AUDIT
// =============================================================================

export interface CmsTableHealthReport {
  table: string;
  exists: boolean;
  rls_enabled: boolean;
  policy_count: number;
  anon_select: boolean;
  auth_select: boolean;
  auth_write: boolean;
  status: 'healthy' | 'warning' | 'error';
  issue?: string;
}

export interface CmsHealthAuditResult {
  checkedAt: string;
  overallStatus: 'healthy' | 'degraded' | 'action_required';
  authenticated: boolean;
  authorized: boolean;
  userId?: string;
  userEmail?: string;
  adminUsersLocked: boolean;
  functions: {
    private_is_admin: boolean;
    check_is_admin: boolean;
    publish_about_cms: boolean;
    unpublish_about_cms: boolean;
    get_public_about_bundle: boolean;
    cms_health_check: boolean;
  };
  storage: {
    bucketExists: boolean;
    bucketPublic: boolean;
    policyCount: number;
  };
  tables: CmsTableHealthReport[];
  findings: string[];
  needsRepairMigration: boolean;
  error?: string;
}

const EXPECTED_PUBLIC_READ_TABLES = new Set([
  'hero_content',
  'about_content',
  'about_interests',
  'about_highlights',
  'projects',
  'project_media',
  'journey_milestones',
  'creator_videos',
  'site_settings',
  'media',
]);

/**
 * Runs a comprehensive non-destructive CMS permission, schema, function, and
 * storage health audit using the server-side `cms_health_check` RPC.
 */
export async function runCmsHealthAudit(): Promise<CmsHealthAuditResult> {
  const checkedAt = new Date().toISOString();

  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return {
      checkedAt,
      overallStatus: 'action_required',
      authenticated: auth.category !== 'AUTH_EXPIRED',
      authorized: false,
      userId: auth.userId,
      userEmail: auth.email,
      adminUsersLocked: true,
      functions: {
        private_is_admin: false,
        check_is_admin: false,
        publish_about_cms: false,
        unpublish_about_cms: false,
        get_public_about_bundle: false,
        cms_health_check: false,
      },
      storage: {
        bucketExists: false,
        bucketPublic: false,
        policyCount: 0,
      },
      tables: [],
      findings: [auth.error || 'Administrator authorization could not be verified.'],
      needsRepairMigration: Boolean(auth.needsMigration),
      error: auth.error,
    };
  }

  try {
    const { data, error } = await supabase.rpc('cms_health_check');

    if (error) {
      const classified = classifySupabaseError(error, 'running CMS permission health audit');
      return {
        checkedAt,
        overallStatus: 'action_required',
        authenticated: true,
        authorized: true,
        userId: auth.userId,
        userEmail: auth.email,
        adminUsersLocked: false,
        functions: {
          private_is_admin: auth.verificationMethod === 'rpc:check_is_admin',
          check_is_admin: auth.verificationMethod === 'rpc:check_is_admin',
          publish_about_cms: false,
          unpublish_about_cms: false,
          get_public_about_bundle: false,
          cms_health_check: false,
        },
        storage: {
          bucketExists: false,
          bucketPublic: false,
          policyCount: 0,
        },
        tables: [],
        findings: [
          classified.message,
          'Run the Repair SQL migration to install public.cms_health_check() and harden all table RLS policies.',
        ],
        needsRepairMigration: true,
        error: classified.message,
      };
    }

    const payload = (data || {}) as Record<string, any>;
    const fnObj = (payload.functions || {}) as Record<string, boolean>;
    const storageObj = (payload.storage || {}) as Record<string, any>;
    const rawTables = Array.isArray(payload.tables) ? (payload.tables as Record<string, any>[]) : [];

    const findings: string[] = [];
    const adminUsersLocked = payload.admin_users_locked !== false;

    if (!adminUsersLocked) {
      findings.push(
        'public.admin_users currently exposes client privileges; execute the repair migration to revoke anon/authenticated grants.'
      );
    }

    const functions = {
      private_is_admin: Boolean(fnObj.private_is_admin),
      check_is_admin: Boolean(fnObj.check_is_admin),
      publish_about_cms: Boolean(fnObj.publish_about_cms),
      unpublish_about_cms: Boolean(fnObj.unpublish_about_cms),
      get_public_about_bundle: Boolean(fnObj.get_public_about_bundle),
      cms_health_check: true,
    };

    if (!functions.private_is_admin) findings.push('Missing private.is_admin() SECURITY DEFINER function.');
    if (!functions.publish_about_cms) findings.push('Missing public.publish_about_cms() atomic publish RPC.');
    if (!functions.unpublish_about_cms) findings.push('Missing public.unpublish_about_cms() RPC.');

    const tables: CmsTableHealthReport[] = rawTables.map((row) => {
      const tableName = String(row.table || '');
      const exists = Boolean(row.exists);
      const rlsEnabled = Boolean(row.rls_enabled);
      const policyCount = Number(row.policy_count || 0);
      const anonSelect = Boolean(row.anon_select);
      const authSelect = Boolean(row.auth_select);
      const authWrite = Boolean(row.auth_write);

      let status: CmsTableHealthReport['status'] = 'healthy';
      let issue: string | undefined;

      if (!exists) {
        status = 'error';
        issue = 'Table does not exist';
      } else if (!rlsEnabled) {
        status = 'error';
        issue = 'Row Level Security is disabled';
      } else if (policyCount === 0) {
        status = 'error';
        issue = 'No RLS policies defined';
      } else if (!authSelect || !authWrite) {
        status = 'error';
        issue = 'Missing authenticated GRANT permissions';
      } else if (tableName === 'about_drafts' && anonSelect) {
        status = 'warning';
        issue = 'anon role should not have SELECT privilege on private drafts';
      } else if (EXPECTED_PUBLIC_READ_TABLES.has(tableName) && !anonSelect) {
        status = 'warning';
        issue = 'Missing anon SELECT grant for public portfolio reads';
      }

      if (issue) {
        findings.push(`${tableName}: ${issue}`);
      }

      return {
        table: tableName,
        exists,
        rls_enabled: rlsEnabled,
        policy_count: policyCount,
        anon_select: anonSelect,
        auth_select: authSelect,
        auth_write: authWrite,
        status,
        issue,
      };
    });

    const storage = {
      bucketExists: Boolean(storageObj.bucket_exists),
      bucketPublic: Boolean(storageObj.bucket_public),
      policyCount: Number(storageObj.policy_count || 0),
    };

    if (!storage.bucketExists) {
      findings.push(`Storage bucket "${STORAGE_BUCKET}" not found.`);
    } else if (storage.policyCount < 2) {
      findings.push(`Storage policies for "${STORAGE_BUCKET}" are incomplete (${storage.policyCount}/2 found).`);
    }

    const hasError = tables.some((t) => t.status === 'error') || !adminUsersLocked || !functions.private_is_admin;
    const hasWarning = tables.some((t) => t.status === 'warning') || !functions.publish_about_cms || storage.policyCount < 2;

    return {
      checkedAt: payload.checked_at || checkedAt,
      overallStatus: hasError ? 'action_required' : hasWarning ? 'degraded' : 'healthy',
      authenticated: true,
      authorized: true,
      userId: auth.userId,
      userEmail: auth.email,
      adminUsersLocked,
      functions,
      storage,
      tables,
      findings,
      needsRepairMigration: hasError || hasWarning,
    };
  } catch (err) {
    const classified = classifySupabaseError(err, 'running CMS health audit');
    return {
      checkedAt,
      overallStatus: 'action_required',
      authenticated: true,
      authorized: true,
      userId: auth.userId,
      userEmail: auth.email,
      adminUsersLocked: false,
      functions: {
        private_is_admin: false,
        check_is_admin: false,
        publish_about_cms: false,
        unpublish_about_cms: false,
        get_public_about_bundle: false,
        cms_health_check: false,
      },
      storage: {
        bucketExists: false,
        bucketPublic: false,
        policyCount: 0,
      },
      tables: [],
      findings: [classified.message],
      needsRepairMigration: true,
      error: classified.message,
    };
  }
}
