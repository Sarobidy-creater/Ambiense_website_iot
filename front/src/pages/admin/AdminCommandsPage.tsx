// =========================================================
//  AdminCommandsPage — historique des commandes G1E
//  Filtrage par statut + annulation des pending
// =========================================================
import { useEffect, useState } from 'react';
import { useAdminCommands } from '../../hooks/useAdmin';
import styles from './AdminPage.module.css';

const PAGE_SIZE = 50;

export function AdminCommandsPage() {
  const { commands, total, loading, error, fetch, cancel } = useAdminCommands();
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [msg,    setMsg]    = useState<{ text: string; ok: boolean } | null>(null);

  const load = (off = offset, st = statusFilter) => {
    fetch(PAGE_SIZE, off, st || undefined);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCancel = async (id: number) => {
    const err = await cancel(id);
    if (err) flash(err, false);
    else { flash('Commande annulee.', true); load(); }
  };

  const applyFilter = () => {
    setOffset(0);
    load(0, statusFilter);
  };

  function statusColor(s: string) {
    if (s === 'done')    return 'var(--clr-vert)';
    if (s === 'pending') return 'var(--clr-ambre)';
    return 'var(--clr-danger)';
  }

  const pages = Math.ceil(total / PAGE_SIZE);
  const page  = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Historique des commandes</h1>
        <p className={styles.pageSub}>Table G1E_commands — {total.toLocaleString('fr-FR')} entrées</p>
      </header>

      {/* Filtres */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Statut</span>
        <select
          className={styles.select}
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Tous</option>
          <option value="pending">En attente</option>
          <option value="done">Terminé</option>
          <option value="error">Erreur</option>
        </select>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={applyFilter}>
          Filtrer
        </button>
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => { setStatusFilter(''); setOffset(0); fetch(PAGE_SIZE, 0, undefined); }}
        >
          Réinitialiser
        </button>
      </div>

      {msg && <p className={msg.ok ? styles.successMsg : styles.errorMsg}>{msg.text}</p>}

      {loading && <p className={styles.stateMsg}>Chargement…</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      {!loading && (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Appareil</th>
                <th>Action</th>
                <th>Payload</th>
                <th>Statut</th>
                <th>Créé par</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {commands.map(c => (
                <tr key={c.id}>
                  <td className={styles.mono}>{c.id}</td>
                  <td><code className={styles.code}>{c.device_id}</code></td>
                  <td>{c.action}</td>
                  <td className={styles.mono}>
                    {c.payload ? JSON.stringify(c.payload) : '—'}
                  </td>
                  <td>
                    <span className={styles.statusDot} style={{ background: statusColor(c.status) }} />
                    <span style={{ color: statusColor(c.status), fontSize: '0.75rem', fontWeight: 500 }}>
                      {c.status}
                    </span>
                  </td>
                  <td className={styles.mono}>{c.created_by?.slice(0, 8) ?? '—'}…</td>
                  <td className={styles.mono}>{new Date(c.created_at).toLocaleString('fr-FR')}</td>
                  <td>
                    {c.status === 'pending' && (
                      <button
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        onClick={() => handleCancel(c.id)}
                      >
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {commands.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.stateMsg}>Aucune commande.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              onClick={() => { const o = Math.max(0, offset - PAGE_SIZE); setOffset(o); load(o); }}
              disabled={offset === 0}
            >
              ← Préc.
            </button>
            <span>Page {page} / {pages || 1}</span>
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              onClick={() => { const o = offset + PAGE_SIZE; setOffset(o); load(o); }}
              disabled={offset + PAGE_SIZE >= total}
            >
              Suiv. →
            </button>
            <span style={{ marginLeft: 'auto' }}>
              {total.toLocaleString('fr-FR')} commandes au total
            </span>
          </div>
        </>
      )}
    </div>
  );
}
