import { supabase } from '../lib/supabase';

// =============================================================================
// TYPES & ERROR CLASSIFICATION
// =============================================================================

export type CmsErrorCategory =
  | 'AUTH_EXPIRED'
  | 'NOT_ADMIN'
  | 'PERMISSION_DENIED'
  | 'MISSING_SCHEMA'
  | 'NETWORK'
  | 'VALIDATION'
  | 'UNKNOWN';

export interface ClassifiedCmsError {
  category: CmsErrorCategory;
  message: string;
  actionHint?: string;
  code?: string;
  needsMigration?: boolean;
  technicalDetail?: string;
}

export interface AdminSessionVerification {
  authorized: boolean;
  userId?: string;
  email?: string;
  verificationMethod?: 'rpc:check_is_admin' | 'rls:about_drafts';
  category?: CmsErrorCategory;
  error?: string;
  needsMigration?: boolean;
}

export interface CmsDiagnosticEntry {
  id: string;
  timestamp: string;
  context: string;
  category: CmsErrorCategory;
  code?: string;
  message: string;
}

// In-memory ring buffer of sanitized non-sensitive CMS diagnostics for Admin System & Health UI
const DIAGNOSTIC_BUFFER_LIMIT = 25;
const diagnosticLog: CmsDiagnosticEntry[] = [];

export function recordCmsDiagnostic(entry: Omit<CmsDiagnosticEntry, 'id' | 'timestamp'>): void {
  const safeMessage = entry.message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
  diagnosticLog.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    context: entry.context,
    category: entry.category,
    code: entry.code,
    message: safeMessage,
  });
  if (diagnosticLog.length > DIAGNOSTIC_BUFFER_LIMIT) {
    diagnosticLog.length = DIAGNOSTIC_BUFFER_LIMIT;
  }
}

export function getCmsDiagnosticLogs(): CmsDiagnosticEntry[] {
  return [...diagnosticLog];
}

export function clearCmsDiagnosticLogs(): void {
  diagnosticLog.length = 0;
}

/**
 * Validates that a URL is safe (relative '/' path, HTTPS, or HTTP).
 * Blocks javascript:, vbscript:, data:, and ephemeral blob: URLs.
 */
export function isSafeMediaOrLinkUrl(raw?: string | null, allowEmpty = true): boolean {
  if (!raw || typeof raw !== 'string') return allowEmpty;
  const trimmed = raw.trim();
  if (!trimmed) return allowEmpty;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:')
  ) {
    return false;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  if (trimmed.startsWith('#')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeCmsUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return isSafeMediaOrLinkUrl(trimmed, false) ? trimmed : '';
}

/**
 * Inspects Supabase / PostgREST / PostgreSQL errors and maps them into clear,
 * actionable categories without exposing secrets or raw stack dumps.
 */
export function classifySupabaseError(
  error: unknown,
  context: string,
  fallbackMessage?: string
): ClassifiedCmsError {
  const errObj = (error && typeof error === 'object' ? error : {}) as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    status?: number;
  };

  const rawMsg =
    typeof error === 'string'
      ? error
      : typeof errObj.message === 'string'
      ? errObj.message
      : fallbackMessage || `Operation failed during ${context}.`;
  const lower = rawMsg.toLowerCase();
  const code = errObj.code ? String(errObj.code) : undefined;
  const status = typeof errObj.status === 'number' ? errObj.status : undefined;

  let classified: ClassifiedCmsError;

  // 1. Missing table / column / RPC function (migration needed)
  if (
    code === '42P01' ||
    code === '42703' ||
    code === '42883' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    lower.includes('does not exist') ||
    lower.includes('could not find the')
  ) {
    classified = {
      category: 'MISSING_SCHEMA',
      code,
      needsMigration: true,
      message: `Database schema update required before ${context}.`,
      actionHint:
        'Open System & Health (or click Database Setup SQL) and execute the idempotent SQL migration in Supabase SQL Editor.',
      technicalDetail: `${code ? `[${code}] ` : ''}${rawMsg}`,
    };
  }
  // 2. Expired or invalid JWT / auth session
  else if (
    status === 401 ||
    code === 'PGRST301' ||
    code === 'PGRST302' ||
    lower.includes('jwt expired') ||
    lower.includes('session expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('not authenticated') ||
    lower.includes('refresh_token')
  ) {
    classified = {
      category: 'AUTH_EXPIRED',
      code,
      message: 'Your admin session expired. Please sign in again to continue.',
      actionHint: 'Sign out and sign back in with your administrator account.',
      technicalDetail: rawMsg,
    };
  }
  // 3. Explicit permission denied on admin_users (RLS invoking-role bug) or RLS policy violation
  else if (
    lower.includes('permission denied for table admin_users') ||
    (code === '42501' && lower.includes('admin_users'))
  ) {
    classified = {
      category: 'PERMISSION_DENIED',
      code: code || '42501',
      needsMigration: true,
      message: `Database permission policy misconfiguration blocked ${context} (admin_users direct RLS lookup).`,
      actionHint:
        'Run the CMS Permission Repair SQL migration (private.is_admin() + atomic RPCs) in Supabase SQL Editor. Your existing published data remains intact.',
      technicalDetail: rawMsg,
    };
  } else if (
    status === 403 ||
    code === '42501' ||
    lower.includes('row-level security policy') ||
    lower.includes('permission denied') ||
    lower.includes('not an authorized administrator') ||
    lower.includes('unauthorized')
  ) {
    const isAdminDenied =
      lower.includes('not an authorized administrator') ||
      lower.includes('administrator privileges');
    classified = {
      category: isAdminDenied ? 'NOT_ADMIN' : 'PERMISSION_DENIED',
      code: code || '42501',
      needsMigration: !isAdminDenied,
      message: isAdminDenied
        ? 'You do not have administrator permissions to modify this section.'
        : `Permission denied while ${context}. Database authorization policies rejected the write, leaving previously published data untouched.`,
      actionHint: isAdminDenied
        ? 'Verify your user UUID is registered in public.admin_users.'
        : 'Run a Permission Audit in System & Health and apply the Repair SQL migration if any table policy is outdated.',
      technicalDetail: rawMsg,
    };
  }
  // 4. Network / connectivity / gateway timeout
  else if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('fetcherror') ||
    lower.includes('timeout') ||
    lower.includes('econnreset')
  ) {
    classified = {
      category: 'NETWORK',
      code,
      message: `Connection to Supabase failed during ${context}. Any previously published live data remains untouched.`,
      actionHint: 'Check your network connection and retry the operation.',
      technicalDetail: rawMsg,
    };
  }
  // 5. Validation / constraint errors
  else if (
    code === '22023' ||
    code === '23505' ||
    code === '23502' ||
    code === '23514' ||
    code === '22P02' ||
    lower.includes('duplicate key') ||
    lower.includes('cannot be empty') ||
    lower.includes('invalid')
  ) {
    classified = {
      category: 'VALIDATION',
      code,
      message:
        code === '23505'
          ? `A duplicate record blocked ${context}. Please use a unique identifier or slug.`
          : rawMsg,
      technicalDetail: rawMsg,
    };
  }
  // 6. Unknown / generic
  else {
    classified = {
      category: 'UNKNOWN',
      code,
      message: fallbackMessage || rawMsg,
      technicalDetail: rawMsg,
    };
  }

  recordCmsDiagnostic({
    context,
    category: classified.category,
    code: classified.code,
    message: classified.message,
  });

  return classified;
}

/**
 * Verifies the active Supabase session AND server-side admin status without
 * ever directly querying public.admin_users from client code.
 */
export async function verifyAdminSession(): Promise<AdminSessionVerification> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      const classified = classifySupabaseError(sessionError, 'checking admin session');
      return {
        authorized: false,
        category: classified.category,
        error: classified.message,
      };
    }

    const session = sessionData?.session;
    if (!session?.user) {
      return {
        authorized: false,
        category: 'AUTH_EXPIRED',
        error: 'Authentication required. Please sign in to the Admin CMS.',
      };
    }

    // Also validate token/user freshness against Supabase Auth when supported
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      const classified = classifySupabaseError(
        userErr || new Error('Session expired'),
        'validating active session'
      );
      return {
        authorized: false,
        category: classified.category,
        error: classified.message,
      };
    }

    const verifiedUser = userData.user;

    // 1. Primary authoritative check via SECURITY DEFINER RPC (never queries admin_users from client)
    const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc('check_is_admin');

    if (!rpcError) {
      if (rpcIsAdmin === true) {
        return {
          authorized: true,
          userId: verifiedUser.id,
          email: verifiedUser.email,
          verificationMethod: 'rpc:check_is_admin',
        };
      }
      return {
        authorized: false,
        userId: verifiedUser.id,
        email: verifiedUser.email,
        category: 'NOT_ADMIN',
        error: 'Your account is signed in, but lacks administrator privileges in admin_users.',
      };
    }

    const rpcClassified = classifySupabaseError(rpcError, 'verifying admin role via check_is_admin');

    // If check_is_admin RPC isn't deployed yet on remote DB, try private-RLS about_drafts row check
    // Note: Only returns authorized if an actual row from about_drafts is returned (cannot be read by non-admins).
    if (rpcClassified.category === 'MISSING_SCHEMA') {
      const { data: draftProbe, error: draftErr } = await supabase
        .from('about_drafts')
        .select('id')
        .eq('id', 'global')
        .limit(1);

      if (!draftErr && Array.isArray(draftProbe) && draftProbe.length > 0) {
        return {
          authorized: true,
          userId: verifiedUser.id,
          email: verifiedUser.email,
          verificationMethod: 'rls:about_drafts',
          needsMigration: true,
        };
      }

      return {
        authorized: false,
        userId: verifiedUser.id,
        email: verifiedUser.email,
        category: 'MISSING_SCHEMA',
        needsMigration: true,
        error:
          'Admin verification function (public.check_is_admin) is not installed in Supabase yet. Please apply the CMS Permission Repair SQL migration.',
      };
    }

    return {
      authorized: false,
      userId: verifiedUser.id,
      email: verifiedUser.email,
      category: rpcClassified.category,
      needsMigration: rpcClassified.needsMigration,
      error: rpcClassified.message,
    };
  } catch (err) {
    const classified = classifySupabaseError(err, 'verifying administrator session');
    return {
      authorized: false,
      category: classified.category,
      error: classified.message,
    };
  }
}
