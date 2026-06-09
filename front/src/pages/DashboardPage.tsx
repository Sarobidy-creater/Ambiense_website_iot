// =========================================================
//  DashboardPage — station G1E : temperature + ventilateur
//  Pas d'emoji. Panel de surveillance professionnel.
// =========================================================
import { useState, useMemo } from 'react';
import { useMeasurements }  from '../hooks/useMeasurements';
import { useWeather }       from '../hooks/useWeather';
import { FanControl }       from '../components/FanControl';
import { TemperatureChart } from '../components/TemperatureChart';
import { SensorIcon }       from '../components/svg/SensorIcon';
import { OUR_DEVICES }      from '../lib/supabase';
import styles from './DashboardPage.module.css';

// ── Meteo exterieure ────────────────────────────────────

function WeatherWidget() {
  const { weather, loading, error } = useWeather();
  return (
    <div className={styles.weatherWidget}>
      <div className={styles.weatherIcon}>
        <SensorIcon type="temperature" size={18} />
      </div>
      <div>
        <div className={styles.weatherLabel}>Exterieur Paris</div>
        {loading && <span className={styles.weatherValue}>—</span>}
        {error   && <span className={styles.weatherValue}>N/A</span>}
        {weather && (
          <span className={styles.weatherValue}>
            {weather.temperature.toFixed(1)} {weather.unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Bandeau d'alerte ─────────────────────────────────────

function AlertBanner({ value, threshold }: { value: number; threshold: number }) {
  if (value < threshold) return null;
  return (
    <div className={styles.alertBanner} role="alert" aria-live="assertive">
      <span className={styles.alertDot} />
      <div>
        <strong>Alerte chaleur</strong>
        {' — '}Mesure : {value.toFixed(1)} °C au-dessus du seuil de {threshold} °C.
        Activez le ventilateur.
      </div>
    </div>
  );
}

// ── Tuile stat ────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  live?: boolean;
}
function StatTile({ label, value, sub, accent, live }: StatTileProps) {
  return (
    <div className={[styles.statTile, accent ? styles.statTileAccent : ''].filter(Boolean).join(' ')}>
      <div className={styles.statLabel}>
        {label}
        {live && <span className={styles.liveIndicator} aria-label="Temps reel" />}
      </div>
      <div className={styles.statValue}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────

export function DashboardPage() {
  const [alertEnabled,   setAlertEnabled]   = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(28);

  const { measurements, loading: measLoading, error: measError, refresh } = useMeasurements({
    deviceId: OUR_DEVICES.temperature,
    limit: 500,
  });

  const { measurements: humMeas } = useMeasurements({
    deviceId: OUR_DEVICES.humidity,
    limit: 10,
  });

  const latest    = measurements[0];
  const latestHum = humMeas[0];

  const stats = useMemo(() => {
    if (!measurements.length) return null;
    const vals = measurements.map(m => m.value);
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    };
  }, [measurements]);

  return (
    <div className={styles.page}>

      {/* Bandeau alerte */}
      {alertEnabled && latest && (
        <AlertBanner value={latest.value} threshold={alertThreshold} />
      )}

      {/* En-tete */}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageEye}>Station de surveillance</p>
          <h1 className={styles.pageTitle}>G1E — Bar Coupe du Monde</h1>
          {measError && (
            <span className={styles.inlineError} role="alert">
              Erreur : {measError} —{' '}
              <button onClick={refresh} className={styles.retryBtn}>reessayer</button>
            </span>
          )}
        </div>
        <WeatherWidget />
      </header>

      {/* Tuiles stats */}
      <div className={styles.statsRow}>
        <StatTile
          label="Temperature actuelle"
          value={latest ? `${latest.value.toFixed(1)} °C` : '—'}
          sub={latest ? 'DHT15 · mis a jour < 1 s' : 'En attente de donnees'}
          accent={!!latest}
          live
        />
        <StatTile
          label="Humidite"
          value={latestHum ? `${latestHum.value.toFixed(0)} %` : '—'}
          sub={latestHum ? 'DHT15 · humidite relative' : 'En attente de donnees'}
          live={!!latestHum}
        />
        <StatTile
          label="Min session"
          value={stats ? `${stats.min.toFixed(1)} °C` : '—'}
        />
        <StatTile
          label="Max session"
          value={stats ? `${stats.max.toFixed(1)} °C` : '—'}
        />
        <StatTile
          label="Moyenne"
          value={stats ? `${stats.avg.toFixed(1)} °C` : '—'}
          sub={measurements.length ? `${measurements.length} mesures` : undefined}
        />
        {measLoading && (
          <StatTile label="Sync" value="..." live />
        )}
      </div>

      {/* Graphique + Ventilateur */}
      <div className={styles.mainGrid}>
        <div className={styles.chartPanel}>
          <TemperatureChart alertThreshold={alertEnabled ? alertThreshold : undefined} />
        </div>
        <div className={styles.fanPanel}>
          <FanControl />
        </div>
      </div>

      {/* Configuration seuil */}
      <section className={styles.alertSection} aria-labelledby="alert-cfg">
        <h2 id="alert-cfg" className={styles.sectionTitle}>Seuil d'alerte thermique</h2>
        <div className={styles.alertControls}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={alertEnabled}
              onChange={e => setAlertEnabled(e.target.checked)}
              className={styles.checkbox}
            />
            Activer l'alerte
          </label>
          <div className={styles.thresholdGroup}>
            <div className={styles.thresholdHeader}>
              <span className={styles.thresholdLabel}>Seuil</span>
              <span className={styles.thresholdValue}>{alertThreshold} °C</span>
            </div>
            <input
              id="threshold-slider"
              type="range"
              min={20} max={40} step={1}
              value={alertThreshold}
              onChange={e => setAlertThreshold(Number(e.target.value))}
              className={styles.thresholdSlider}
              aria-valuemin={20} aria-valuemax={40} aria-valuenow={alertThreshold}
              disabled={!alertEnabled}
            />
            <div className={styles.thresholdRange}>
              <span>20 °C</span><span>40 °C</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}