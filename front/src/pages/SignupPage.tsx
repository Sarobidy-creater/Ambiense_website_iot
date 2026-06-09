// =========================================================
//  SignupPage — inscription email + mot de passe
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Baobab } from '../components/svg/Baobab';
import styles from './AuthPage.module.css';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    const err = await signUp(email, password);
    setLoading(false);

    if (err) {
      setError("Impossible de créer le compte. Vérifiez l'email ou réessayez.");
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <main className={`${styles.card} ${styles.successCard}`} role="status">
          <span className={styles.emoji} aria-hidden="true">✅</span>
          <h1 className={styles.title}>Compte créé !</h1>
          <p className={styles.subtitle}>
            Vérifiez votre boîte mail pour confirmer votre inscription.<br />
            Redirection dans 3 secondes…
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.baobabLeft}  aria-hidden="true"><Baobab height={200} opacity={0.15} /></div>
      <div className={styles.baobabRight} aria-hidden="true"><Baobab height={160} opacity={0.1} color="#E8A33D" /></div>

      <main className={styles.card} aria-labelledby="signup-title">
        <div className={styles.header}>
          <span className={styles.emoji} aria-hidden="true">🌿</span>
          <h1 id="signup-title" className={styles.title}>Créer un compte</h1>
          <p className={styles.subtitle}>Bar G1E · Coupe du Monde</p>
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
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm" className={styles.label}>Confirmer le mot de passe</label>
            <input
              id="confirm"
              type="password"
              className={styles.input}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              aria-required="true"
            />
          </div>

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
            {loading ? 'Création…' : "Créer mon compte"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </main>
    </div>
  );
}
