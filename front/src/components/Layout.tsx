import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Footer } from './Footer';
import styles from './Layout.module.css';

interface MegaItem { to: string; label: string; desc: string; }
interface NavItem  { to: string; label: string; mega: MegaItem[]; }

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard', label: 'Surveillance',
    mega: [
      { to: '/dashboard', label: "Vue d'ensemble",    desc: 'Donnees G1E en direct' },
      { to: '/dashboard', label: 'Alertes thermiques', desc: 'Seuils et notifications configurables' },
    ],
  },
  {
    to: '/network', label: 'Reseau',
    mega: [
      { to: '/network',          label: 'Tous les groupes', desc: 'Vue globale des 5 groupes IoT' },
      { to: '/network#g1e',      label: 'Nos capteurs G1E', desc: 'Temperature et ventilateur G1E' },
    ],
  },
  {
    to: '/advanced', label: 'Controle',
    mega: [
      { to: '/advanced', label: 'Ventilation G1E',     desc: 'Pilotage du ventilateur principal' },
      { to: '/advanced', label: 'Actionneurs externes', desc: 'Inter-groupes - module beta' },
    ],
  },
];

function UserAvatar({ email }: { email: string }) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {email.charAt(0).toUpperCase()}
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaKey, setMegaKey]   = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); setMegaKey(null); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const transparent = isHome && !scrolled;

  const openMega = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaKey(key);
  };
  const delayClose = () => {
    closeTimer.current = setTimeout(() => setMegaKey(null), 150);
  };
  const stayOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const activeMega = NAV_ITEMS.find(n => n.to === megaKey);

  return (
    <div className={styles.shell}>

      {/* ===== Barre de navigation ===== */}
      <header
        className={`${styles.navbar} ${transparent ? styles.navGlass : styles.navSolid}`}
        role="banner"
        onMouseLeave={delayClose}
      >
        <div className={styles.inner}>

          {/* Marque */}
          <Link to="/" className={styles.wordmark} aria-label="AMBIENSE - Accueil">
            AMBIENSE
          </Link>

          {/* Liens bureau avec groupes pour le mega menu */}
          <nav className={styles.links} aria-label="Navigation principale">
            {NAV_ITEMS.map(item => (
              <div
                key={item.to}
                className={styles.navGroup}
                onMouseEnter={() => openMega(item.to)}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [styles.link, isActive && styles.linkActive, megaKey === item.to && styles.linkOpen]
                      .filter(Boolean).join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>

          {/* Actions droite */}
          <div className={styles.actions}>
            {user ? (
              <div className={styles.userRow}>
                <UserAvatar email={user.email ?? '?'} />
                <span className={styles.userHandle}>{user.email?.split('@')[0]}</span>
                <Link
                  to="/profile"
                  className={styles.btnProfile}
                  aria-label="Acceder au profil"
                >
                  Profil
                </Link>
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

        {/* Mega menu panel */}
        {activeMega && (
          <div
            className={styles.mega}
            onMouseEnter={stayOpen}
            onMouseLeave={delayClose}
            role="navigation"
            aria-label={`Sous-menu ${activeMega.label}`}
          >
            <div className={styles.megaInner}>
              <div className={styles.megaAccent} />
              <div className={styles.megaItems}>
                {activeMega.mega.map(item => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={styles.megaItem}
                    onClick={() => setMegaKey(null)}
                  >
                    <span className={styles.megaLabel}>{item.label}</span>
                    <span className={styles.megaDesc}>{item.desc}</span>
                  </Link>
                ))}
              </div>
              <div className={styles.megaCategory} aria-hidden="true">
                <span>{activeMega.label}</span>
              </div>
            </div>
          </div>
        )}

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
              ? <Link to="/login" className={styles.mAction} onClick={() => setOpen(false)}>Connexion</Link>
              : <>
                  <Link to="/profile" className={styles.mAction} onClick={() => setOpen(false)}>Profil</Link>
                  <button className={styles.mAction} onClick={handleSignOut}>Deconnexion</button>
                </>
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

      {/* ===== Footer global ===== */}
      <Footer />

    </div>
  );
}