'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from './supabase-browser';

const AuthContext = createContext({});

const GOOGLE_TOKEN_KEY = 'mindos_google_token';
const GOOGLE_REFRESH_TOKEN_KEY = 'mindos_google_refresh_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleToken, setGoogleToken] = useState(null);

  useEffect(() => {
    const supabase = getSupabase();

    // Restore Google token from localStorage
    const savedToken = localStorage.getItem(GOOGLE_TOKEN_KEY);
    if (savedToken) setGoogleToken(savedToken);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // provider_token is only available right after OAuth login
      if (session?.provider_token) {
        setGoogleToken(session.provider_token);
        localStorage.setItem(GOOGLE_TOKEN_KEY, session.provider_token);
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
          setGoogleToken(session.provider_token);
          localStorage.setItem(GOOGLE_TOKEN_KEY, session.provider_token);
        }
        if (session?.provider_refresh_token) {
          localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, session.provider_refresh_token);
        }
        if (!session) {
          // Signed out — clear tokens
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
          setGoogleToken(null);
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
    localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
    setGoogleToken(null);
    await supabase.auth.signOut();
  };

  const getGoogleToken = () => {
    return googleToken || localStorage.getItem(GOOGLE_TOKEN_KEY) || null;
  };

  // Force re-login if token is expired
  const refreshGoogleToken = async () => {
    // The simplest approach: ask user to re-authenticate
    await signInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, getGoogleToken, refreshGoogleToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
