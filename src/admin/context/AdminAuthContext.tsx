import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin Verification] Checking user ID:', userId);
      }

      // Approach A: Query public.admin_users table directly
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (import.meta.env.DEV) {
        console.log('[Admin Verification] admin_users query data:', data, 'error:', error);
      }

      // If direct table query succeeded and returned a match
      if (!error && data && data.user_id === userId) {
        if (import.meta.env.DEV) {
          console.log('[Admin Verification] Result (via admin_users query): true');
        }
        return true;
      }

      // Approach B: If admin_users has no SELECT policy for client-side queries
      // or returns null / RLS restriction, verify admin privileges via authorized table query
      // (where RLS evaluates (select private.is_admin()) = true for authenticated admins)
      const { data: testData, error: testError } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1);

      if (import.meta.env.DEV) {
        console.log('[Admin Verification] Fallback test query data:', testData, 'error:', testError);
      }

      const verified = !testError && Array.isArray(testData);

      if (import.meta.env.DEV) {
        console.log('[Admin Verification] Final isAdmin result:', verified);
      }

      return verified;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Admin Verification] Unexpected error during verification:', err);
      }
      return false;
    }
  }, []);

  const handleSession = useCallback(async (currentSession: Session | null) => {
    setIsLoading(true);
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const adminVerified = await checkAdminStatus(currentUser.id);
      setIsAdmin(adminVerified);
      if (!adminVerified) {
        setAuthError('Access Denied: This authenticated account is not authorized as an administrator.');
      } else {
        setAuthError(null);
      }
    } else {
      setIsAdmin(false);
    }
    setIsLoading(false);
  }, [checkAdminStatus]);

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.warn('Session retrieval error:', error.message);
        setIsLoading(false);
        return;
      }
      handleSession(initialSession);
    });

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      await handleSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        const errorMsg = error.message || 'Authentication failed. Please verify your credentials.';
        setAuthError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      if (data.user) {
        const adminVerified = await checkAdminStatus(data.user.id);
        if (!adminVerified) {
          const unauthorizedMsg = 'Access Denied: This account is authenticated in Supabase but is not registered as an administrator in admin_users.';
          setAuthError(unauthorizedMsg);
          setIsAdmin(false);
          // Sign out unauthorized user to maintain clean state
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: unauthorizedMsg };
        }

        setIsAdmin(true);
        setUser(data.user);
        setSession(data.session);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'User data not returned' };
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred during sign in.';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isLoading,
        authError,
        signIn,
        signOut,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
