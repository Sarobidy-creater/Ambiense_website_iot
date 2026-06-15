// =========================================================
//  GroupSensorChart — graphique pour un capteur externe
//  Utilise get_group_table_generic via useGroupHistory.
//  Réutilise les styles de SensorChart.module.css.
// =========================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useGroupHistory }  from '../hooks/useGroupHistory';
import { useTheme }         from '../theme/ThemeContext';
import type { TimeWindow }  from '../lib/types';
import styles from './SensorChart.module.css';

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: '5min', label: '5 min' },
  { value: '1h',   label: '1 h'   },
  { value: 'all',  label: 'Tout'  },
];

interface Props {
  groupCode: string;
  unit:      string;
  label:     string;
  color?:    string;
}

interface TooltipProps {
  active?:  boolean;
  payload?: Array<{ value: number }>;
  label?:   string;
  unit:     string;
}

function ChartTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{label}</p>
      <p className={styles.tooltipVal}>{payload[0].value.toFixed(2)} {unit}</p>
    </div>
  );
}

export function GroupSensorChart({ groupCode, unit, label, color = '#C9A240' }: Props) {
  const { theme } = useTheme();
  const tickFaint = theme === 'light' ? '#5A596E' : '#787790';
  const [window_, setWindow] = useState<TimeWindow>('all');

  const { points, loading, error } = useGroupHistory(groupCode, window_);

  const stats = useMemo(() => {
    if (!points.length) return null;
    const vals = points.map(p => p.value);
    return {
      min:   Math.min(...vals),
      max:   Math.max(...vals),
      avg:   vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    };
  }, [points]);

  const gradId = `grad_grp_${groupCode}`;

  return (
    <section className={styles.panel} aria-label={`Graphique ${label}`}>

      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{label}</h3>
          {!loading && points.length > 0 && (
            <span className={styles.liveDot} role="img" aria-label="Données disponibles" />
          )}
        </div>

        <fieldset className={styles.windowPicker} aria-label="Fenêtre temporelle">
          <legend className="sr-only">Fenêtre temporelle</legend>
          {WINDOWS.map(({ value }) => (
            <label key={value} className={styles.windowLabel}>
              <input
                type="radio"
                name={`tw-${groupCode}`}
                value={value}
                checked={window_ === value}
                onChange={() => setWindow(value)}
                className="sr-only"
              />
              <span
                className={[styles.windowBtn, window_ === value ? styles.windowBtnActive : ''].filter(Boolean).join(' ')}
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
                {s.value.toFixed(2)} {unit}
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
      ) : error ? (
        <div className={styles.empty}>{error}</div>
      ) : points.length === 0 ? (
        <div className={styles.empty}>Aucune donnée pour cette période.</div>
      ) : (
        <div className={styles.chartWrap} role="img" aria-label={`Graphique ${label}`}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={points} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="rgba(35,34,53,0.7)" horizontal vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: tickFaint, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#232235' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: tickFaint, fontSize: 10 }}
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
