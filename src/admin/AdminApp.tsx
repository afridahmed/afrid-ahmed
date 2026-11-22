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
      <div className="min-h-screen w-full bg-[#080B11] text-[#E2E8F0] flex flex-col items-center justify-center p-4 font-mono">
        <div className="rounded-2xl border border-white/10 bg-[#0E131F] p-8 flex flex-col items-center gap-4 text-center max-w-sm">
          <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              VERIFYING CREDENTIALS
            </h2>
            <p className="text-xs text-[#94A3B8]">
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
      <div className="min-h-screen w-full bg-[#080B11] text-[#E2E8F0] flex flex-col items-center justify-center p-4 font-sans">
        <div className="rounded-2xl border border-rose-500/30 bg-[#0E131F] p-7 sm:p-8 flex flex-col items-center gap-5 text-center max-w-lg w-full shadow-2xl">
          <div
            className={`p-3 rounded-full ${
              isMissingSchema
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {isMissingSchema ? (
              <Database className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2 w-full">
            <span
              className={`text-[10px] font-mono tracking-widest uppercase font-semibold ${
                isMissingSchema ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {isMissingSchema ? 'DATABASE SETUP REQUIRED' : 'UNAUTHORIZED ACCOUNT'}
            </span>
            <h2 className="text-xl font-bold text-white">
              {isMissingSchema ? 'CMS REPAIR SQL NOT YET APPLIED' : 'ACCESS DENIED'}
            </h2>

            {isMissingSchema ? (
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Your account (<code className="text-white font-mono">{user.email}</code>) is signed in,
                but the server verification RPC{' '}
                <code className="text-[#38BDF8] font-mono">public.check_is_admin()</code> is not
                installed in your Supabase database yet.
              </p>
            ) : isNotAdmin ? (
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Your account (<code className="text-white font-mono">{user.email}</code>) is
                authenticated in Supabase, but its Auth UID is not registered in the{' '}
                <code className="text-[#38BDF8] font-mono">public.admin_users</code> table.
              </p>
            ) : (
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Administrator verification could not complete for{' '}
                <code className="text-white font-mono">{user.email}</code>.
              </p>
            )}

            {authError && (
              <p className="text-xs text-rose-300/90 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 mt-2">
                {authError}
              </p>
            )}
          </div>

          {/* Signed-in User UID + SQL Editor Bootstrap Instructions */}
          <div className="w-full rounded-xl bg-[#080B11] border border-white/10 p-3.5 text-left space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                YOUR AUTHENTICATED SUPABASE AUTH UID
              </span>
              <button
                type="button"
                onClick={() => handleCopy('uid', user.id)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#38BDF8] hover:text-white cursor-pointer"
              >
                {copiedKey === 'uid' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy UID</span>
                  </>
                )}
              </button>
            </div>
            <code className="block text-[11px] font-mono text-white bg-white/[0.03] px-2.5 py-1.5 rounded border border-white/5 break-all">
              {user.id}
            </code>

            <div className="text-[11px] text-[#94A3B8] leading-relaxed space-y-1">
              <p>
                Run these in <strong className="text-white">Supabase Dashboard → SQL Editor</strong>:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                {isMissingSchema && (
                  <li>
                    Run the CMS Permission Repair SQL migration (creates{' '}
                    <code className="text-[#38BDF8]">public.check_is_admin()</code> & hardens RLS).
                  </li>
                )}
                <li>
                  Ensure your UID above is registered in{' '}
                  <code className="text-[#38BDF8]">public.admin_users</code>, then click{' '}
                  <strong className="text-white">Retry Verification</strong>.
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {isMissingSchema && (
                <button
                  type="button"
                  onClick={() => handleCopy('repair', CMS_REPAIR_SQL_MIGRATION)}
                  className="flex-1 min-w-[140px] py-2 px-3 rounded-lg bg-[#141B2D] hover:bg-[#1A233A] border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedKey === 'repair' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                className="flex-1 min-w-[140px] py-2 px-3 rounded-lg bg-[#141B2D] hover:bg-[#1A233A] border border-[#38BDF8]/30 text-[11px] font-mono text-[#38BDF8] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedKey === 'register' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/30 text-xs font-mono text-[#38BDF8] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RETRY</span>
            </button>
            <button
              onClick={() => (onNavigateHome ? onNavigateHome() : (window.location.href = '/'))}
              className="flex-1 min-w-[110px] py-2.5 px-3 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-white/10 text-xs font-mono text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>WEBSITE</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 min-w-[110px] py-2.5 px-3 rounded-xl bg-rose-500 text-white font-semibold text-xs font-mono flex items-center justify-center gap-2 hover:bg-rose-600 cursor-pointer transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
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
