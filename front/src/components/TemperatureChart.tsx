// =========================================================
//  TemperatureChart — courbe temperature + humidite G1E
//  Capteur DHT15 (SEN-KY015TF) — area chart Recharts
//  Mise a jour automatique via polling 1 s
// =========================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts';
import { useMeasurements } from '../hooks/useMeasurements';
import { OUR_DEVICES } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import type { TimeWindow, MeasurementStats } from '../lib/types';
import styles from './TemperatureChart.module.css';

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: '5min', label: '5 min' },
  { value: '1h',   label: '1 h' },
  { value: 'all',  label: 'Tout' },
];

interface Props {
  alertThreshold?: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Tooltip personnalise ─────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{label}</p>
      {payload.map(p => (
        <p key={p.name} className={styles.tooltipRow} style={{ color: p.color }}>
          {p.name} : <strong>{p.value.toFixed(1)}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────

export function TemperatureChart({ alertThreshold }: Props) {
  const { theme } = useTheme();
  const tickFaint = theme === 'light' ? '#5A596E' : '#787790';
  const tickGold  = theme === 'light' ? '#7A5E00' : '#C9A240';
  const tickTeal  = theme === 'light' ? '#007070' : '#2BBFBF';
  const [window_, setWindow] = useState<TimeWindow>('1h');

  const { measurements: tempMeas, loading: tempLoading } = useMeasurements({
    deviceId: OUR_DEVICES.temperature,
    since:    window_,
    limit:    200,
  });
  const { measurements: humMeas } = useMeasurements({
    deviceId: OUR_DEVICES.humidity,
    since:    window_,
    limit:    200,
  });

  // Fusionne temp + humidite en triant par horodatage ISO (chronologique)
  // La cle de fusion est l'ISO tronque a la minute pour aligner les deux series
  const data = useMemo(() => {
    // Cle = ISO a la minute (ex: "2026-06-10T11:28"), tri chronologique garanti
    const isoMin = (iso: string) => iso.slice(0, 16);

    const tempByMin = new Map(
      [...tempMeas].reverse().map(m => [isoMin(m.created_at), { value: m.value, raw: m.created_at }])
    );
    const humByMin = new Map(
      [...humMeas].reverse().map(m => [isoMin(m.created_at), { value: m.value, raw: m.created_at }])
    );

    // Tri ISO = tri chronologique correct, meme sur plusieurs jours
    const allKeys = [...new Set([...tempByMin.keys(), ...humByMin.keys()])].sort();

    return allKeys.map(k => ({
      time: formatTime((tempByMin.get(k) ?? humByMin.get(k))!.raw),
      temp: tempByMin.get(k)?.value ?? null,
      hum:  humByMin.get(k)?.value  ?? null,
    }));
  }, [tempMeas, humMeas]);

  const stats = useMemo<MeasurementStats | null>(() => {
    if (!tempMeas.length) return null;
    const vals = tempMeas.map(m => m.value);
    return {
      min:   Math.min(...vals),
      max:   Math.max(...vals),
      avg:   vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    };
  }, [tempMeas]);

  const hasData = data.length > 0;
  const isLive  = !tempLoading;

  return (
    <section className={styles.panel} aria-labelledby="chart-title">

      {/* En-tete */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 id="chart-title" className={styles.title}>
            Ambiance thermique
          </h3>
          {isLive && hasData && (
            <span className={styles.liveDot} aria-label="Mise à jour en direct" />
          )}
        </div>

        {/* Selecteur de fenetres */}
        <fieldset className={styles.windowPicker} aria-label="Fenetre temporelle">
          <legend className="sr-only">Fenetre temporelle</legend>
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
              <span className={[styles.windowBtn, window_ === value ? styles.windowBtnActive : ''].filter(Boolean).join(' ')}>
                {label}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* Stats temperature */}
      {stats && (
        <div className={styles.stats} role="region" aria-label="Statistiques temperature">
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
            <span
              className={styles.statValue}
              style={{ color: stats.max >= (alertThreshold ?? 99) ? 'var(--clr-danger)' : undefined }}
            >
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
      {tempLoading ? (
        <div className={styles.loading} role="status">Chargement…</div>
      ) : !hasData ? (
        <div className={styles.empty} role="status">
          Aucune donnee — le capteur n&rsquo;a pas encore envoy&eacute; de mesures.
        </div>
      ) : (
        <div
          className={styles.chartWrap}
          role="img"
          aria-label={`Graphique Ambiance thermique — Température : min ${stats ? stats.min.toFixed(1) : '—'}°C, moy ${stats ? stats.avg.toFixed(1) : '—'}°C, max ${stats ? stats.max.toFixed(1) : '—'}°C`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C9A240" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C9A240" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2BBFBF" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#2BBFBF" stopOpacity={0}    />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="0"
                stroke="rgba(35,34,53,0.8)"
                horizontal vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: tickFaint, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#232235' }}
                interval="preserveStartEnd"
              />
              {/* Axe gauche : temperature */}
              <YAxis
                yAxisId="temp"
                tick={{ fill: tickGold, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                unit="°"
                domain={['auto', 'auto']}
              />
              {/* Axe droit : humidite */}
              <YAxis
                yAxisId="hum"
                orientation="right"
                tick={{ fill: tickTeal, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8, color: '#8A8898' }}
              />

              {/* Seuil alerte */}
              {alertThreshold !== undefined && (
                <ReferenceLine
                  yAxisId="temp"
                  y={alertThreshold}
                  stroke="#C0392B"
                  strokeDasharray="6 3"
                  label={{
                    value: `${alertThreshold}\u00b0C`,
                    fill: '#C0392B', fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Aire temperature */}
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                name="Temperature (°C)"
                stroke="#C9A240"
                strokeWidth={2}
                fill="url(#gradTemp)"
                dot={false}
                activeDot={{ r: 4, fill: '#E5BC6A', strokeWidth: 0 }}
                connectNulls
              />
              {/* Ligne humidite */}
              <Line
                yAxisId="hum"
                type="monotone"
                dataKey="hum"
                name="Humidite (%)"
                stroke="#2BBFBF"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 3, fill: '#3DD6D6', strokeWidth: 0 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}