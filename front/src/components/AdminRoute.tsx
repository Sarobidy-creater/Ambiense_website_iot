// =========================================================
//  AdminRoute — protège les routes /admin
//  Vérifie : 1) session active  2) rôle 'admin' en BDD
// =========================================================
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface Props {
  children: React.ReactNode;
}

export function AdminRoute({ children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const location = useLocation();

  // Attente chargement auth + rôle
  if (authLoading || roleLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'var(--clr-text-faint)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
        role="status"
      >
        Vérification des droits…
      </div>
    );
  }

  // Non connecté → login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Connecté mais pas admin → accueil (silencieux, pas d'indication)
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
