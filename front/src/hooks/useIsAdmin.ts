// =========================================================
//  useIsAdmin — vérifie si l'utilisateur connecté est admin
//  Requête la table user_roles (chargée une seule fois)
// =========================================================
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface Result {
  isAdmin:  boolean;
  loading:  boolean;
}

export function useIsAdmin(): Result {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin');
        setLoading(false);
      });
  }, [user, authLoading]);

  return { isAdmin, loading };
}
