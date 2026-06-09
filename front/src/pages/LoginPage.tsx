// =========================================================
//  LoginPage — connexion email + mot de passe
//  Design split : photo gauche (desktop) + formulaire droite
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError('Identifiants incorrects. Verifiez votre email et mot de passe.');
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
              <li className={styles.panelFeat}>Surveillance temps reel</li>
              <li className={styles.panelFeat}>Alertes thermiques</li>
              <li className={styles.panelFeat}>Controle a distance</li>
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
            <p className={styles.subtitle}>Acces a votre tableau de bord</p>
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
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Mot de passe"
                aria-required="true"
              />
            </div>

            {error && (
              <p className={styles.error} role="alert">{error}</p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !email || !password}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Pas de compte ?{' '}
            <Link to="/signup">Creer un compte</Link>
          </p>

        </div>
      </main>
    </div>
  );
}