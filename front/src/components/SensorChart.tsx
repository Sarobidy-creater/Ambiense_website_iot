// =========================================================
//  SensorChart — courbe générique pour n'importe quel capteur
//  Recharts AreaChart — fenêtre temporelle configurable
// =========================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useMeasurements } from '../hooks/useMeasurements';
import type { TimeWindow } from '../lib/types';
import styles from './SensorChart.module.css';

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: '5min', label: '5 min' },
  { value: '1h',   label: '1 h'   },
  { value: 'all',  label: 'Tout'  },
];

interface Props {
  deviceId: string;
  unit:     string;
  label:    string;
  color?:   string;   // hex, défaut or premium
  ours?:    boolean;  // si false → mode "en attente"
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?:  string;
}

function ChartTooltip({ active, payload, label, unit }: TooltipProps & { unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{label}</p>
      <p className={styles.tooltipVal}>{payload[0].value.toFixed(1)} {unit}</p>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function SensorChart({ deviceId, unit, label, color = '#C9A240', ours = true }: Props) {
  const [window_, setWindow] = useState<TimeWindow>('1h');

  const { measurements, loading } = useMeasurements({
    deviceId,
    since: window_,
    limit: 300,
  });

  const data = useMemo(() =>
    [...measurements].reverse().map(m => ({
      time:  formatTime(m.created_at),
      value: m.value,
    })),
    [measurements]
  );

  const stats = useMemo(() => {
    if (!measurements.length) return null;
    const vals = measurements.map(m => m.value);
    return {
      min:   Math.min(...vals),
      max:   Math.max(...vals),
      avg:   vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    };
  }, [measurements]);

  const gradId = `grad_${deviceId.replace(/[^a-z0-9]/gi, '_')}`;

  // Groupe pas encore connecté
  if (!ours) {
    return (
      <div className={styles.pending}>
        <span className={styles.pendingDot} />
        <p className={styles.pendingText}>Groupe non encore connecte</p>
        <p className={styles.pendingNote}>Les donnees apparaitront ici des la connexion du groupe.</p>
      </div>
    );
  }

  return (
    <section className={styles.panel} aria-label={`Graphique ${label}`}>

      {/* En-tete */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{label}</h3>
          {!loading && data.length > 0 && (
            <span className={styles.liveDot} aria-label="Temps reel" />
          )}
        </div>

        <fieldset className={styles.windowPicker} aria-label="Fenetre temporelle">
          <legend className="sr-only">Fenetre temporelle</legend>
          {WINDOWS.map(({ value }) => (
            <label key={value} className={styles.windowLabel}>
              <input
                type="radio"
                name={`tw-${deviceId}`}
                value={value}
                checked={window_ === value}
                onChange={() => setWindow(value)}
                className="sr-only"
              />
              <span className={[styles.windowBtn, window_ === value ? styles.windowBtnActive : ''].filter(Boolean).join(' ')}
                style={window_ === value ? { background: color, borderColor: color, color: '#06050A' } : undefined}
              >
                {value === '5min' ? '5 min' : value === '1h' ? '1 h' : 'Tout'}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.stats}>
          {[
            { label: 'Min', value: stats.min },
            { label: 'Moy', value: stats.avg },
            { label: 'Max', value: stats.max },
          ].map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue} style={{ color }}>
                {s.value.toFixed(1)} {unit}
              </span>
            </div>
          ))}
          <div className={styles.stat}>
            <span className={styles.statLabel}>Points</span>
            <span className={styles.statValue} style={{ color }}>{stats.count}</span>
          </div>
        </div>
      )}

      {/* Graphique */}
      {loading ? (
        <div className={styles.loading} role="status">Chargement…</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>
          Aucune donnee pour cette periode.
        </div>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(35,34,53,0.7)" horizontal vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#57566A', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#232235' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#57566A', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                unit={` ${unit}`.trimEnd()}
                domain={['auto', 'auto']}
                width={55}
              />
              <Tooltip content={<ChartTooltip unit={unit} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
