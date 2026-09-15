import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, Mail, KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onNavigateHome?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigateHome }) => {
  const { signIn, isLoading, authError, clearError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your administrator password.');
      return;
    }

    const result = await signIn(email, password);
    if (!result.success && result.error) {
      setLocalError(result.error);
    }
  };

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen w-full bg-[#080B11] text-[#E2E8F0] flex flex-col justify-between items-center p-4 sm:p-6 font-sans">
      {/* Top bar with back to public site */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4">
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#94A3B8] hover:text-[#38BDF8] transition-colors cursor-pointer px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-[#0E131F]/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO WEBSITE</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>CMS GATEWAY SECURE</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-8">
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/90 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#141B2D] border border-white/10 text-[#38BDF8] mb-1">
              <Lock className="w-5 h-5" />
            </div>
            
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
                ADMINISTRATION CONSOLE
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                AFRID AHMED
              </h1>
              <p className="text-xs text-[#94A3B8] mt-1 font-light">
                Sign in with verified administrator credentials to access the portfolio content management system.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {activeError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                {activeError}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-mono text-[#CBD5E1]">
                ADMINISTRATOR EMAIL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  disabled={isLoading}
                  placeholder="admin@afrid.dev"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-mono text-[#CBD5E1]">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#94A3B8] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080B11] font-semibold text-sm font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.2)] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>SIGN IN TO CMS</span>
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="pt-3 border-t border-white/5 text-center">
            <p className="text-[11px] text-[#64748B] font-mono leading-relaxed">
              Protected by Supabase Auth & Row Level Security.<br />
              Unauthorized access attempts are blocked.
            </p>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl py-4 text-center text-xs font-mono text-[#475569]">
        <span>AFRID AHMED PORTFOLIO CMS v1.0 • SECURE ADMIN FOUNDATION</span>
      </footer>
    </div>
  );
};
