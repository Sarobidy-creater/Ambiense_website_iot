// =========================================================
//  ForgotPasswordPage — demande de réinitialisation du mot de passe
//  Appelle l'Edge Function admin-user-actions (action: send-reset-email)
//  qui génère un lien Supabase et l'envoie via Resend HTTP API.
//  Bypasse totalement le SMTP Supabase.
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL ?? window.location.origin;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-actions`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action:     'send-reset-email',
            email,
            redirectTo: `${siteUrl}/reset-password`,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error ?? `Erreur serveur (${res.status})`;
        console.error('[ForgotPassword] Edge Function error:', msg);
        setError(msg);
      } else {
        setSent(true);
      }
    } catch (err) {
      console.error('[ForgotPassword] network error:', err);
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
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
