// =========================================================
//  WeatherWidget — température extérieure (Open-Meteo)
//  vs température intérieure du bar (comparaison)
// =========================================================
import { useWeather } from '../hooks/useWeather';
import type { Measurement } from '../lib/types';
import styles from './WeatherWidget.module.css';

interface Props {
  /** Dernière mesure de température intérieure */
  lastIndoor?: Measurement;
}

export function WeatherWidget({ lastIndoor }: Props) {
  const { weather, loading, error } = useWeather();

  const indoor  = lastIndoor?.value ?? null;
  const outdoor = weather?.temperature ?? null;
  const diff    = indoor !== null && outdoor !== null ? indoor - outdoor : null;

  return (
    <section className={styles.widget} aria-labelledby="weather-title">
      <h3 id="weather-title" className={styles.title}>
        🌤️ Météo — Intérieur / Extérieur
      </h3>

      {error && (
        <p className={styles.error} role="alert">Météo indisponible : {error}</p>
      )}

      <div className={styles.grid}>
        {/* Intérieur */}
        <div className={styles.block}>
          <span className={styles.blockLabel}>Intérieur bar</span>
          <span className={styles.blockValue} aria-label={`Température intérieure : ${indoor !== null ? indoor.toFixed(1) : '—'} degrés Celsius`}>
            {indoor !== null ? `${indoor.toFixed(1)} °C` : '—'}
          </span>
        </div>

        {/* Séparateur */}
        <div className={styles.divider} aria-hidden="true">↔</div>

        {/* Extérieur */}
        <div className={styles.block}>
          <span className={styles.blockLabel}>Extérieur (Paris)</span>
          <span className={styles.blockValue} aria-label={`Température extérieure : ${loading ? 'chargement' : outdoor !== null ? outdoor.toFixed(1) : '—'} degrés Celsius`}>
            {loading ? '…' : outdoor !== null ? `${outdoor.toFixed(1)} ${weather!.unit}` : '—'}
          </span>
        </div>
      </div>

      {/* Différentiel */}
      {diff !== null && (
        <div className={styles.diff} role="status" aria-live="polite">
          {diff > 0 ? (
            <span style={{ color: 'var(--clr-danger)' }}>
              ↑ +{diff.toFixed(1)} °C plus chaud à l'intérieur
              {diff > 5 && ' — pensez à activer la ventilation !'}
            </span>
          ) : diff < 0 ? (
            <span style={{ color: 'var(--clr-vert)' }}>
              ↓ {diff.toFixed(1)} °C plus frais à l'intérieur
            </span>
          ) : (
            <span style={{ color: 'var(--clr-text-muted)' }}>
              Même température intérieure et extérieure
            </span>
          )}
        </div>
      )}
    </section>
  );
}
