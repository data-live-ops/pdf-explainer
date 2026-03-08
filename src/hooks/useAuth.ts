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
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check if there's an OAuth callback in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // Clear the hash from URL for cleaner look
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          if (!validateEmailDomain(session.user.email)) {
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed`);
            }
          } else {
            if (mounted) {
              setUser(session.user);
            }
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        if (!validateEmailDomain(session.user.email)) {
          await supabase.auth.signOut();
          setUser(null);
          setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed`);
        } else {
          setUser(session.user);
          setError(null);
          // Clear hash from URL after successful sign in
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: ALLOWED_DOMAIN,
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
