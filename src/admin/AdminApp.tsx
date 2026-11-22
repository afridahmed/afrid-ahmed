import React, { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLogin } from './components/AdminLogin';
import { AdminLayout } from './components/AdminLayout';
import { CMS_REPAIR_SQL_MIGRATION } from '../services/cmsRepairSql';
import {
  ShieldAlert,
  LogOut,
  ArrowLeft,
  Loader2,
  Database,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface AdminAppProps {
  onNavigateHome?: () => void;
}

const AdminContent: React.FC<AdminAppProps> = ({ onNavigateHome }) => {
  const {
    session,
    user,
    isAdmin,
    isLoading,
    authError,
    authCategory,
    signOut,
    retryVerification,
  } = useAdminAuth();
  const [copiedKey, setCopiedKey] = useState<'uid' | 'repair' | 'register' | null>(null);

  const handleCopy = async (key: 'uid' | 'repair' | 'register', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Clipboard API unavailable in restricted iframe
    }
  };

  // 1. Loading state during session inspection or verification
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 font-mono transition-colors duration-300">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 flex flex-col items-center gap-4 text-center max-w-sm shadow-[var(--shadow-card)]">
          <Loader2 className="w-8 h-8 text-[var(--text-primary)] animate-spin" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              VERIFYING CREDENTIALS
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Inspecting Supabase session & administrator rights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Login screen
  if (!session || !user) {
    return <AdminLogin onNavigateHome={onNavigateHome} />;
  }

  // 3. Authenticated but unauthorized / DB migration required
  if (!isAdmin) {
    const isMissingSchema = authCategory === 'MISSING_SCHEMA';
    const isNotAdmin = !authCategory || authCategory === 'NOT_ADMIN';
    const registerUidSql = `INSERT INTO public.admin_users (user_id)\nVALUES ('${user.id}'::uuid)\nON CONFLICT (user_id) DO NOTHING;\nNOTIFY pgrst, 'reload schema';`;

    return (
      <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-7 sm:p-8 flex flex-col items-center gap-5 text-center max-w-lg w-full shadow-[var(--shadow-card)]">
          <div className="p-3 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
            {isMissingSchema ? (
              <Database className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2 w-full">
            <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[var(--text-secondary)]">
              {isMissingSchema ? 'DATABASE SETUP REQUIRED' : 'UNAUTHORIZED ACCOUNT'}
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {isMissingSchema ? 'CMS REPAIR SQL NOT YET APPLIED' : 'ACCESS DENIED'}
            </h2>

            {isMissingSchema ? (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your account (<code className="text-[var(--text-primary)] font-mono">{user.email}</code>) is signed in,
                but the server verification RPC{' '}
                <code className="text-[var(--text-primary)] font-mono">public.check_is_admin()</code> is not
                installed in your Supabase database yet.
              </p>
            ) : isNotAdmin ? (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your account (<code className="text-[var(--text-primary)] font-mono">{user.email}</code>) is
                authenticated in Supabase, but its Auth UID is not registered in the{' '}
                <code className="text-[var(--text-primary)] font-mono">public.admin_users</code> table.
              </p>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Administrator verification could not complete for{' '}
                <code className="text-[var(--text-primary)] font-mono">{user.email}</code>.
              </p>
            )}

            {authError && (
              <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] p-2.5 rounded-lg border border-[var(--border-strong)] mt-2">
                {authError}
              </p>
            )}
          </div>

          {/* Signed-in User UID + SQL Editor Bootstrap Instructions */}
          <div className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3.5 text-left space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                YOUR AUTHENTICATED SUPABASE AUTH UID
              </span>
              <button
                type="button"
                onClick={() => handleCopy('uid', user.id)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {copiedKey === 'uid' ? (
                  <>
                    <Check className="w-3 h-3 text-[var(--text-primary)]" />
                    <span className="text-[var(--text-primary)]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy UID</span>
                  </>
                )}
              </button>
            </div>
            <code className="block text-[11px] font-mono text-[var(--text-primary)] bg-[var(--bg-elevated)] px-2.5 py-1.5 rounded border border-[var(--border-subtle)] break-all">
              {user.id}
            </code>

            <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed space-y-1">
              <p>
                Run these in <strong className="text-[var(--text-primary)]">Supabase Dashboard → SQL Editor</strong>:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                {isMissingSchema && (
                  <li>
                    Run the CMS Permission Repair SQL migration (creates{' '}
                    <code className="text-[var(--text-primary)]">public.check_is_admin()</code> & hardens RLS).
                  </li>
                )}
                <li>
                  Ensure your UID above is registered in{' '}
                  <code className="text-[var(--text-primary)]">public.admin_users</code>, then click{' '}
                  <strong className="text-[var(--text-primary)]">Retry Verification</strong>.
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {isMissingSchema && (
                <button
                  type="button"
                  onClick={() => handleCopy('repair', CMS_REPAIR_SQL_MIGRATION)}
                  className="flex-1 min-w-[140px] py-2 px-3 rounded-lg bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedKey === 'repair' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Repair SQL Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Repair SQL</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCopy('register', registerUidSql)}
                className="flex-1 min-w-[140px] py-2 px-3 rounded-lg bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedKey === 'register' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Bootstrap SQL Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Register UID SQL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full pt-1">
            <button
              onClick={() => retryVerification()}
              className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-xs font-mono font-bold text-[var(--accent-contrast)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RETRY</span>
            </button>
            <button
              onClick={() => (onNavigateHome ? onNavigateHome() : (window.location.href = '/'))}
              className="flex-1 min-w-[110px] py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>WEBSITE</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 min-w-[110px] py-2.5 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Administrator: Render Admin CMS Dashboard & Layout
  return <AdminLayout onNavigateHome={onNavigateHome} />;
};

export const AdminApp: React.FC<AdminAppProps> = ({ onNavigateHome }) => {
  return (
    <AdminAuthProvider>
      <AdminContent onNavigateHome={onNavigateHome} />
    </AdminAuthProvider>
  );
};
