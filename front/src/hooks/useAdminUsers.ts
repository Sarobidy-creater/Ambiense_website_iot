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
  resetPwd:   (userId: string, newPassword: string) => Promise<string | null>;
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

  // Reset mot de passe via API admin (requiert service_role)
  const resetPwd = useCallback(async (userId: string, newPassword: string): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    setSaving(false);
    // Si erreur 401 : la cle publishable ne permet pas cette operation
    if (err?.status === 401 || err?.status === 403) {
      return 'Le reset de mot de passe necessite un acces service_role. Utilisez le dashboard Supabase.';
    }
    return err?.message ?? null;
  }, []);

  // Suppression via API admin (requiert service_role)
  const deleteUser = useCallback(async (userId: string): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase.auth.admin.deleteUser(userId);
    setSaving(false);
    if (err?.status === 401 || err?.status === 403) {
      return 'La suppression necessite un acces service_role. Utilisez le dashboard Supabase → Authentication → Users.';
    }
    if (err) return err.message;
    await load();
    return null;
  }, [load]);

  return { users, loading, saving, error, refresh: load, setRole, resetPwd, deleteUser };
}