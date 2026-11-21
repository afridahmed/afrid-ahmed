import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { verifyAdminSession } from '../../services/cmsAuthService';

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

  const checkAdminStatus = useCallback(async (_userId: string): Promise<{ authorized: boolean; error?: string }> => {
    const verification = await verifyAdminSession();
    return {
      authorized: verification.authorized,
      error: verification.error,
    };
  }, []);

  const handleSession = useCallback(async (currentSession: Session | null) => {
    setIsLoading(true);
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const verification = await checkAdminStatus(currentUser.id);
      setIsAdmin(verification.authorized);
      if (!verification.authorized) {
        setAuthError(
          verification.error || 'Access Denied: This authenticated account is not authorized as an administrator.'
        );
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
        const verification = await checkAdminStatus(data.user.id);
        if (!verification.authorized) {
          const unauthorizedMsg =
            verification.error ||
            'Access Denied: This account is authenticated in Supabase but is not registered as an administrator.';
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
