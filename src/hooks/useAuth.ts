import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const ALLOWED_DOMAIN = 'colearn.id';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateEmailDomain = (email: string | undefined): boolean => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return domain === ALLOWED_DOMAIN;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Validate email domain
        if (!validateEmailDomain(session.user.email)) {
          await supabase.auth.signOut();
          setUser(null);
          setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed`);
        } else {
          setUser(session.user);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Validate email domain on sign in
        if (!validateEmailDomain(session.user.email)) {
          await supabase.auth.signOut();
          setUser(null);
          setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed`);
        } else {
          setUser(session.user);
          setError(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: ALLOWED_DOMAIN, // Restrict to colearn.id domain in Google picker
        },
        redirectTo: window.location.origin,
      },
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

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    clearError: () => setError(null),
  };
}
