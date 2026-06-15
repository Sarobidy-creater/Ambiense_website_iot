// =========================================================
//  AdminMeasurementsPage
//  Onglets : Graphiques | Tableau  +  Agrégats par capteur
//  Multi-selection + export CSV
// =========================================================
import { useEffect, useMemo, useState } from 'react';
import {
  useAdminMeasurements, useAdminAggregates, type MeasFilter,
} from '../../hooks/useAdmin';
import { useAdminDevices } from '../../hooks/useAdmin';
import { useGroupSensors } from '../../hooks/useGroupSensors';
import type { GroupSensorReading } from '../../hooks/useGroupSensors';
import { SensorChart }      from '../../components/SensorChart';
import { GroupSensorChart } from '../../components/GroupSensorChart';
import { SensorIcon }       from '../../components/svg/SensorIcon';
import { GROUPS } from '../../lib/groups';
import styles from './AdminPage.module.css';
import ms from './AdminMeasurements.module.css';

const PAGE_SIZE = 50;
type Tab = 'graph' | 'table';

function timeAgo(ts: string | null): string {
  if (!ts) return '—';
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (sec < 60)    return `${sec} s`;
  if (sec < 3600)  return `${Math.floor(sec / 60)} min`;
  return `${Math.floor(sec / 3600)} h`;
}

function ExtKpiCard({ r }: { r: GroupSensorReading }) {
  const group = GROUPS.find(g => g.code === r.group);
  const color = group?.color ?? '#787790';
  const hasVal = r.value !== null;
  function fmt(): string {
    if (!hasVal) return '—';
    if (r.type === 'presence') return `${r.value} ${r.unit}`;
    if (r.type === 'alcohol')  return `${(r.value as number).toFixed(2)} ${r.unit}`;
    if (r.type === 'sound')    return `${Math.round(r.value as number)} ${r.unit}`;
    return `${r.value} ${r.unit}`;
  }
  return (
    <div className={styles.kpi} style={{ borderTop: `2px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className={styles.kpiLabel} style={{ color }}>{r.group}</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.online ? 'var(--clr-vert)' : hasVal ? color : 'var(--clr-nuit-bord)', display: 'inline-block', flexShrink: 0 }} />
      </div>
      <span className={styles.kpiValue} style={{ color, fontSize: 'var(--text-2xl)' }}>{fmt()}</span>
      <span className={styles.kpiSub}>
        {r.label}
        {r.timestamp ? ` · il y a ${timeAgo(r.timestamp)}` : ''}
        {!r.timestamp && r.error ? ` · ${r.error}` : ''}
      </span>
    </div>
  );
}
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
  const { sensors: extSensors, refresh: extRefresh } = useGroupSensors();

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

  const ownGroup  = GROUPS.find(g => g.ours);
  const extGroups = GROUPS.filter(g => !g.ours);
  const ownSensors = ownGroup?.sensors.filter(s => s.kind === 'sensor') ?? [];

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

  // Couleur par device
  const deviceColor: Record<string, string> = {
    G1E_temperature: '#C9A240',
    G1E_humidity:    '#2BBFBF',
  };
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

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Mesures</h1>
        <p className={styles.pageSub}>{total.toLocaleString('fr-FR')} entrées dans G1E_measurements</p>
      </header>

      {/* KPIs G1E */}
      <div className={styles.kpiGrid}>
        {stats.map(s => {
          const sensor = ownGroup?.sensors.find(x => x.deviceId === s.deviceId);
          const color  = deviceColor[s.deviceId] ?? '#8B7CF8';
          return (
            <div key={s.deviceId} className={styles.kpi} style={{ borderTop: `2px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {sensor && <SensorIcon type={sensor.type} size={14} />}
                <span className={styles.kpiLabel}>{sensor?.label ?? s.deviceId}</span>
              </div>
              <span className={styles.kpiValue} style={{ color }}>
                {s.count ? s.last.toFixed(1) : '—'}
                {sensor?.unit ? ` ${sensor.unit}` : ''}
              </span>
              {s.count > 0 && (
                <span className={styles.kpiSub}>
                  min {s.min.toFixed(1)} · max {s.max.toFixed(1)} · moy {s.avg.toFixed(1)}
                  <br />{s.count} points
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* KPIs groupes partenaires */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle} style={{ fontSize: 'var(--text-base)' }}>Capteurs partenaires</h2>
          <button onClick={extRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-or)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Actualiser</button>
        </div>
        <div className={styles.kpiGrid}>
          {extSensors.map(r => <ExtKpiCard key={r.group} r={r} />)}
        </div>
      </section>

      {/* Filtres */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Filtres</span>
        <label htmlFor="filter-device" className="sr-only">Appareil</label>
        <select id="filter-device" aria-label="Filtrer par appareil" className={styles.select} style={{ maxWidth: 200 }}
          value={deviceId} onChange={e => setDeviceId(e.target.value)}>
          <option value="">Tous les appareils</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
        </select>
        <label htmlFor="filter-type" className="sr-only">Type de mesure</label>
        <input id="filter-type" aria-label="Filtrer par type de mesure" className={styles.input} style={{ maxWidth: 130 }}
          placeholder="Type" value={type} onChange={e => setType(e.target.value)} />
        <label htmlFor="filter-from" className="sr-only">Depuis</label>
        <input id="filter-from" aria-label="Depuis le" className={styles.input} style={{ maxWidth: 150 }}
          type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <label htmlFor="filter-to" className="sr-only">Jusqu'au</label>
        <input id="filter-to" aria-label="Jusqu'au" className={styles.input} style={{ maxWidth: 150 }}
          type="date" value={to} onChange={e => setTo(e.target.value)} />
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
      <div role="tablist" aria-label="Vue des mesures" style={{ display: 'flex', gap: 1, background: 'var(--clr-nuit-bord)' }}>
        {(['graph', 'table'] as Tab[]).map(t => (
          <button key={t}
            role="tab"
            aria-selected={tab === t}
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

      {/* Vue graphique — un graphique par capteur */}
      {tab === 'graph' && (
        <div className={ms.chartsGrid}>
          {/* Capteurs G1E */}
          {ownSensors.map(s => (
            <div key={s.deviceId} className={ms.chartSection}>
              <div className={ms.chartSectionHead}>
                <SensorIcon type={s.type} size={14} />
                <span className={ms.chartSectionLabel} style={{ color: deviceColor[s.deviceId] ?? ownGroup?.color }}>
                  {ownGroup?.code} · {s.label}
                </span>
                <span className={ms.chartSectionBadge}>G1E</span>
              </div>
              <SensorChart
                deviceId={s.deviceId}
                unit={s.unit}
                label={s.label}
                color={deviceColor[s.deviceId] ?? ownGroup?.color}
                ours={true}
              />
            </div>
          ))}

          {/* Capteurs groupes partenaires */}
          {extGroups.map(group => (
            <div key={group.code} className={ms.chartSection}>
              <div className={ms.chartSectionHead}>
                <SensorIcon type={group.sensors[0]?.type ?? 'sensor'} size={14} />
                <span className={ms.chartSectionLabel} style={{ color: group.color }}>
                  {group.code} · {group.sensors[0]?.label ?? group.name}
                </span>
                <span className={ms.chartSectionBadge} style={{ borderColor: `${group.color}50`, color: group.color }}>{group.code}</span>
              </div>
              <GroupSensorChart
                groupCode={group.code}
                unit={group.sensors[0]?.unit ?? ''}
                label={group.sensors[0]?.label ?? group.name}
                color={group.color}
              />
            </div>
          ))}
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
                <th scope="col" style={{ width: 36 }}>
                  <input type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll} />
                </th>
                <th scope="col">ID</th><th scope="col">Appareil</th><th scope="col">Type</th><th scope="col">Valeur</th><th scope="col">Unite</th><th scope="col">Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={selected.has(r.id) ? { background: 'rgba(201,162,64,0.07)' } : undefined}>
                  <td>
                    <input type="checkbox" aria-label={`Sélectionner mesure ${r.id}`} checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
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