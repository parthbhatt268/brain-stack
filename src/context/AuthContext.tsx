import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true until first auth resolution

  useEffect(() => {
    // Restore existing session on mount (e.g. returning visitor with active cookie).
    // If no session, loading clears and the sign-in modal is shown — the user
    // must click "Demo login" or "Continue with Google" to enter the app.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep in sync with all auth events (OAuth redirect, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
