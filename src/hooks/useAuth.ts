import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const ALLOWED_DOMAIN = '@colearn.id';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);

    // Validate email domain
    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
      return false;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return false;
    }

    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);

    // Validate email domain
    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
      return false;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return false;
    }

    return true;
  }, []);

  const signOut = useCallback(async () => {
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
      return false;
    }
    return true;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
      return false;
    }

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email);

    if (authError) {
      setError(authError.message);
      return false;
    }

    return true;
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError: () => setError(null),
  };
}
