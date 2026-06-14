// =========================================================
//  AdminAnalyticsPage — agregats horaires + anomalies + stats
// =========================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine,
} from 'recharts';
import { useAdminAggregates, useAdminHourly, type HourlyBucket } from '../../hooks/useAdmin';
import { useTheme } from '../../theme/ThemeContext';
import { GROUPS, type SensorWithGroup } from '../../lib/groups';
import styles from './AdminPage.module.css';

// Capteurs scalaires uniquement
const SENSORS: SensorWithGroup[] = GROUPS
  .flatMap(g => g.sensors.map(s => ({ ...s, group: g.code, groupName: g.name, ours: g.ours, color: g.color })))
  .filter(s => s.kind === 'sensor' && s.ours);

// ── Utilitaire couleur ────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Heatmap horaire ──────────────────────────────────────
function HourlyHeatmap({ buckets, sensor }: { buckets: HourlyBucket[]; sensor: SensorWithGroup }) {
  const vals  = buckets.map(b => b.avg);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const range = maxV - minV || 1;

  const grid = Array.from({ length: 24 }, (_, h) => {
    const key = `${String(h).padStart(2, '0')}:00`;
    return { hour: key, bucket: buckets.find(b => b.hour === key) ?? null };
  });

  return (
    <div
      role="list"
      aria-label={`Distribution horaire ${sensor.label}`}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}
    >
      {grid.map(({ hour, bucket: b }) => {
        const intensity = b ? (b.avg - minV) / range : 0;
        const bg        = b ? hexToRgba(sensor.color, 0.12 + intensity * 0.68) : 'var(--clr-surface)';
        const border    = b ? `1px solid ${hexToRgba(sensor.color, 0.3 + intensity * 0.5)}` : '1px solid var(--clr-nuit-bord)';
        return (
          <div
            key={hour}
            role="listitem"
            title={b
              ? `${hour} — moy: ${b.avg.toFixed(1)} ${sensor.unit}, min: ${b.min.toFixed(1)}, max: ${b.max.toFixed(1)}, ${b.count} mesure${b.count > 1 ? 's' : ''}`
              : `${hour} — aucune mesure`}
            style={{ background: bg, border, borderRadius: 6, padding: '10px 4px 8px', textAlign: 'center', opacity: b ? 1 : 0.35 }}
          >
            <div style={{ fontSize: 9, color: 'var(--clr-text-muted)', letterSpacing: '0.05em' }}>{hour}</div>
            {b ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4, color: 'var(--clr-text)' }}>
                  {b.avg.toFixed(1)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--clr-text-faint)', marginTop: 2 }}>{b.count}×</div>
              </>
            ) : (
              <div style={{ fontSize: 11, marginTop: 4, color: 'var(--clr-text-faint)' }}>—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Custom Tooltip ───────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { dataKey: string; value: number; color: string; name: string }[]; label?: string; unit: string;
}) {
  if (!active || !payload?.length) return null;
  const main     = payload.find(p => p.dataKey === 'value');
  const isAnom   = payload.some(p => p.dataKey === 'anomaly' && p.value != null);
  return (
    <div style={{ background: '#0E0D14', border: '1px solid #232235', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: '#787790', marginBottom: 4, margin: '0 0 4px' }}>{label}</p>
      {main && (
        <p style={{ color: main.color, margin: 0 }}>
          {main.name}: <strong>{main.value?.toFixed(2)} {unit}</strong>
        </p>
      )}
      {isAnom && <p style={{ color: 'var(--clr-danger)', margin: '4px 0 0', fontSize: 11 }}>⚠ Valeur anormale</p>}
    </div>
  );
}

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

  const anomalies = useMemo(() => {
    if (!currentStat || currentStat.count === 0) return [];
    return currentStat.points.filter(p => Math.abs(p.value - currentStat.avg) > 2 * currentStat.std);
  }, [currentStat]);

  const chartData = useMemo(() => {
    if (!currentStat) return [];
    return currentStat.points.map(p => ({
      ...p,
      anomaly: Math.abs(p.value - currentStat.avg) > 2 * currentStat.std ? p.value : undefined,
    }));
  }, [currentStat]);

  const xTickInterval = Math.max(1, Math.floor(chartData.length / 8)) - 1;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <p className={styles.pageSub}>Tendances, distribution horaire, anomalies</p>
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
            { label: 'Dernière valeur', value: currentStat.last.toFixed(2), unit: sensor.unit },
            { label: 'Moyenne',         value: currentStat.avg.toFixed(2),  unit: sensor.unit },
            { label: 'Min / Max',       value: `${currentStat.min.toFixed(1)} / ${currentStat.max.toFixed(1)}` },
            { label: 'Écart-type',      value: currentStat.std.toFixed(3) },
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

      {statsLoading && <p className={styles.stateMsg}>Calcul des agrégats…</p>}

      {/* ── Courbe temporelle ── */}
      {chartData.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Évolution — {sensor.label}
            {anomalies.length > 0 && (
              <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--clr-danger)' }}>
                ⚠ {anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-nuit-bord)', padding: 'var(--sp-5)', borderRadius: 4 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={sensor.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sensor.color} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(35,34,53,0.5)" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: tickFaint, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={xTickInterval}
                />
                <YAxis
                  tick={{ fill: tickFaint, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  unit={' ' + sensor.unit}
                  width={56}
                />
                <Tooltip content={<ChartTooltip unit={sensor.unit} />} />
                {currentStat && (
                  <ReferenceLine
                    y={currentStat.avg}
                    stroke={tickGold}
                    strokeDasharray="5 3"
                    strokeOpacity={0.6}
                    label={{ value: `moy ${currentStat.avg.toFixed(1)}`, fill: tickGold, fontSize: 10, position: 'insideTopRight' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="value"
                  name={sensor.label}
                  stroke={sensor.color}
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
                {anomalies.length > 0 && (
                  <Area
                    type="monotone"
                    dataKey="anomaly"
                    name="Anomalie"
                    stroke="var(--clr-danger)"
                    strokeWidth={0}
                    fill="transparent"
                    dot={{ r: 5, fill: 'var(--clr-danger)', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'var(--clr-danger)' }}
                    connectNulls={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Heatmap horaire ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Distribution horaire — 24 h</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--sp-4)' }}>
          Chaque cellule = 1 heure. La couleur indique l&apos;intensité moyenne ({sensor.unit}). Survolez pour les détails.
        </p>
        {hourLoading ? (
          <p className={styles.stateMsg}>Chargement…</p>
        ) : buckets.length === 0 ? (
          <p className={styles.stateMsg}>Pas de données sur 24 h.</p>
        ) : (
          <HourlyHeatmap buckets={buckets} sensor={sensor} />
        )}
      </section>

      {/* ── Tableau comparatif tous capteurs ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Comparaison tous capteurs G1E</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Capteur</th><th>Dernier</th><th>Moy</th><th>Min</th><th>Max</th>
              <th>Écart-type</th><th>Points</th><th>Tendance</th>
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