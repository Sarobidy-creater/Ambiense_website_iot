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

  // Dépend de user?.id (stable) plutôt que de l'objet user entier
  const userId = user?.id ?? null;

  useEffect(() => {
    // Auth pas encore résolue — on attend
    if (authLoading) return;

    // Non connecté
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()           // maybeSingle : ne plante pas si 0 ligne
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[useIsAdmin] Erreur RLS/DB :', error.message, error);
        }
        console.log('[useIsAdmin] userId:', userId, '→ data:', data);
        setIsAdmin(data?.role === 'admin');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId, authLoading]);

  return { isAdmin, loading };
}
