// =========================================================
//  Contexte d'authentification — Supabase Auth (email+mdp)
// =========================================================
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn:          (email: string, password: string) => Promise<AuthError | null>;
  signUp:          (email: string, password: string) => Promise<AuthError | null>;
  signOut:         () => Promise<void>;
  updatePassword:  (currentPassword: string, newPassword: string) => Promise<AuthError | null>;
  updateDisplayName: (name: string) => Promise<AuthError | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupère la session active au démarrage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Écoute les changements d'état (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const siteUrl = import.meta.env.VITE_SITE_URL ?? window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Lien de confirmation fonctionnel sur n'importe quel appareil
        emailRedirectTo: `${siteUrl}/login`,
      },
    });
    // Supabase ne renvoie pas d'erreur si l'email existe deja :
    // il retourne un user avec identities vides — on le traduit en erreur explicite.
    if (!error && data.user?.identities?.length === 0) {
      return { message: 'USER_ALREADY_EXISTS', name: 'AuthApiError', status: 422 } as AuthError;
    }
    return error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updatePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthError | null> => {
    const email = session?.user?.email;
    if (!email) return { message: 'Non authentifié', name: 'AuthError', status: 401 } as unknown as AuthError;
    // Re-vérifie le mot de passe actuel avant de changer
    const { error: verifyErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyErr) return verifyErr;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error;
  }, [session]);

  const updateDisplayName = useCallback(async (name: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
    return error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        updatePassword,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook pour consommer le contexte auth depuis n'importe quel composant */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
