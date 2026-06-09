// =========================================================
//  LoginPage — connexion email + mot de passe
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Baobab } from '../components/svg/Baobab';
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
      // Message générique pour ne pas exposer d'info sensible
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className={styles.page}>
      {/* Décoration baobabs en fond */}
      <div className={styles.baobabLeft}  aria-hidden="true"><Baobab height={200} opacity={0.15} /></div>
      <div className={styles.baobabRight} aria-hidden="true"><Baobab height={160} opacity={0.1} color="#E8A33D" /></div>

      <main className={styles.card} aria-labelledby="login-title">
        {/* En-tête */}
        <div className={styles.header}>
          <span className={styles.emoji} aria-hidden="true">🏟️</span>
          <h1 id="login-title" className={styles.title}>Connexion</h1>
          <p className={styles.subtitle}>Bar G1E · Coupe du Monde</p>
        </div>

        {/* Formulaire */}
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
              placeholder="••••••••"
              aria-required="true"
            />
          </div>

          {/* Message d'erreur accessible */}
          {error && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {/* Lien inscription */}
        <p className={styles.switchLink}>
          Pas encore de compte ?{' '}
          <Link to="/signup">Créer un compte</Link>
        </p>
      </main>
    </div>
  );
}
