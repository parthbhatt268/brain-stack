import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const demoEmail    = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

    // If no active session, automatically sign in as the demo user so
    // hackathon visitors see a populated graph without any Google login.
    async function signInAsDemo() {
      if (!demoEmail || !demoPassword) return;
      await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
      // onAuthStateChange fires SIGNED_IN and sets the user
    }

    // Hydrate from existing session on mount; fall back to demo auto-login
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        signInAsDemo();
      }
    });

    // Keep in sync with Supabase auth events (OAuth redirect, sign out, etc.)
    // On sign-out, automatically restore the demo session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        signInAsDemo();
      }
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
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
