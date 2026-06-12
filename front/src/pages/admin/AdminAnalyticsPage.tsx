// =========================================================
//  AdminAnalyticsPage — agregats horaires + anomalies + stats
// =========================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { useAdminAggregates, useAdminHourly } from '../../hooks/useAdmin';
import { useTheme } from '../../theme/ThemeContext';
import { GROUPS, type SensorWithGroup } from '../../lib/groups';
import styles from './AdminPage.module.css';

// Capteurs scalaires uniquement
const SENSORS: SensorWithGroup[] = GROUPS
  .flatMap(g => g.sensors.map(s => ({ ...s, group: g.code, groupName: g.name, ours: g.ours, color: g.color })))
  .filter(s => s.kind === 'sensor' && s.ours);

export function AdminAnalyticsPage() {
  const { theme } = useTheme();
  const tickFaint = theme === 'light' ? '#5A596E' : '#787790';
  const tickGold  = theme === 'light' ? '#7A5E00' : '#C9A240';
  const [selectedDevice, setSelectedDevice] = useState(SENSORS[0]?.deviceId ?? '');
  const sensor = SENSORS.find(s => s.deviceId === selectedDevice) ?? SENSORS[0];

  const allIds = useMemo(() => SENSORS.map(s => s.deviceId), []);
  const { stats, loading: statsLoading, refresh } = useAdminAggregates(allIds, 300);
  const { buckets, loading: hourLoading } = useAdminHourly(selectedDevice);

  const currentStat = stats.find(s => s.deviceId === selectedDevice);

  // Detection d'anomalies : points >2 ecarts-type de la moyenne
  const anomalies = useMemo(() => {
    if (!currentStat || currentStat.count === 0) return [];
    const { avg, std } = currentStat;
    return currentStat.points.filter(p => Math.abs(p.value - avg) > 2 * std);
  }, [currentStat]);

  // Courbe avec flag anomalie
  const chartData = useMemo(() => {
    if (!currentStat) return [];
    const { avg, std } = currentStat;
    return currentStat.points.map(p => ({
      ...p,
      anomaly: Math.abs(p.value - avg) > 2 * std ? p.value : null,
    }));
  }, [currentStat]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <p className={styles.pageSub}>Agregats horaires, tendances, anomalies</p>
      </header>

      {/* Selecteur de capteur */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Capteur</span>
        {SENSORS.map(s => (
          <button key={s.deviceId}
            className={[styles.btn, selectedDevice === s.deviceId ? styles.btnPrimary : styles.btnSecondary].join(' ')}
            style={selectedDevice === s.deviceId ? { background: s.color, borderColor: s.color } : undefined}
            onClick={() => setSelectedDevice(s.deviceId)}
            aria-pressed={selectedDevice === s.deviceId}
          >
            {s.label}
          </button>
        ))}
        <span className={styles.toolbarSep} />
        <button className={[styles.btn, styles.btnSecondary].join(' ')} onClick={refresh}>
          Actualiser
        </button>
      </div>

      {/* Stats capteur sélectionné */}
      {currentStat && (
        <div className={styles.kpiGrid}>
          {[
            { label: 'Derniere valeur', value: currentStat.last.toFixed(2), unit: sensor.unit },
            { label: 'Moyenne',         value: currentStat.avg.toFixed(2),  unit: sensor.unit },
            { label: 'Min / Max',       value: `${currentStat.min.toFixed(1)} / ${currentStat.max.toFixed(1)}` },
            { label: 'Ecart-type',      value: currentStat.std.toFixed(3) },
            { label: 'Anomalies',       value: anomalies.length, accent: anomalies.length > 0 },
            { label: 'Points',          value: currentStat.count },
          ].map(k => (
            <div key={k.label} className={[styles.kpi, k.accent ? styles.kpiAccent : ''].filter(Boolean).join(' ')}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <span className={styles.kpiValue} style={k.accent ? { color: 'var(--clr-danger)' } : { color: sensor.color }}>
                {k.value}{k.unit ? ` ${k.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {statsLoading && <p className={styles.stateMsg}>Calcul des agregats…</p>}

      {/* Courbe temporelle avec anomalies */}
      {chartData.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Courbe {sensor.label} — {chartData.length} derniers points
            {anomalies.length > 0 && (
              <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--clr-danger)' }}>
                {anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''} detectee{anomalies.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div role="img" aria-label={`Courbe ${sensor.label} — ${chartData.length} points`} style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-nuit-bord)', padding: 'var(--sp-5)' }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="alGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={sensor.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={sensor.color} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(35,34,53,0.6)" horizontal vertical={false} />
                <XAxis dataKey="time" tick={{ fill: tickFaint, fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: tickFaint, fontSize: 10 }} tickLine={false} axisLine={false}
                  domain={['auto', 'auto']} unit={" " + sensor.unit} />
                <Tooltip contentStyle={{ background: '#0E0D14', border: '1px solid #232235', color: '#EDE9E0', fontSize: 12 }}
                  labelStyle={{ color: tickFaint }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8A8898' }} />
                {currentStat && (
                  <>
                    <ReferenceLine y={currentStat.avg} stroke="rgba(201,162,64,0.4)"
                      strokeDasharray="4 2"
                      label={{ value: 'moy', fill: tickGold, fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={currentStat.avg + 2 * currentStat.std} stroke="rgba(192,57,43,0.3)"
                      strokeDasharray="2 3" />
                    <ReferenceLine y={currentStat.avg - 2 * currentStat.std} stroke="rgba(192,57,43,0.3)"
                      strokeDasharray="2 3"
                      label={{ value: '±2σ', fill: 'rgba(192,57,43,0.5)', fontSize: 9, position: 'insideBottomRight' }} />
                  </>
                )}
                <Area type="monotone" dataKey="value" name={sensor.label}
                  stroke={sensor.color} strokeWidth={2} fill="url(#alGrad)" dot={false} connectNulls />
                {anomalies.length > 0 && (
                  <Line type="monotone" dataKey="anomaly" name="Anomalie"
                    stroke="var(--clr-danger)" strokeWidth={0} dot={{ r: 5, fill: 'var(--clr-danger)', strokeWidth: 0 }}
                    connectNulls={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Agregat horaire */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Repartition horaire — 24 dernieres heures</h2>
        {hourLoading ? (
          <p className={styles.stateMsg}>Chargement…</p>
        ) : buckets.length === 0 ? (
          <p className={styles.stateMsg}>Pas de données sur 24 h.</p>
        ) : (
          <div role="img" aria-label={`Répartition horaire ${sensor.label} sur 24h`} style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-nuit-bord)', padding: 'var(--sp-5)' }}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={buckets} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="rgba(35,34,53,0.6)" horizontal vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: tickFaint, fontSize: 10 }} tickLine={false} />
                <YAxis yAxisId="count" orientation="left"  tick={{ fill: tickFaint, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="val"   orientation="right" tick={{ fill: sensor.color, fontSize: 10 }} tickLine={false} axisLine={false}
                  domain={['auto', 'auto']} unit={" " + sensor.unit} />
                <Tooltip contentStyle={{ background: '#0E0D14', border: '1px solid #232235', color: '#EDE9E0', fontSize: 12 }}
                  labelStyle={{ color: '#57566A' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8A8898' }} />
                <Bar yAxisId="count" dataKey="count" name="Nb mesures" fill="rgba(35,34,53,0.9)"
                  radius={[2, 2, 0, 0]} />
                <Line yAxisId="val" type="monotone" dataKey="avg" name="Moyenne"
                  stroke={sensor.color} strokeWidth={2} dot={{ r: 3, fill: sensor.color, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Tableau comparatif tous capteurs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Comparaison tous capteurs G1E</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Capteur</th><th>Dernier</th><th>Moy</th><th>Min</th><th>Max</th>
              <th>Ecart-type</th><th>Points</th><th>Tendance</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => {
              const def = SENSORS.find(x => x.deviceId === s.deviceId);
              if (!def) return null;
              const arrow = s.trend > 0.1 ? '▲' : s.trend < -0.1 ? '▼' : '—';
              const col   = s.trend > 0.1 ? 'var(--clr-danger)' : s.trend < -0.1 ? 'var(--clr-vert)' : 'var(--clr-text-faint)';
              return (
                <tr key={s.deviceId}>
                  <td><code className={styles.code} style={{ borderColor: `${def.color}50`, color: def.color }}>{def.label}</code></td>
                  <td className={styles.valueCell} style={{ color: def.color }}>{s.count ? s.last.toFixed(2) : '—'} {def.unit}</td>
                  <td className={styles.mono}>{s.count ? s.avg.toFixed(2) : '—'}</td>
                  <td className={styles.mono}>{s.count ? s.min.toFixed(2) : '—'}</td>
                  <td className={styles.mono}>{s.count ? s.max.toFixed(2) : '—'}</td>
                  <td className={styles.mono}>{s.count ? s.std.toFixed(3) : '—'}</td>
                  <td className={styles.mono}>{s.count}</td>
                  <td style={{ color: col, fontWeight: 700 }}>{arrow}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}