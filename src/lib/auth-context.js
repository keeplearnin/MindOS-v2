'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabase } from './supabase-browser';

const AuthContext = createContext({});

const GOOGLE_TOKEN_KEY = 'mindos_google_token';
const GOOGLE_TOKEN_EXPIRY_KEY = 'mindos_google_token_expiry';
const GOOGLE_REFRESH_TOKEN_KEY = 'mindos_google_refresh_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  const storeGoogleToken = (token) => {
    setGoogleToken(token);
    localStorage.setItem(GOOGLE_TOKEN_KEY, token);
    // Google access tokens expire in 1 hour — store expiry with 5min buffer
    const expiry = Date.now() + 55 * 60 * 1000;
    localStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, String(expiry));
    setTokenExpired(false);
  };

  useEffect(() => {
    const supabase = getSupabase();

    // Restore Google token from localStorage (check expiry)
    const savedToken = localStorage.getItem(GOOGLE_TOKEN_KEY);
    const savedExpiry = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
    if (savedToken && savedExpiry && Date.now() < Number(savedExpiry)) {
      setGoogleToken(savedToken);
    } else if (savedToken) {
      // Token expired
      setTokenExpired(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.provider_token) {
        storeGoogleToken(session.provider_token);
      }
      if (session?.provider_refresh_token) {
        localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, session.provider_refresh_token);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.provider_token) {
          storeGoogleToken(session.provider_token);
        }
        if (session?.provider_refresh_token) {
          localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, session.provider_refresh_token);
        }
        if (!session) {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
          localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
          setGoogleToken(null);
          setTokenExpired(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) console.error('Auth error:', error);
  };

  const signOut = async () => {
    const supabase = getSupabase();
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
    localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
    setGoogleToken(null);
    setTokenExpired(false);
    await supabase.auth.signOut();
  };

  const getGoogleToken = useCallback(() => {
    // Check expiry
    const expiry = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() >= Number(expiry)) {
      setTokenExpired(true);
      return null;
    }
    return googleToken || localStorage.getItem(GOOGLE_TOKEN_KEY) || null;
  }, [googleToken]);

  const refreshGoogleToken = async () => {
    // Re-authenticate to get a fresh token
    await signInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithGoogle, signOut,
      getGoogleToken, refreshGoogleToken,
      tokenExpired,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
