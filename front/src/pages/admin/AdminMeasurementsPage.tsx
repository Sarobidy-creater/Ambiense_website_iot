// =========================================================
//  AdminMeasurementsPage — explorateur de mesures
//  Filtres + pagination + export CSV
// =========================================================
import { useEffect, useState } from 'react';
import { useAdminMeasurements, type MeasFilter } from '../../hooks/useAdmin';
import { useAdminDevices } from '../../hooks/useAdmin';
import styles from './AdminPage.module.css';

const PAGE_SIZE = 50;

function exportCSV(rows: ReturnType<typeof useAdminMeasurements>['rows']) {
  const header = 'id,device_id,type,value,unit,created_at';
  const lines  = rows.map(r =>
    `${r.id},${r.device_id},${r.type},${r.value},${r.unit ?? ''},${r.created_at}`
  );
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `G1E_measurements_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminMeasurementsPage() {
  const { devices } = useAdminDevices();
  const { rows, total, loading, error, fetch } = useAdminMeasurements();

  const [deviceId, setDeviceId] = useState('');
  const [type,     setType]     = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [offset,   setOffset]   = useState(0);

  const buildFilter = (): MeasFilter => ({
    deviceId: deviceId || undefined,
    type:     type     || undefined,
    from:     from     ? new Date(from).toISOString() : undefined,
    to:       to       ? new Date(to + 'T23:59:59').toISOString() : undefined,
    limit:    PAGE_SIZE,
    offset,
  });

  useEffect(() => {
    fetch(buildFilter());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const applyFilters = () => {
    setOffset(0);
    fetch({ ...buildFilter(), offset: 0 });
  };

  const pages     = Math.ceil(total / PAGE_SIZE);
  const page      = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Explorateur de mesures</h1>
        <p className={styles.pageSub}>Table G1E_measurements — {total.toLocaleString('fr-FR')} entrées</p>
      </header>

      {/* Filtres */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Filtres</span>

        <select
          className={styles.select}
          style={{ maxWidth: 200 }}
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
        >
          <option value="">Tous les appareils</option>
          {devices.map(d => (
            <option key={d.id} value={d.id}>{d.id}</option>
          ))}
        </select>

        <input
          className={styles.input}
          style={{ maxWidth: 140 }}
          placeholder="Type (temp…)"
          value={type}
          onChange={e => setType(e.target.value)}
        />

        <input
          className={styles.input}
          style={{ maxWidth: 150 }}
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          title="Depuis"
        />
        <input
          className={styles.input}
          style={{ maxWidth: 150 }}
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          title="Jusqu'au"
        />

        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={applyFilters}>
          Appliquer
        </button>

        <span className={styles.toolbarSep} />

        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => exportCSV(rows)}
          disabled={rows.length === 0}
        >
          Exporter CSV
        </button>
      </div>

      {/* Tableau */}
      {loading && <p className={styles.stateMsg}>Chargement…</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      {!loading && (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Appareil</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Unité</th>
                <th>Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className={styles.mono}>{r.id}</td>
                  <td><code className={styles.code}>{r.device_id}</code></td>
                  <td>{r.type}</td>
                  <td className={styles.valueCell}>{r.value.toFixed(2)}</td>
                  <td>{r.unit ?? '—'}</td>
                  <td className={styles.mono}>{new Date(r.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.stateMsg}>Aucune mesure trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              onClick={() => setOffset(o => Math.max(0, o - PAGE_SIZE))}
              disabled={offset === 0}
            >
              ← Préc.
            </button>
            <span>Page {page} / {pages || 1}</span>
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              onClick={() => setOffset(o => o + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
            >
              Suiv. →
            </button>
            <span style={{ marginLeft: 'auto' }}>
              {total.toLocaleString('fr-FR')} mesures au total
            </span>
          </div>
        </>
      )}
    </div>
  );
}
