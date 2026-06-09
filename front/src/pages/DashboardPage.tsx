// =========================================================
//  DashboardPage — tableau de bord principal
//  · Données de toutes les équipes (polling/realtime)
//  · Contrôle ventilateur G1E
//  · Graphique température + météo extérieure
//  · Alertes seuil configurable
// =========================================================
import { useState, useMemo } from 'react';
import { useDevices }       from '../hooks/useDevices';
import { useMeasurements }  from '../hooks/useMeasurements';
import { useWeather }       from '../hooks/useWeather';
import { DeviceCard }       from '../components/DeviceCard';
import { FanControl }       from '../components/FanControl';
import { TemperatureChart } from '../components/TemperatureChart';
import { EmptyBaobab }      from '../components/svg/EmptyBaobab';
import type { Measurement } from '../lib/types';
import styles from './DashboardPage.module.css';

/** Renvoie la dernière mesure pour chaque device_id */
function buildLastMeasMap(measurements: Measurement[]): Map<string, Measurement> {
  const map = new Map<string, Measurement>();
  for (const m of measurements) {
    if (!map.has(m.device_id)) map.set(m.device_id, m);
  }
  return map;
}

/** Panneau de la température extérieure Open-Meteo */
function WeatherPanel() {
  const { weather, loading, error } = useWeather();
  return (
    <div className={styles.weatherPanel}>
      <span className={styles.weatherIcon} aria-hidden="true">🌤️</span>
      <div>
        <div className={styles.weatherLabel}>Extérieur (Paris)</div>
        {loading && <span className={styles.weatherValue}>…</span>}
        {error   && <span className={styles.weatherError}>N/A</span>}
        {weather && (
          <span className={styles.weatherValue}>
            {weather.temperature.toFixed(1)} {weather.unit}
          </span>
        )}
      </div>
    </div>
  );
}

/** Bannière d'alerte température */
function AlertBanner({ value, threshold }: { value: number; threshold: number }) {
  if (value < threshold) return null;
  return (
    <div className={styles.alertBanner} role="alert" aria-live="assertive">
      <span aria-hidden="true">🚨</span>
      <strong>Alerte chaleur !</strong>
      Température mesurée ({value.toFixed(1)} °C) au-dessus du seuil ({threshold} °C).
      Pensez à activer le ventilateur.
      {/* TODO: brancher l'envoi d'email via une Edge Function Supabase
          — ne jamais exposer la clé service ici. Appeler /functions/v1/alert-email
          avec un appel fetch authentifié depuis le contexte utilisateur connecté. */}
    </div>
  );
}

export function DashboardPage() {
  const [typeFilter, setTypeFilter] = useState('');

  // Configuration du seuil d'alerte (persisté localement)
  const [alertEnabled,   setAlertEnabled]   = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(28);

  // Tous les appareils (toutes équipes)
  const { devices, loading: devLoading, error: devError, refresh } = useDevices();

  // Toutes les dernières mesures (polling 1 s)
  const { measurements, loading: measLoading, error: measError } = useMeasurements({
    limit: 500,
  });

  const lastMeasMap = useMemo(
    () => buildLastMeasMap(measurements),
    [measurements]
  );

  // Dernière température G1E pour l'alerte
  const lastTempMeas = useMemo(
    () => measurements.find(m => m.device_id === 'G1E_temperature'),
    [measurements]
  );

  // Filtrage des appareils affichés
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (typeFilter && d.type !== typeFilter) return false;
      return true;
    });
  }, [devices, typeFilter]);

  // Types disponibles pour le filtre
  const availableTypes = useMemo(
    () => [...new Set(devices.map(d => d.type))].sort(),
    [devices]
  );

  return (
    <div className={styles.page}>
      {/* ---- Alerte seuil ---- */}
      {alertEnabled && lastTempMeas && (
        <AlertBanner value={lastTempMeas.value} threshold={alertThreshold} />
      )}

      {/* ---- Titre + météo ---- */}
      <header className={styles.pageHeader}>
        <div>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>
            Données en direct G1E
            {(measLoading || devLoading) && (
              <span className={styles.syncDot} title="Synchronisation…" aria-label="Synchronisation en cours" />
            )}
          </p>
          {measError && (
            <span className={styles.inlineError} role="alert">
              Erreur : {measError} —{' '}
              <button onClick={refresh} className={styles.retryInline}>réessayer</button>
            </span>
          )}
        </div>
        <WeatherPanel />
      </header>

      {/* ---- Configuration alerte ---- */}
      <section className={styles.alertConfig} aria-labelledby="alert-config-title">
        <h2 id="alert-config-title" className={styles.sectionTitle}>
          Seuil d’alerte thermique
        </h2>
        <div className={styles.alertControls}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={alertEnabled}
              onChange={e => setAlertEnabled(e.target.checked)}
              aria-label="Activer l'alerte de seuil"
            />
            Activer l'alerte
          </label>
          <div className={styles.thresholdGroup}>
            <label htmlFor="threshold-slider">
              Seuil : <strong>{alertThreshold} °C</strong>
            </label>
            <input
              id="threshold-slider"
              type="range"
              min={20}
              max={40}
              step={1}
              value={alertThreshold}
              onChange={e => setAlertThreshold(Number(e.target.value))}
              className={styles.thresholdSlider}
              aria-valuemin={20}
              aria-valuemax={40}
              aria-valuenow={alertThreshold}
              aria-label={`Seuil d'alerte : ${alertThreshold} degrés Celsius`}
              disabled={!alertEnabled}
            />
          </div>
        </div>
      </section>

      {/* ---- Contrôle ventilateur + graphique ---- */}
      <section className={styles.g1eRow} aria-labelledby="g1e-section">
        <h2 id="g1e-section" className={styles.sectionTitle}>
          Ventilation
        </h2>
        <div className={styles.g1eGrid}>
          <FanControl />
          <TemperatureChart alertThreshold={alertEnabled ? alertThreshold : undefined} />
        </div>
      </section>

      {/* ---- Filtres ---- */}
      <div className={styles.filtersBar} role="group" aria-label="Filtres des appareils">
        <span className={styles.filtersLabel}>Filtrer :</span>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className={styles.typeSelect}
          aria-label="Type de capteur"
        >
          <option value="">Tous les types</option>
          {availableTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ---- Grille des appareils ---- */}
      <section aria-label="Appareils et mesures en direct">
        {devError && (
          <div className={styles.errorBanner} role="alert">
            Erreur appareils : {devError}
          </div>
        )}
        {!devLoading && filteredDevices.length === 0 && (
          <div className={styles.empty}>
            <EmptyBaobab />
            <p>Aucun appareil pour ces filtres</p>
          </div>
        )}
        <div className={styles.devicesGrid}>
          {filteredDevices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              lastMeasurement={lastMeasMap.get(device.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
