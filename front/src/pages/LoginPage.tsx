// =========================================================
//  LoginPage — connexion email + mot de passe
//  Design split : photo gauche (desktop) + formulaire droite
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from '../components/PasswordToggleIcons';
import { useAuth } from '../auth/AuthContext';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError('Identifiants incorrects. Vérifiez votre e-mail et mot de passe.');
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Panneau gauche : photo bar ── */}
      <div
        className={styles.panel}
        style={{ backgroundImage: "url(" + heroImg + ")" }}
        aria-hidden="true"
      >
        <div className={styles.panelOverlay}>
          <Link to="/" className={styles.panelWordmark} aria-label="AMBIENSE">
            AMBIENSE
          </Link>
          <div className={styles.panelContent}>
            <blockquote className={styles.panelQuote}>
              &ldquo;Intelligence environnementale<br />pour les soirees parfaites.&rdquo;
            </blockquote>
            <ul className={styles.panelFeatures}>
              <li className={styles.panelFeat}>Surveillance temps réel</li>
              <li className={styles.panelFeat}>Alertes thermiques</li>
              <li className={styles.panelFeat}>Contrôle à distance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <main className={styles.formSide} aria-labelledby="login-title">
        <div className={styles.formInner}>

          <Link to="/" className={styles.wordmarkMobile}>AMBIENSE</Link>

          <div className={styles.header}>
            <h1 id="login-title" className={styles.title}>Connexion</h1>
            <p className={styles.subtitle}>Accès à votre tableau de bord</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Adresse e-mail</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                aria-required="true"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Mot de passe</label>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className={styles.input}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Mot de passe"
                  aria-required="true"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">{error}</p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !email || !password}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className={styles.switchLink} style={{ textAlign: 'right', marginTop: 'var(--sp-3)' }}>
            <Link to="/forgot-password" style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-text-faint)' }}>
              Mot de passe oublié ?
            </Link>
          </p>

          <p className={styles.switchLink}>
            Pas de compte ?{' '}
            <Link to="/signup">Créer un compte</Link>
          </p>

        </div>
      </main>
    </div>
  );
}