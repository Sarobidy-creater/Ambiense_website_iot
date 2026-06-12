// =========================================================
//  ProfilePage — gestion du compte utilisateur
//  Pas d'emoji. Design professionnel cohérent au site.
// =========================================================
import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './ProfilePage.module.css';

// ── Section : informations compte ────────────────────────

function AccountSection({ email }: { email: string }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Compte</h2>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>Adresse e-mail</span>
        <span className={styles.infoValue}>{email}</span>
      </div>
      <p className={styles.infoNote}>
        L'adresse e-mail ne peut pas être modifiée.
        Contactez un administrateur si nécessaire.
      </p>
    </div>
  );
}

// ── Section : changer le mot de passe ─────────────────────

function PasswordSection() {
  const { updatePassword } = useAuth();
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (next !== confirm) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (next.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    const err = await updatePassword(current, next);
    setLoading(false);

    if (err) {
      setError('Mot de passe actuel incorrect ou erreur réseau.');
    } else {
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Changer le mot de passe</h2>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.field}>
          <label htmlFor="current-pwd" className={styles.label}>
            Mot de passe actuel
          </label>
          <input
            id="current-pwd"
            type="password"
            className={styles.input}
            value={current}
            onChange={e => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Mot de passe actuel"
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.field}>
          <label htmlFor="new-pwd" className={styles.label}>
            Nouveau mot de passe
          </label>
          <input
            id="new-pwd"
            type="password"
            className={styles.input}
            value={next}
            onChange={e => setNext(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="8 caractères minimum"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="confirm-pwd" className={styles.label}>
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="confirm-pwd"
            type="password"
            className={styles.input}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Répétez le nouveau mot de passe"
          />
        </div>

        {error && (
          <p className={styles.error} role="alert">{error}</p>
        )}
        {success && (
          <div className={styles.successMsg} role="status">
            <span className={styles.successDot} />
            Mot de passe mis à jour avec succès.
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !current || !next || !confirm}
        >
          {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </div>
  );
}

// ── Section : informations session ───────────────────────

function SessionSection({ email }: { email: string }) {
  const { signOut } = useAuth();
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Session</h2>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>Connecté en tant que</span>
        <span className={styles.infoValue}>{email}</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>Plateforme</span>
        <span className={styles.infoValue}>AMBIENSE — Bar G1E</span>
      </div>
      <button
        className={styles.dangerBtn}
        onClick={() => signOut()}
        aria-label="Se déconnecter de la session"
      >
        Se déconnecter
      </button>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────

export function ProfilePage() {
  const { user } = useAuth();
  const email = user?.email ?? '';

  return (
    <div className={styles.page}>

      {/* Bandeau hero (photo bar) */}
      <div className={styles.hero}>
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-hidden="true"
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.heroEye}>Gestion du compte</p>
          <h1 className={styles.heroTitle}>Profil</h1>
          <p className={styles.heroSub}>{email}</p>
        </div>
      </div>

      {/* Contenu */}
      <div className={styles.content}>
        <AccountSection  email={email} />
        <PasswordSection />
        <SessionSection  email={email} />
      </div>

    </div>
  );
}
