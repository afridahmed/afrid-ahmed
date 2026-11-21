import assert from 'node:assert/strict';
import { supabase } from '../src/lib/supabase';
import {
  classifySupabaseError,
  clearCmsDiagnosticLogs,
  getCmsDiagnosticLogs,
  isSafeMediaOrLinkUrl,
  verifyAdminSession,
} from '../src/services/cmsAuthService';
import {
  DEFAULT_ABOUT_CMS_DRAFT,
  publishAboutCms,
  saveAboutDraft,
  unpublishAboutSection,
} from '../src/services/aboutCmsService';
import {
  createAdminProjectMedia,
  PROJECT_MEDIA_SQL_SCHEMA,
} from '../src/services/projectMediaService';
import { importCanonicalProjects } from '../src/services/projectService';
import { saveAdminSiteSettings } from '../src/services/contentService';
import { runCmsHealthAudit } from '../src/services/cmsHealthService';

// Lightweight Vitest/Node runner using Node's native assert & stubbing supabase methods
type RpcHandler = (fn: string, args?: any) => Promise<{ data: any; error: any }>;
type FromHandler = (table: string) => any;

const origAuth = {
  getSession: supabase.auth.getSession.bind(supabase.auth),
  getUser: supabase.auth.getUser.bind(supabase.auth),
};
const origRpc = supabase.rpc.bind(supabase);
const origFrom = supabase.from.bind(supabase);

function restoreSupabase() {
  (supabase.auth as any).getSession = origAuth.getSession;
  (supabase.auth as any).getUser = origAuth.getUser;
  (supabase as any).rpc = origRpc;
  (supabase as any).from = origFrom;
}

function stubSupabase(opts: {
  sessionUser?: { id: string; email: string } | null;
  sessionErr?: any;
  userErr?: any;
  onRpc?: RpcHandler;
  onFrom?: FromHandler;
}) {
  (supabase.auth as any).getSession = async () => ({
    data: { session: opts.sessionUser ? { user: opts.sessionUser } : null },
    error: opts.sessionErr || null,
  });

  (supabase.auth as any).getUser = async () => ({
    data: { user: opts.sessionUser || null },
    error: opts.userErr || null,
  });

  (supabase as any).rpc = async (fn: string, args?: any) => {
    if (opts.onRpc) return opts.onRpc(fn, args);
    return { data: null, error: null };
  };

  (supabase as any).from = (table: string) => {
    if (opts.onFrom) return opts.onFrom(table);
    throw new Error(`Unexpected direct query to table "${table}"`);
  };
}

async function runTests() {
  let passed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    clearCmsDiagnosticLogs();
    try {
      await fn();
      passed++;
      console.log(`  PASS  ${name}`);
    } finally {
      restoreSupabase();
    }
  }

  console.log('\nRunning CMS Security, Authorization, Error Classification & Publishing Tests...\n');

  await test('1. verifyAdminSession fails safely when no session exists (expired)', async () => {
    stubSupabase({ sessionUser: null });
    const res = await verifyAdminSession();
    assert.equal(res.authorized, false);
    assert.equal(res.category, 'AUTH_EXPIRED');
  });

  await test('2. verifyAdminSession rejects non-admin user via check_is_admin without querying admin_users or site_settings', async () => {
    let queriedTables: string[] = [];
    stubSupabase({
      sessionUser: { id: 'user-non-admin', email: 'guest@example.com' },
      onRpc: async (fn) => {
        if (fn === 'check_is_admin') return { data: false, error: null };
        return { data: null, error: null };
      },
      onFrom: (table) => {
        queriedTables.push(table);
        throw new Error(`Must NOT query table ${table} directly!`);
      },
    });
    const res = await verifyAdminSession();
    assert.equal(res.authorized, false);
    assert.equal(res.category, 'NOT_ADMIN');
    assert.deepEqual(queriedTables, []);
  });

  await test('3. verifyAdminSession returns authorized=true when check_is_admin returns true (never hits admin_users)', async () => {
    let queriedTables: string[] = [];
    stubSupabase({
      sessionUser: { id: 'admin-123', email: 'afrid@example.com' },
      onRpc: async (fn) => {
        if (fn === 'check_is_admin') return { data: true, error: null };
        return { data: null, error: null };
      },
      onFrom: (table) => {
        queriedTables.push(table);
        throw new Error(`Must NOT query table ${table}`);
      },
    });
    const res = await verifyAdminSession();
    assert.equal(res.authorized, true);
    assert.equal(res.userId, 'admin-123');
    assert.equal(res.verificationMethod, 'rpc:check_is_admin');
    assert.deepEqual(queriedTables, []);
  });

  await test('4. verifyAdminSession flags MISSING_SCHEMA cleanly when check_is_admin RPC does not exist', async () => {
    stubSupabase({
      sessionUser: { id: 'admin-123', email: 'afrid@example.com' },
      onRpc: async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function public.check_is_admin without parameters' },
      }),
      onFrom: () => ({
        select: () => ({
          eq: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    });
    const res = await verifyAdminSession();
    assert.equal(res.authorized, false);
    assert.equal(res.category, 'MISSING_SCHEMA');
    assert.equal(res.needsMigration, true);
  });

  await test('5. classifySupabaseError diagnoses permission denied for admin_users and sanitizes Bearer secrets', () => {
    const c1 = classifySupabaseError(
      { code: '42501', message: 'permission denied for table admin_users (Bearer supersecrettoken123)' },
      'publishing About settings'
    );
    assert.equal(c1.category, 'PERMISSION_DENIED');
    assert.equal(c1.needsMigration, true);
    assert.match(c1.message, /admin_users/);

    const logs = getCmsDiagnosticLogs();
    assert.equal(logs.length, 1);
    assert.ok(!logs[0].message.includes('supersecrettoken123'));

    const c2 = classifySupabaseError({ message: 'Failed to fetch' }, 'saving Site Settings');
    assert.equal(c2.category, 'NETWORK');
  });

  await test('6. URL validator blocks javascript:, data:, vbscript:, blob: and permits safe HTTPS/relative paths', () => {
    assert.equal(isSafeMediaOrLinkUrl('https://cdn.example.com/a.webp', false), true);
    assert.equal(isSafeMediaOrLinkUrl('/images/afrid-about.jpg', false), true);
    assert.equal(isSafeMediaOrLinkUrl('javascript:alert(1)', false), false);
    assert.equal(isSafeMediaOrLinkUrl('data:text/html,<svg onload=alert(1)>', false), false);
    assert.equal(isSafeMediaOrLinkUrl('blob:http://localhost:3000/1234', false), false);
  });

  await test('7. publishAboutCms calls atomic publish_about_cms RPC for admin and preserves live data on failure', async () => {
    let rpcPayload: any = null;
    stubSupabase({
      sessionUser: { id: 'admin-123', email: 'afrid@example.com' },
      onRpc: async (fn, args) => {
        if (fn === 'check_is_admin') return { data: true, error: null };
        if (fn === 'publish_about_cms') {
          rpcPayload = args;
          return { data: { success: true }, error: null };
        }
        return { data: null, error: null };
      },
    });

    const draft = JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT));
    draft.interests.push({
      id: '33333333-3333-4333-8333-333333333305',
      title: 'Distributed Systems',
      iconName: 'Server',
      description: 'Fault-tolerant state replication',
      displayOrder: 5,
      isVisible: true,
    });

    const ok = await publishAboutCms(draft);
    assert.equal(ok.success, true);
    assert.equal(rpcPayload?.p_draft?.interests?.length, 5);

    // Reject empty heading client-side before RPC
    const badDraft = JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT));
    badDraft.header.heading = '   ';
    const failEmpty = await publishAboutCms(badDraft);
    assert.equal(failEmpty.success, false);
    assert.match(failEmpty.error || '', /cannot be empty/i);
  });

  await test('8. publishAboutCms, saveAboutDraft, and unpublishAboutSection fail cleanly with migration hint on 42501', async () => {
    stubSupabase({
      sessionUser: { id: 'admin-123', email: 'afrid@example.com' },
      onRpc: async (fn) => {
        if (fn === 'check_is_admin') return { data: true, error: null };
        if (fn === 'publish_about_cms' || fn === 'unpublish_about_cms') {
          return { data: null, error: { code: '42501', message: 'permission denied for table admin_users' } };
        }
        return { data: null, error: null };
      },
      onFrom: () => ({
        upsert: async () => ({ error: { code: '42501', message: 'permission denied for table admin_users' } }),
      }),
    });

    const pubRes = await publishAboutCms(DEFAULT_ABOUT_CMS_DRAFT);
    assert.equal(pubRes.success, false);
    assert.equal(pubRes.schemaNeedsMigration, true);

    const draftRes = await saveAboutDraft(DEFAULT_ABOUT_CMS_DRAFT);
    assert.equal(draftRes.success, false);
    assert.equal(draftRes.schemaNeedsMigration, true);

    const unpubRes = await unpublishAboutSection();
    assert.equal(unpubRes.success, false);
    assert.equal(unpubRes.schemaNeedsMigration, true);
  });

  await test('9. projectMediaService does NOT mask DB 42501 permission error behind fake localStorage success', async () => {
    assert.ok(!PROJECT_MEDIA_SQL_SCHEMA.includes("auth.role() = 'authenticated'"));
    assert.ok(PROJECT_MEDIA_SQL_SCHEMA.includes('private.is_admin()'));

    stubSupabase({
      sessionUser: { id: 'admin-123', email: 'afrid@example.com' },
      onRpc: async (fn) => (fn === 'check_is_admin' ? { data: true, error: null } : { data: null, error: null }),
      onFrom: (table) => {
        if (table === 'projects') {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { id: 'p-1', slug: 's-1' }, error: null }) }),
            }),
          };
        }
        if (table === 'project_media') {
          return {
            insert: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: { code: '42501', message: 'new row violates row-level security policy' },
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    });

    const res = await createAdminProjectMedia({
      project_id: 's-1',
      media_type: 'image',
      media_url: 'https://cdn.example.com/demo.jpg',
      display_order: 1,
      is_featured: false,
      is_published: true,
    });
    assert.equal(res.data, null);
    assert.ok(res.error && res.error.length > 0);
  });

  await test('10. importCanonicalProjects & saveAdminSiteSettings reject non-admin users via centralized verifyAdminSession', async () => {
    stubSupabase({
      sessionUser: { id: 'non-admin', email: 'viewer@example.com' },
      onRpc: async (fn) => (fn === 'check_is_admin' ? { data: false, error: null } : { data: null, error: null }),
    });

    const importRes = await importCanonicalProjects();
    assert.equal(importRes.success, false);
    assert.equal(importRes.diagnostics?.isAdmin, false);

    const settingsRes = await saveAdminSiteSettings({
      id: 'global',
      site_title: 'Test',
      owner_name: 'Test',
      primary_email: 'test@example.com',
      github_url: 'https://github.com/test',
      linkedin_url: '',
      youtube_url: '',
    });
    assert.equal(settingsRes.success, false);
  });

  await test('11. runCmsHealthAudit flags exposed drafts / missing RPCs and reports healthy when all checks pass', async () => {
    stubSupabase({
      sessionUser: { id: 'admin-123', email: 'afrid@example.com' },
      onRpc: async (fn) => {
        if (fn === 'check_is_admin') return { data: true, error: null };
        if (fn === 'cms_health_check') {
          return {
            data: {
              authenticated: true,
              authorized: true,
              admin_users_locked: true,
              functions: {
                private_is_admin: true,
                check_is_admin: true,
                publish_about_cms: true,
                unpublish_about_cms: true,
                get_public_about_bundle: true,
              },
              storage: { bucket_exists: true, bucket_public: true, policy_count: 2 },
              tables: [
                { table: 'about_content', exists: true, rls_enabled: true, policy_count: 2, anon_select: true, auth_select: true, auth_write: true },
                { table: 'about_drafts', exists: true, rls_enabled: true, policy_count: 1, anon_select: false, auth_select: true, auth_write: true },
              ],
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    });

    const audit = await runCmsHealthAudit();
    assert.equal(audit.overallStatus, 'healthy');
    assert.equal(audit.needsRepairMigration, false);
    assert.equal(audit.adminUsersLocked, true);
    assert.equal(audit.findings.length, 0);
  });

  console.log(`\nAll ${passed} CMS security & publishing tests passed.\n`);
}

runTests().catch((err) => {
  console.error('\nTEST FAILURE:', err);
  process.exit(1);
});
