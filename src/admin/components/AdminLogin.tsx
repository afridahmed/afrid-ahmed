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
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between items-center p-4 sm:p-6 font-sans transition-colors duration-300">
      {/* Top bar with back to public site */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4">
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO WEBSITE</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] animate-pulse" />
          <span>CMS GATEWAY SECURE</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-8">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 backdrop-blur-xl shadow-[var(--shadow-card)] space-y-6">

          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] mb-1">
              <Lock className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase font-semibold">
                ADMINISTRATION CONSOLE
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5">
                AFRID AHMED
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
                Sign in with verified administrator credentials to access the portfolio content management system.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {activeError && (
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-3.5 flex items-start gap-3 text-xs text-[var(--text-primary)]">
              <AlertCircle className="w-4 h-4 text-[var(--text-primary)] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                {activeError}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-mono text-[var(--text-secondary)]">
                ADMINISTRATOR EMAIL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-mono text-[var(--text-secondary)]">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
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
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] font-semibold text-sm font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
          <div className="pt-3 border-t border-[var(--border-subtle)] text-center">
            <p className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
              Protected by Supabase Auth & Row Level Security.<br />
              Unauthorized access attempts are blocked.
            </p>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl py-4 text-center text-xs font-mono text-[var(--text-muted)]">
        <span>AFRID AHMED PORTFOLIO CMS v1.0 • SECURE ADMIN FOUNDATION</span>
      </footer>
    </div>
  );
};
