import React from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLogin } from './components/AdminLogin';
import { AdminLayout } from './components/AdminLayout';
import { ShieldAlert, LogOut, ArrowLeft, Loader2 } from 'lucide-react';

interface AdminAppProps {
  onNavigateHome?: () => void;
}

const AdminContent: React.FC<AdminAppProps> = ({ onNavigateHome }) => {
  const { session, user, isAdmin, isLoading, authError, signOut } = useAdminAuth();

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

  // 3. Authenticated but unauthorized (not in admin_users): Access Denied Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#080B11] text-[#E2E8F0] flex flex-col items-center justify-center p-4 font-sans">
        <div className="rounded-2xl border border-rose-500/30 bg-[#0E131F] p-8 flex flex-col items-center gap-5 text-center max-w-md shadow-2xl">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase font-semibold">
              UNAUTHORIZED ACCOUNT
            </span>
            <h2 className="text-xl font-bold text-white">
              ACCESS DENIED
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Your account (<code className="text-white font-mono">{user.email}</code>) is authenticated in Supabase, but is not registered in the <code className="text-[#38BDF8] font-mono">admin_users</code> table.
            </p>
            {authError && (
              <p className="text-xs text-rose-300/90 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 mt-2">
                {authError}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-white/10 text-xs font-mono text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>WEBSITE</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 text-white font-semibold text-xs font-mono flex items-center justify-center gap-2 hover:bg-rose-600 cursor-pointer transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
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
