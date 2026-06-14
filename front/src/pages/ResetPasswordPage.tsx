// =========================================================
//  ResetPasswordPage — définir un nouveau mot de passe
//  Supabase redirige ici après le lien envoyé par email :
//    https://ambiense.vercel.app/reset-password#access_token=...&type=recovery
// =========================================================
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './AuthPage.module.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  // Supabase insère le token dans le hash : #access_token=...&type=recovery
  // onAuthStateChange le détecte automatiquement et crée une session temporaire.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError('Impossible de mettre à jour le mot de passe. Le lien est peut-être expiré.');
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Panneau gauche : photo ── */}
      <div
        className={styles.panel}
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden="true"
      >
        <div className={styles.panelOverlay}>
          <Link to="/" className={styles.panelWordmark} aria-label="AMBIENSE">
            AMBIENSE
          </Link>
          <div className={styles.panelContent}>
            <blockquote className={styles.panelQuote}>
              &ldquo;Intelligence environnementale<br />pour les soirées parfaites.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <main className={styles.formSide} aria-labelledby="reset-title">
        <div className={styles.formInner}>

          <Link to="/" className={styles.wordmarkMobile}>AMBIENSE</Link>

          <div className={styles.header}>
            <h1 id="reset-title" className={styles.title}>Nouveau mot de passe</h1>
            <p className={styles.subtitle}>Choisissez un mot de passe sécurisé</p>
          </div>

          {success ? (
            <p style={{ color: 'var(--clr-success, #4ade80)', marginTop: '1rem' }}>
              Mot de passe mis à jour. Redirection vers la connexion…
            </p>
          ) : !tokenReady ? (
            <p style={{ color: 'var(--clr-text-muted)', marginTop: '1rem' }}>
              Vérification du lien en cours…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="new-password" className={styles.label}>Nouveau mot de passe</label>
                <input
                  id="new-password"
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirm-password" className={styles.label}>Confirmer le mot de passe</label>
                <input
                  id="confirm-password"
                  type="password"
                  className={styles.input}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <p role="alert" className={styles.error}>{error}</p>
              )}

              <button
                type="submit"
                className={styles.submit}
                disabled={loading}
              >
                {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          )}

          <p className={styles.altLink}>
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
