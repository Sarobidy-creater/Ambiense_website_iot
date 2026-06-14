// =========================================================
//  ForgotPasswordPage — demande de réinitialisation du mot de passe
//  Supabase envoie un email avec un lien de reset.
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './AuthPage.module.css';

export function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const siteUrl = import.meta.env.VITE_SITE_URL ?? window.location.origin;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });
    setLoading(false);
    if (err) {
      console.error('[ForgotPassword] Supabase error:', err);
      const msg = err.message?.toLowerCase().includes('rate limit')
        ? 'Trop de tentatives. Attendez quelques minutes avant de réessayer.'
        : 'Impossible d\'envoyer l\'email. Vérifiez l\'adresse saisie.';
      setError(msg);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.panel}
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-hidden="true">
          <div className={styles.panelOverlay}>
            <Link to="/" className={styles.panelWordmark}>AMBIENSE</Link>
          </div>
        </div>
        <main className={styles.formSide}>
          <div className={styles.formInner}>
            <Link to="/" className={styles.wordmarkMobile}>AMBIENSE</Link>
            <div className={styles.header}>
              <h1 className={styles.title}>Email envoyé</h1>
              <p className={styles.subtitle}>
                Si un compte existe pour <strong>{email}</strong>, vous allez
                recevoir un lien de réinitialisation dans quelques instants.
              </p>
            </div>
            <p className={styles.switchLink}>
              <Link to="/login">Retour à la connexion</Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Panneau gauche */}
      <div className={styles.panel}
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden="true">
        <div className={styles.panelOverlay}>
          <Link to="/" className={styles.panelWordmark}>AMBIENSE</Link>
          <div className={styles.panelContent}>
            <blockquote className={styles.panelQuote}>
              &ldquo;Récupérez l&rsquo;accès<br />à votre espace.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>

      {/* Panneau droit */}
      <main className={styles.formSide} aria-labelledby="forgot-title">
        <div className={styles.formInner}>

          <Link to="/" className={styles.wordmarkMobile}>AMBIENSE</Link>

          <div className={styles.header}>
            <h1 id="forgot-title" className={styles.title}>Mot de passe oublié</h1>
            <p className={styles.subtitle}>
              Saisissez votre adresse e-mail — nous vous envoyons un lien de réinitialisation.
            </p>
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

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !email}
            >
              {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
            </button>
          </form>

          <p className={styles.switchLink}>
            <Link to="/login">Retour à la connexion</Link>
          </p>

        </div>
      </main>
    </div>
  );
}
