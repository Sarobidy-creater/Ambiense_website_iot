// =========================================================
//  AdminUsersPage — gestion des comptes utilisateurs
//  Liste, rôle admin/user, reset mot de passe, suppression
// =========================================================
import { useState } from 'react';
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

function ResetModal({ user, onClose, onSend }: {
  user: AdminUser;
  onClose: () => void;
  onSend:  () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await onSend();
    setLoading(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Réinitialiser le mot de passe</h2>
        <p className={styles.modalSub}>{user.email}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
          color: 'var(--clr-text-muted)', lineHeight: 1.6, margin: 0 }}>
          Un email de réinitialisation sera envoyé à l'utilisateur.
          Il pourra définir un nouveau mot de passe via le lien reçu.
        </p>
        <div className={styles.formActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? 'Envoi…' : 'Envoyer le lien de reset'}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            Annuler
          </button>
        </div>
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
          onSend={async () => {
            const err = await resetPwd(resetTarget.email);
            if (err) flash(err, false);
            else flash(`Email de reset envoyé à ${resetTarget.email}.`, true);
          }}
        />
      )}
    </div>
  );
}
