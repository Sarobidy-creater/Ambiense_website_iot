// Route protégée — redirige vers /login si non authentifié
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', color: 'var(--clr-text-muted)',
          fontFamily: 'var(--font-display)', fontSize: '1.2rem',
        }}
        role="status"
        aria-live="polite"
      >
        Chargement…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
