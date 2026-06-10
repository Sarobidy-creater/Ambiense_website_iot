// =========================================================
//  useAdminUsers — gestion des comptes utilisateurs
//  Utilise l'API Admin de Supabase via la clé service_role
//  ⚠️  Ces appels ne doivent être faits que côté admin
// =========================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminUser {
  id:          string;
  email:       string;
  created_at:  string;
  last_sign_in_at: string | null;
  role:        'admin' | 'user';
  confirmed:   boolean;
}

interface Result {
  users:    AdminUser[];
  loading:  boolean;
  saving:   boolean;
  error:    string | null;
  refresh:  () => void;
  setRole:  (userId: string, role: 'admin' | 'user') => Promise<string | null>;
  resetPwd: (userId: string, newPassword: string) => Promise<string | null>;
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
      // Récupère la liste depuis auth.users via admin API
      const { data, error: err } = await supabase.auth.admin.listUsers();
      if (err) { setError(err.message); return; }

      // Récupère aussi les rôles depuis user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role as 'admin' | 'user']));

      const mapped: AdminUser[] = (data.users ?? []).map(u => ({
        id:              u.id,
        email:           u.email ?? '(sans email)',
        created_at:      u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        role:            roleMap.get(u.id) ?? 'user',
        confirmed:       !!u.email_confirmed_at,
      }));

      setUsers(mapped.sort((a, b) => a.email.localeCompare(b.email)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const resetPwd = useCallback(async (userId: string, newPassword: string): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    setSaving(false);
    return err?.message ?? null;
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase.auth.admin.deleteUser(userId);
    setSaving(false);
    if (err) return err.message;
    await load();
    return null;
  }, [load]);

  return { users, loading, saving, error, refresh: load, setRole, resetPwd, deleteUser };
}
