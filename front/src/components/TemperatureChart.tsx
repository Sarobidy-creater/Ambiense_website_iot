// =========================================================
//  TemperatureChart — courbe de température G1E (Recharts)
//  Sélecteur de fenêtre : 5 min / 1 h / tout
// =========================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts';
import { useMeasurements } from '../hooks/useMeasurements';
import { OUR_DEVICES } from '../lib/supabase';
import type { TimeWindow, MeasurementStats } from '../lib/types';
import styles from './TemperatureChart.module.css';

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: '5min', label: '5 min' },
  { value: '1h',   label: '1 heure' },
  { value: 'all',  label: 'Tout' },
];

interface Props {
  alertThreshold?: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function TemperatureChart({ alertThreshold }: Props) {
  const [window_, setWindow] = useState<TimeWindow>('1h');
  const { measurements, loading } = useMeasurements({
    deviceId: OUR_DEVICES.temperature,
    since:    window_,
    limit:    500,
  });

  const data = useMemo(
    () =>
      [...measurements]
        .reverse()
        .map((m) => ({ time: formatTime(m.created_at), value: m.value, raw: m.created_at })),
    [measurements]
  );

  const stats = useMemo<MeasurementStats | null>(() => {
    if (measurements.length === 0) return null;
    const vals = measurements.map((m) => m.value);
    return {
      min:   Math.min(...vals),
      max:   Math.max(...vals),
      avg:   vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    };
  }, [measurements]);

  return (
    <section className={styles.panel} aria-labelledby="chart-title">
      <div className={styles.header}>
        <h3 id="chart-title">Temperature G1E</h3>

        {/* Sélecteur de fenêtre */}
        <fieldset className={styles.windowPicker} aria-label="Fenêtre temporelle">
          <legend className="sr-only">Fenêtre temporelle</legend>
          {WINDOWS.map(({ value, label }) => (
            <label key={value} className={styles.windowLabel}>
              <input
                type="radio"
                name="time-window"
                value={value}
                checked={window_ === value}
                onChange={() => setWindow(value)}
                className="sr-only"
              />
              <span className={`${styles.windowBtn} ${window_ === value ? styles.windowBtnActive : ''}`}>
                {label}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.stats} role="region" aria-label="Statistiques de température">
          <div className={styles.stat}>
            <span className={styles.statLabel}>Min</span>
            <span className={styles.statValue}>{stats.min.toFixed(1)} °C</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moy</span>
            <span className={styles.statValue}>{stats.avg.toFixed(1)} °C</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Max</span>
            <span className={styles.statValue} style={{ color: stats.max >= (alertThreshold ?? 99) ? 'var(--clr-danger)' : 'inherit' }}>
              {stats.max.toFixed(1)} °C
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Points</span>
            <span className={styles.statValue}>{stats.count}</span>
          </div>
        </div>
      )}

      {/* Graphique */}
      {loading ? (
        <div className={styles.loading} role="status" aria-live="polite">Chargement…</div>
      ) : data.length === 0 ? (
        <div className={styles.empty} role="status">Aucune donnée pour cette période.</div>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,56,40,0.4)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#9E8C78', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#4A3828' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#9E8C78', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="°C"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: '#2A2018', border: '1px solid #4A3828',
                  borderRadius: 8, color: '#F5EFE2',
                }}
                labelStyle={{ color: '#9E8C78', fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ color: '#9E8C78', fontSize: 12, paddingTop: 8 }}
              />
              {/* Seuil d'alerte */}
              {alertThreshold !== undefined && (
                <ReferenceLine
                  y={alertThreshold}
                  stroke="var(--clr-danger)"
                  strokeDasharray="6 3"
                  label={{ value: `Seuil ${alertThreshold}°C`, fill: '#C0392B', fontSize: 11, position: 'insideTopRight' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                name="Température"
                stroke="var(--clr-ambre)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--clr-ambre-clair)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
