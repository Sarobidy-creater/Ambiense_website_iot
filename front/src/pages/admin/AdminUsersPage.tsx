// =========================================================
//  AdminUsersPage — gestion des comptes utilisateurs
//  Liste, rôle admin/user, reset mot de passe, suppression
// =========================================================
import { useState, type FormEvent } from 'react';
import { useAdminUsers, type AdminUser } from '../../hooks/useAdminUsers';
import { useAuth } from '../../auth/AuthContext';
import styles from './AdminPage.module.css';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'short', timeStyle: 'short',
  });
}

// ── Modal reset mot de passe ─────────────────────────────

function ResetModal({ user, onClose, onSave }: {
  user: AdminUser;
  onClose: () => void;
  onSave:  (pwd: string) => Promise<void>;
}) {
  const [pwd,     setPwd]     = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) { setError('Au moins 8 caractères.'); return; }
    if (pwd !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    await onSave(pwd);
    setLoading(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Réinitialiser le mot de passe</h2>
        <p className={styles.modalSub}>{user.email}</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nouveau mot de passe</label>
            <input className={styles.input} type="password" value={pwd}
              onChange={e => setPwd(e.target.value)} required placeholder="8 caractères minimum" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Confirmer</label>
            <input className={styles.input} type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required placeholder="Répéter" />
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
              {loading ? 'Sauvegarde…' : 'Mettre à jour'}
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { users, loading, saving, error, refresh, setRole, resetPwd, deleteUser } = useAdminUsers();

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);
  const [msg,  setMsg]  = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleRole = async (u: AdminUser, role: 'admin' | 'user') => {
    const err = await setRole(u.id, role);
    if (err) flash(err, false);
    else flash(`Rôle de ${u.email} mis à jour → ${role}`, true);
  };

  const handleDelete = async (userId: string) => {
    const err = await deleteUser(userId);
    if (err) flash(err, false);
    else { flash('Compte supprimé.', true); setConfirmDel(null); }
  };

  return (
    <div className={styles.page}>

      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Utilisateurs</h1>
        <p className={styles.pageSub}>{users.length} compte{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}</p>
      </header>

      {/* KPIs rapides */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Total comptes</span>
          <span className={styles.kpiValue}>{users.length}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Administrateurs</span>
          <span className={styles.kpiValue} style={{ color: 'var(--clr-or)' }}>
            {users.filter(u => u.role === 'admin').length}
          </span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Confirmés</span>
          <span className={styles.kpiValue} style={{ color: 'var(--clr-vert)' }}>
            {users.filter(u => u.confirmed).length}
          </span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Non confirmés</span>
          <span className={styles.kpiValue} style={{ color: 'var(--clr-ambre)' }}>
            {users.filter(u => !u.confirmed).length}
          </span>
        </div>
      </div>

      {/* Actions globales */}
      <div className={styles.toolbar}>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={refresh}>
          Actualiser
        </button>
        {saving && <span className={styles.toolbarLabel}>Sauvegarde…</span>}
      </div>

      {msg   && <p className={msg.ok ? styles.successMsg : styles.errorMsg}>{msg.text}</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {loading ? (
        <p className={styles.stateMsg}>Chargement…</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf   = u.id === currentUser?.id;
              const isAdmin  = u.role === 'admin';
              return (
                <tr key={u.id}>
                  <td>
                    <span className={styles.code} style={{ color: 'var(--clr-text-muted)', background: 'none', padding: 0 }}>
                      {u.email}
                    </span>
                    {isSelf && (
                      <span style={{ marginLeft: 8, fontSize: '0.6rem', color: 'var(--clr-or)',
                        border: '1px solid rgba(201,162,64,0.35)', padding: '1px 5px', fontWeight: 700 }}>
                        Vous
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${isAdmin ? styles.badgeOr : styles.badgeTeal}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.confirmed ? styles.badgeGreen : styles.badgeAmbre}`}>
                      {u.confirmed ? 'Confirmé' : 'En attente'}
                    </span>
                  </td>
                  <td className={styles.mono}>{fmtDate(u.created_at)}</td>
                  <td className={styles.mono}>{fmtDate(u.last_sign_in_at)}</td>
                  <td>
                    <div className={styles.formActions} style={{ flexWrap: 'wrap', gap: 4 }}>
                      {/* Toggle rôle */}
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        onClick={() => handleRole(u, isAdmin ? 'user' : 'admin')}
                        disabled={saving || isSelf}
                        title={isSelf ? 'Impossible de modifier votre propre rôle' : undefined}
                      >
                        {isAdmin ? 'Retirer admin' : 'Passer admin'}
                      </button>

                      {/* Reset mot de passe */}
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        onClick={() => setResetTarget(u)}
                        disabled={saving}
                      >
                        Reset MDP
                      </button>

                      {/* Supprimer */}
                      {confirmDel === u.id ? (
                        <>
                          <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => handleDelete(u.id)}
                            disabled={saving}
                          >
                            Confirmer
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                            onClick={() => setConfirmDel(null)}
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                          onClick={() => setConfirmDel(u.id)}
                          disabled={saving || isSelf}
                          title={isSelf ? 'Impossible de supprimer votre propre compte' : undefined}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal reset mot de passe */}
      {resetTarget && (
        <ResetModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSave={async (pwd) => {
            const err = await resetPwd(resetTarget.id, pwd);
            if (err) flash(err, false);
            else flash(`Mot de passe de ${resetTarget.email} réinitialisé.`, true);
          }}
        />
      )}
    </div>
  );
}
