// =========================================================
//  AdminCommandsPage — multi-select + bulk cancel + distribution
// =========================================================
import { useEffect, useMemo, useState } from 'react';
import { useAdminCommands, type CommandRow } from '../../hooks/useAdmin';
import styles from './AdminPage.module.css';

const PAGE_SIZE = 50;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR');
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done:    styles.badgeGreen,
    pending: styles.badgeAmbre,
    error:   styles.badgeRed,
  };
  return <span className={`${styles.badge} ${map[status] ?? ''}`}>{status}</span>;
}

export function AdminCommandsPage() {
  const { commands, total, loading, error, fetch, cancel } = useAdminCommands();

  const [statusFilter, setStatusFilter] = useState('');
  const [offset,   setOffset]   = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = (off = offset, st = statusFilter) => {
    fetch(PAGE_SIZE, off, st || undefined);
    setSelected(new Set());
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  // Stats locales
  const distrib = useMemo(() => {
    const d = { done: 0, pending: 0, error: 0 };
    commands.forEach(c => {
      if (c.status === 'done')    d.done++;
      else if (c.status === 'pending') d.pending++;
      else d.error++;
    });
    return d;
  }, [commands]);

  // Annuler 1
  const handleCancel = async (id: number) => {
    const err = await cancel(id);
    if (err) flash(err, false);
    else { flash('Commande annulee.', true); load(); }
  };

  // Annuler selection
  const bulkCancel = async () => {
    const pending = commands.filter(c => selected.has(c.id) && c.status === 'pending');
    if (!pending.length) { flash('Aucune commande en attente selectionnee.', false); return; }
    setBulkBusy(true);
    let errors = 0;
    for (const c of pending) {
      const err = await cancel(c.id);
      if (err) errors++;
    }
    setBulkBusy(false);
    flash(`${pending.length - errors} commandes annulees.${errors ? ' ' + errors + ' erreurs.' : ''}`, errors === 0);
    load();
  };

  const toggleRow = (id: number) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === commands.length) setSelected(new Set());
    else setSelected(new Set(commands.map(c => c.id)));
  };

  const pages = Math.ceil(total / PAGE_SIZE);
  const page  = Math.floor(offset / PAGE_SIZE) + 1;
  const selPending = commands.filter(c => selected.has(c.id) && c.status === 'pending').length;

  function statusColor(s: string) {
    if (s === 'done')    return 'var(--clr-vert)';
    if (s === 'pending') return 'var(--clr-ambre)';
    return 'var(--clr-danger)';
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Commandes</h1>
        <p className={styles.pageSub}>{total.toLocaleString('fr-FR')} entrees dans G1E_commands</p>
      </header>

      {/* Distribution statuts */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Terminee',    value: distrib.done,    color: 'var(--clr-vert)' },
          { label: 'En attente',  value: distrib.pending, color: 'var(--clr-ambre)' },
          { label: 'Erreur',      value: distrib.error,   color: 'var(--clr-danger)' },
        ].map(k => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <span className={styles.kpiValue} style={{ color: k.color }}>{k.value}</span>
            <div style={{ height: 3, background: k.color, marginTop: 4, opacity: 0.6,
              width: total ? `${((k.value / total) * 100).toFixed(1)}%` : '0%', transition: 'width 400ms' }} />
          </div>
        ))}
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Total</span>
          <span className={styles.kpiValue}>{total}</span>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Statut</span>
        <select className={styles.select} style={{ maxWidth: 180 }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous</option>
          <option value="pending">En attente</option>
          <option value="done">Termine</option>
          <option value="error">Erreur</option>
        </select>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setOffset(0); load(0, statusFilter); }}>
          Filtrer
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => { setStatusFilter(''); setOffset(0); fetch(PAGE_SIZE, 0, undefined); }}>
          Reset
        </button>
      </div>

      {msg && <p className={msg.ok ? styles.successMsg : styles.errorMsg}>{msg.text}</p>}

      {/* Barre actions groupees */}
      {selected.size > 0 && (
        <div className={styles.toolbar} style={{ background: 'rgba(201,162,64,0.06)', borderColor: 'rgba(201,162,64,0.25)' }}>
          <span className={styles.toolbarLabel} style={{ color: 'var(--clr-or)' }}>
            {selected.size} selectionnes — {selPending} en attente
          </span>
          <button className={`${styles.btn} ${styles.btnDanger}`}
            onClick={bulkCancel} disabled={bulkBusy || selPending === 0}>
            {bulkBusy ? 'Annulation…' : `Annuler ${selPending} pending`}
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setSelected(new Set())}>
            Deselectionner
          </button>
        </div>
      )}

      {loading && <p className={styles.stateMsg}>Chargement…</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox"
                checked={selected.size === commands.length && commands.length > 0}
                onChange={toggleAll} />
            </th>
            <th>ID</th><th>Appareil</th><th>Action</th><th>Payload</th>
            <th>Statut</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {commands.map((c: CommandRow) => (
            <tr key={c.id} style={selected.has(c.id) ? { background: 'rgba(201,162,64,0.06)' } : undefined}>
              <td><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleRow(c.id)} /></td>
              <td className={styles.mono}>{c.id}</td>
              <td><code className={styles.code}>{c.device_id}</code></td>
              <td>{c.action}</td>
              <td className={styles.mono}>{c.payload ? JSON.stringify(c.payload) : '—'}</td>
              <td>
                <span className={styles.statusDot} style={{ background: statusColor(c.status) }} />
                <StatusBadge status={c.status} />
              </td>
              <td className={styles.mono}>{fmtDate(c.created_at)}</td>
              <td>
                {c.status === 'pending' && (
                  <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                    onClick={() => handleCancel(c.id)}>
                    Annuler
                  </button>
                )}
              </td>
            </tr>
          ))}
          {commands.length === 0 && (
            <tr><td colSpan={8} className={styles.stateMsg}>Aucune commande.</td></tr>
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
          onClick={() => { const o = Math.max(0, offset - PAGE_SIZE); setOffset(o); load(o); }}
          disabled={offset === 0}>← Prec.</button>
        <span>Page {page} / {pages || 1}</span>
        <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
          onClick={() => { const o = offset + PAGE_SIZE; setOffset(o); load(o); }}
          disabled={offset + PAGE_SIZE >= total}>Suiv. →</button>
        <span style={{ marginLeft: 'auto' }}>{total.toLocaleString('fr-FR')} commandes</span>
      </div>
    </div>
  );
}