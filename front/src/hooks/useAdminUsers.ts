// =========================================================
//  useAdminUsers — gestion des comptes via user_profiles
//  Utilise la vue user_profiles (lisible par les admins)
//  et la table user_roles pour les modifications de rôle.
//  Le reset MDP et la suppression passent par supabase.auth.admin
//  (nécessite service_role → uniquement disponible en admin).
// =========================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminUser {
  id:              string;
  email:           string;
  created_at:      string;
  last_sign_in_at: string | null;
  role:            'admin' | 'user';
  confirmed:       boolean;
}

interface Result {
  users:      AdminUser[];
  loading:    boolean;
  saving:     boolean;
  error:      string | null;
  refresh:    () => void;
  setRole:    (userId: string, role: 'admin' | 'user') => Promise<string | null>;
  resetPwd:   (userEmail: string) => Promise<string | null>;
  deleteUser: (userId: string) => Promise<string | null>;
}

export function useAdminUsers(): Result {
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Lit depuis la vue user_profiles (accessible aux admins via RLS)
      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('id, email, created_at, last_sign_in_at, email_confirmed_at, role')
        .order('email');

      if (err) {
        setError(err.message);
        return;
      }

      const mapped: AdminUser[] = (data ?? []).map((u: any) => ({
        id:              u.id,
        email:           u.email ?? '(sans email)',
        created_at:      u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        role:            u.role as 'admin' | 'user',
        confirmed:       !!u.email_confirmed_at,
      }));

      setUsers(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Change le role d'un utilisateur
  const setRole = useCallback(async (userId: string, role: 'admin' | 'user'): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
    setSaving(false);
    if (err) return err.message;
    await load();
    return null;
  }, [load]);

  // Reset mot de passe : génère un lien via Edge Function + Resend HTTP API (bypasse le SMTP Supabase)
  const resetPwd = useCallback(async (userEmail: string): Promise<string | null> => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const siteUrl = import.meta.env.VITE_SITE_URL ?? window.location.origin;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-actions`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            action:     'send-reset-email',
            email:      userEmail,
            redirectTo: `${siteUrl}/reset-password`,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return body.error ?? `Erreur HTTP ${res.status}`;
      }
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Erreur réseau';
    } finally {
      setSaving(false);
    }
  }, []);

  // Suppression via Edge Function 'admin-user-actions'
  const deleteUser = useCallback(async (userId: string): Promise<string | null> => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-actions`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ action: 'delete-user', userId }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return body.error ?? `Erreur HTTP ${res.status}`;
      }
      await load();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Erreur réseau';
    } finally {
      setSaving(false);
    }
  }, [load]);

  return { users, loading, saving, error, refresh: load, setRole, resetPwd, deleteUser };
}