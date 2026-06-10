import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Footer } from './Footer';
import styles from './Layout.module.css';

interface MegaItem { to: string; label: string; desc: string; badge?: string; badgeColor?: string; }
interface NavItem  { to: string; label: string; mega: MegaItem[]; wide?: boolean; }

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard', label: 'Surveillance',
    mega: [
      { to: '/dashboard', label: 'Station G1E',   desc: 'Temperature, humidite, ventilateur' },
      { to: '/network',   label: 'Reseau global', desc: 'Tous les groupes connectes' },
    ],
  },
  {
    to: '/network', label: 'Capteurs', wide: true,
    mega: [
      { to: '/sensor/G1E_temperature', label: 'Temperature',  desc: 'DHT15 · °C',    badge: 'G1E', badgeColor: '#C9A240' },
      { to: '/sensor/G1E_humidity',    label: 'Humidite',     desc: 'DHT15 · %',     badge: 'G1E', badgeColor: '#C9A240' },
      { to: '/sensor/G1A_sound',       label: 'Son ambiant',  desc: 'G1A · dB',      badge: 'G1A', badgeColor: '#2BBFBF' },
      { to: '/sensor/G1B_presence',    label: 'Presence',     desc: 'G1B · pers.',   badge: 'G1B', badgeColor: '#3AC98A' },
      { to: '/sensor/G1C_smoke',       label: 'Fumee',        desc: 'G1C · ppm',     badge: 'G1C', badgeColor: '#E8A33D' },
      { to: '/sensor/G1D_alcohol',     label: 'Alcool',       desc: 'G1D · ppm',     badge: 'G1D', badgeColor: '#8B7CF8' },
    ],
  },
  {
    to: '/advanced', label: 'Controle',
    mega: [
      { to: '/advanced', label: 'Ventilation G1E', desc: 'Servo S148 Futaba — pilotage a distance' },
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
  const { theme, toggle } = useTheme();
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
            {/* Toggle dark/light */}
            <button
              className={styles.themeToggle}
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? (
                /* Soleil */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                /* Lune */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
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
            className={`${styles.mega} ${activeMega.wide ? styles.megaWide : ''}`}
            onMouseEnter={stayOpen}
            onMouseLeave={delayClose}
            role="navigation"
            aria-label={`Sous-menu ${activeMega.label}`}
          >
            <div className={activeMega.wide ? styles.megaInnerWide : styles.megaInner}>
              <div className={styles.megaAccent} />
              <div className={activeMega.wide ? styles.megaItemsGrid : styles.megaItems}>
                {activeMega.mega.map(item => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={styles.megaItem}
                    onClick={() => setMegaKey(null)}
                  >
                    {item.badge && (
                      <span
                        className={styles.megaBadge}
                        style={{ color: item.badgeColor, borderColor: `${item.badgeColor}50` }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span className={styles.megaLabel}>{item.label}</span>
                    <span className={styles.megaDesc}>{item.desc}</span>
                  </Link>
                ))}
              </div>
              {!activeMega.wide && (
                <div className={styles.megaCategory} aria-hidden="true">
                  <span>{activeMega.label}</span>
                </div>
              )}
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