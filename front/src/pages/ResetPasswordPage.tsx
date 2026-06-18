// =========================================================
//  ResetPasswordPage — définir un nouveau mot de passe
//  Deux modes de réception du token :
//  1) ?token_hash=xxx&type=recovery  (notre Edge Function)
//     → appel direct à supabase.auth.verifyOtp() pour établir la session
//  2) #access_token=...&type=recovery  (ancien flux Supabase, fallback)
//     → détecté via onAuthStateChange PASSWORD_RECOVERY
// =========================================================
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './AuthPage.module.css';
import { EyeIcon, EyeOffIcon } from '../components/PasswordToggleIcons';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    // Mode 1 : token_hash dans les query params (notre flux Edge Function)
    const params     = new URLSearchParams(window.location.search);
    const tokenHash  = params.get('token_hash');
    const type       = params.get('type');

    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        .then(({ error: err }) => {
          if (err) {
            setError(`Lien invalide ou expiré : ${err.message}`);
          } else {
            setTokenReady(true);
            // Nettoie les params de l'URL sans recharger la page
            window.history.replaceState({}, '', window.location.pathname);
          }
        });
      return;
    }

    // Mode 2 : fallback — hash #access_token=...&type=recovery (ancien flux Supabase)
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
                <div className={styles.passwordWrap}>
                  <input
                    id="new-password"
                    type={showPwd ? 'text' : 'password'}
                    className={styles.input}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
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

              <div className={styles.field}>
                <label htmlFor="confirm-password" className={styles.label}>Confirmer le mot de passe</label>
                <div className={styles.passwordWrap}>
                  <input
                    id="confirm-password"
                    type={showConf ? 'text' : 'password'}
                    className={styles.input}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConf(v => !v)}
                    aria-label={showConf ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showConf ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className={styles.error}>{error}</p>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          )}

          <p className={styles.switchLink}>
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
