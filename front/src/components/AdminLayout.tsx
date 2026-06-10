// =========================================================
//  AdminLayout — layout latéral dédié à l'espace admin
//  Navbar admin compacte + sidebar de navigation
// =========================================================
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './AdminLayout.module.css';

const ADMIN_NAV = [
  { to: '/admin',              label: 'Vue d\'ensemble',  icon: 'overview'   },
  { to: '/admin/analytics',    label: 'Analytics',        icon: 'analytics'  },
  { to: '/admin/users',        label: 'Utilisateurs',     icon: 'users'      },
  { to: '/admin/devices',      label: 'Appareils',        icon: 'devices'    },
  { to: '/admin/measurements', label: 'Mesures',          icon: 'chart'      },
  { to: '/admin/commands',     label: 'Commandes',        icon: 'cmd'        },
  { to: '/admin/schema',       label: 'Schéma SQL',       icon: 'db'         },
] as const;

function NavIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    overview: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="13" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="13" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="13" y="13" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    analytics: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 16l4-5 4 3 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    users: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 3.1a3.5 3.5 0 0 1 0 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M21 21a5 5 0 0 0-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    devices: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3"/>
      </svg>
    ),
    chart: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="3 17 9 11 13 15 21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    cmd: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="4 17 10 11 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    db: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  };
  return <span className={styles.navIcon}>{icons[type] ?? null}</span>;
}

interface Props {
  children: React.ReactNode;
}

export function AdminLayout({ children }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={styles.shell}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar} aria-label="Navigation admin">

        {/* Marque */}
        <div className={styles.sideHead}>
          <Link to="/" className={styles.wordmark}>AMBIENSE</Link>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        {/* Liens */}
        <nav className={styles.sideNav} aria-label="Menu admin">
          {ADMIN_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <NavIcon type={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pied sidebar */}
        <div className={styles.sideFoot}>
          <Link to="/dashboard" className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour au site
          </Link>
          <div className={styles.userRow}>
            <span className={styles.userEmail}>{user?.email?.split('@')[0]}</span>
            <button className={styles.signOutBtn} onClick={handleSignOut}>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className={styles.main} id="admin-main" tabIndex={-1}>
        {children}
      </main>

    </div>
  );
}
