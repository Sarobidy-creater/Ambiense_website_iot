import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Surveillance' },
  { to: '/devices',   label: 'Capteurs'     },
  { to: '/advanced',  label: 'Contröle'     },
] as const;

function UserAvatar({ email }: { email: string }) {
  return <span className={styles.avatar} aria-hidden="true">{email.charAt(0).toUpperCase()}</span>;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [open, setOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = location.pathname === '/';

  // Navbar devient opaque après le scroll (uniquement sur la home)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Ferme le menu mobile à chaque changement de route
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const transparent = isHome && !scrolled;

  return (
    <div className={styles.shell}>

      {/* ===== Barre de navigation ===== */}
      <header
        className={`${styles.navbar} ${transparent ? styles.navGlass : styles.navSolid}`}
        role="banner"
      >
        <div className={styles.inner}>

          {/* Marque */}
          <Link to="/" className={styles.wordmark} aria-label="AMBIENSE — Accueil">
            AMBIENSE
          </Link>

          {/* Liens bureau */}
          <nav className={styles.links} aria-label="Navigation principale">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Actions droite */}
          <div className={styles.actions}>
            {user ? (
              <div className={styles.userRow}>
                <UserAvatar email={user.email ?? '?'} />
                <span className={styles.userHandle}>{user.email?.split('@')[0]}</span>
                <button
                  className={styles.btnSignOut}
                  onClick={handleSignOut}
                  aria-label="Se deconnecter"
                >
                  Deconnexion
                </button>
              </div>
            ) : (
              <Link to="/login" className={styles.btnConnect}>Connexion</Link>
            )}

            {/* Hamburger mobile */}
            <button
              className={styles.hamburger}
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
            >
              <span className={`${styles.hBar} ${open ? styles.hBarOpen1 : ''}`} />
              <span className={`${styles.hBar} ${open ? styles.hBarOpen2 : ''}`} />
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {open && (
          <div className={styles.mobile} role="navigation" aria-label="Menu mobile">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.mLink} ${isActive ? styles.mLinkActive : ''}`
                }
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            {!user
              ? <Link to="/login"  className={styles.mAction} onClick={() => setOpen(false)}>Connexion</Link>
              : <button className={styles.mAction} onClick={handleSignOut}>Deconnexion</button>
            }
          </div>
        )}
      </header>

      {/* ===== Contenu ===== */}
      <main
        id="main-content"
        className={`${styles.main} ${isHome ? styles.mainHome : styles.mainPage}`}
        tabIndex={-1}
      >
        {children}
      </main>

    </div>
  );
}