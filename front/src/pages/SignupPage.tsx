// =========================================================
//  SignupPage — inscription email + mot de passe
//  Design split : photo gauche (desktop) + formulaire droite
// =========================================================
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from '../components/PasswordToggleIcons';
import { useAuth } from '../auth/AuthContext';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './AuthPage.module.css';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);

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
      if (err.message === 'USER_ALREADY_EXISTS') {
        setEmailTaken(true);
      } else {
        setError(err.message || "Impossible de créer le compte. Vérifiez l'email ou réessayez.");
      }
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <main className={[styles.formSide, styles.successCard].join(' ')} role="status">
          <span className={styles.emoji} aria-hidden="true">✓</span>
          <h1 className={styles.title}>Compte créé !</h1>
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
              &ldquo;Rejoignez la plateforme de<br />surveillance intelligente.&rdquo;
            </blockquote>
            <ul className={styles.panelFeatures}>
              <li className={styles.panelFeat}>Accès tableau de bord</li>
              <li className={styles.panelFeat}>Données en temps réel</li>
              <li className={styles.panelFeat}>Contrôle des actionneurs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <main className={styles.formSide} aria-labelledby="signup-title">
        <div className={styles.formInner}>

          <Link to="/" className={styles.wordmarkMobile}>AMBIENSE</Link>

          <div className={styles.header}>
            <h1 id="signup-title" className={styles.title}>Créer un compte</h1>
            <p className={styles.subtitle}>Accès à la plateforme AMBIENSE</p>
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
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
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

            <div className={styles.field}>
              <label htmlFor="confirm" className={styles.label}>Confirmer</label>
              <div className={styles.passwordWrap}>
                <input
                  id="confirm"
                  type={showConf ? 'text' : 'password'}
                  className={styles.input}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Répétez le mot de passe"
                  aria-required="true"
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

            {emailTaken && (
              <p className={styles.error} role="alert">
                Un compte existe déjà avec cette adresse.{' '}
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Se connecter</Link>
                {' '}ou{' '}
                <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>réinitialiser le mot de passe</Link>.
              </p>
            )}

            {error && (
              <p className={styles.error} role="alert">{error}</p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !email || !password || !confirm}
            >
              {loading ? 'Creation...' : 'Créer mon compte'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Deja un compte ?{' '}
            <Link to="/login">Se connecter</Link>
          </p>

        </div>
      </main>
    </div>
  );
}