// =========================================================
//  AdminMeasurementsPage
//  Onglets : Graphique | Tableau  +  Agregats par capteur
//  Multi-selection + export CSV
// =========================================================
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  useAdminMeasurements, useAdminAggregates, type MeasFilter,
} from '../../hooks/useAdmin';
import { useAdminDevices } from '../../hooks/useAdmin';
import { GROUPS } from '../../lib/groups';
import styles from './AdminPage.module.css';

const PAGE_SIZE = 50;

type Tab = 'graph' | 'table';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function exportCSV(rows: ReturnType<typeof useAdminMeasurements>['rows'], selected: Set<number>) {
  const target = selected.size > 0 ? rows.filter(r => selected.has(r.id)) : rows;
  const header = 'id,device_id,type,value,unit,created_at';
  const lines  = target.map(r =>
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

  const ownIds = useMemo(
    () => GROUPS.find(g => g.ours)?.sensors.filter(s => s.kind === 'sensor').map(s => s.deviceId) ?? [],
    []
  );
  const { stats } = useAdminAggregates(ownIds, 300);

  const [tab,      setTab]      = useState<Tab>('graph');
  const [deviceId, setDeviceId] = useState('');
  const [type,     setType]     = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [offset,   setOffset]   = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const buildFilter = (): MeasFilter => ({
    deviceId: deviceId || undefined,
    type:     type     || undefined,
    from:     from     ? new Date(from).toISOString() : undefined,
    to:       to       ? new Date(to + 'T23:59:59').toISOString() : undefined,
    limit:    PAGE_SIZE,
    offset,
  });

  useEffect(() => {
    fetch({ ...buildFilter(), limit: 200, offset: 0 });
  }, []); // eslint-disable-line

  const applyFilters = () => {
    setOffset(0);
    setSelected(new Set());
    fetch({ ...buildFilter(), offset: 0 });
  };

  // Donnees graphique
  const chartData = useMemo(() => {
    return [...rows].reverse().map(r => ({
      time:  fmtTime(r.created_at),
      value: r.value,
      id:    r.device_id,
    }));
  }, [rows]);

  // Multi-select
  const toggleRow = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  };

  const pages = Math.ceil(total / PAGE_SIZE);
  const page  = Math.floor(offset / PAGE_SIZE) + 1;

  // Couleur par device
  const deviceColor: Record<string, string> = {
    G1E_temperature: '#C9A240',
    G1E_humidity:    '#2BBFBF',
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Mesures</h1>
        <p className={styles.pageSub}>{total.toLocaleString('fr-FR')} entrées dans G1E_measurements</p>
      </header>

      {/* Agregats par capteur */}
      <div className={styles.kpiGrid}>
        {stats.map(s => {
          const label = GROUPS.flatMap(g => g.sensors).find(x => x.deviceId === s.deviceId)?.label ?? s.deviceId;
          const color = deviceColor[s.deviceId] ?? '#8B7CF8';
          return (
            <div key={s.deviceId} className={styles.kpi} style={{ borderTop: `2px solid ${color}` }}>
              <span className={styles.kpiLabel}>{label}</span>
              <span className={styles.kpiValue} style={{ color }}>
                {s.count ? s.last.toFixed(1) : '—'}
              </span>
              {s.count > 0 && (
                <span className={styles.kpiSub}>
                  min {s.min.toFixed(1)} · max {s.max.toFixed(1)} · moy {s.avg.toFixed(1)} · std {s.std.toFixed(2)}
                  <br />{s.count} pts
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Filtres</span>
        <select className={styles.select} style={{ maxWidth: 200 }}
          value={deviceId} onChange={e => setDeviceId(e.target.value)}>
          <option value="">Tous les appareils</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
        </select>
        <input className={styles.input} style={{ maxWidth: 130 }}
          placeholder="Type" value={type} onChange={e => setType(e.target.value)} />
        <input className={styles.input} style={{ maxWidth: 150 }}
          type="date" value={from} onChange={e => setFrom(e.target.value)} title="Depuis" />
        <input className={styles.input} style={{ maxWidth: 150 }}
          type="date" value={to} onChange={e => setTo(e.target.value)} title="Jusqu'au" />
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={applyFilters}>
          Appliquer
        </button>
        <span className={styles.toolbarSep} />
        <button className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => exportCSV(rows, selected)} disabled={rows.length === 0}>
          {selected.size > 0 ? `Exporter ${selected.size} CSV` : 'Exporter CSV'}
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 1, background: 'var(--clr-nuit-bord)' }}>
        {(['graph', 'table'] as Tab[]).map(t => (
          <button key={t}
            className={[styles.btn, tab === t ? styles.btnPrimary : styles.btnSecondary].join(' ')}
            style={{ flex: 1, borderRadius: 0, padding: 'var(--sp-3)' }}
            onClick={() => setTab(t)}
          >
            {t === 'graph' ? 'Graphique' : 'Tableau'}
            {t === 'table' && selected.size > 0 && ` (${selected.size} sélectionnés)`}
          </button>
        ))}
      </div>

      {loading && <p className={styles.stateMsg}>Chargement…</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      {/* Vue graphique */}
      {tab === 'graph' && !loading && (
        <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-nuit-bord)', padding: 'var(--sp-5)' }}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C9A240" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C9A240" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(35,34,53,0.6)" horizontal vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#57566A', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#57566A', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#0E0D14', border: '1px solid #232235', color: '#EDE9E0' }}
                labelStyle={{ color: '#57566A', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8A8898' }} />
              <Area type="monotone" dataKey="value" name={deviceId || 'Valeur'}
                stroke="#C9A240" strokeWidth={2} fill="url(#mg1)" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vue tableau */}
      {tab === 'table' && !loading && (
        <>
          {selected.size > 0 && (
            <div className={styles.toolbar}>
              <span className={styles.toolbarLabel}>{selected.size} sélectionnés</span>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setSelected(new Set())}>
                Desélectionnér
              </button>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => exportCSV(rows, selected)}>
                Exporter selection CSV
              </button>
            </div>
          )}

          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll} title="Tout sélectionner" />
                </th>
                <th>ID</th><th>Appareil</th><th>Type</th><th>Valeur</th><th>Unite</th><th>Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={selected.has(r.id) ? { background: 'rgba(201,162,64,0.07)' } : undefined}>
                  <td>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
                  </td>
                  <td className={styles.mono}>{r.id}</td>
                  <td><code className={styles.code}>{r.device_id}</code></td>
                  <td>{r.type}</td>
                  <td className={styles.valueCell}>{r.value.toFixed(2)}</td>
                  <td>{r.unit ?? '—'}</td>
                  <td className={styles.mono}>{new Date(r.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className={styles.stateMsg}>Aucune mesure.</td></tr>
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              onClick={() => { const o = Math.max(0, offset - PAGE_SIZE); setOffset(o); fetch({ ...buildFilter(), offset: o }); }}
              disabled={offset === 0}>&larr; Prec.</button>
            <span>Page {page} / {pages || 1}</span>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
              onClick={() => { const o = offset + PAGE_SIZE; setOffset(o); fetch({ ...buildFilter(), offset: o }); }}
              disabled={offset + PAGE_SIZE >= total}>Suiv. &rarr;</button>
            <span style={{ marginLeft: 'auto' }}>{total.toLocaleString('fr-FR')} au total</span>
          </div>
        </>
      )}
    </div>
  );
}