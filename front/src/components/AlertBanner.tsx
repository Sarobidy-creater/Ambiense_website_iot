// =========================================================
//  AlertBanner — alerte visuelle si température > seuil
//  Le seuil est configurable depuis le Dashboard.
//  TODO (Edge Function): brancher un envoi d'email via une
//  Edge Function Supabase (sans exposer de clé secrète
//  côté front) — appeler supabase.functions.invoke('send-alert').
// =========================================================
import { useState } from 'react';
import styles from './AlertBanner.module.css';

interface Props {
  currentTemp: number | null;
  threshold: number;
  onChangeThreshold: (v: number) => void;
}

export function AlertBanner({ currentTemp, threshold, onChangeThreshold }: Props) {
  const [draft, setDraft] = useState(threshold);
  const triggered = currentTemp !== null && currentTemp >= threshold;

  return (
    <div
      className={`${styles.banner} ${triggered ? styles.triggered : ''}`}
      role={triggered ? 'alert' : 'region'}
      aria-live={triggered ? 'assertive' : 'polite'}
      aria-label="Alertes de température"
    >
      <div className={styles.row}>
        <span className={styles.icon} aria-hidden="true">
          {triggered ? '🔴' : '🟢'}
        </span>
        <span className={styles.message}>
          {triggered
            ? `⚠️ Température élevée : ${currentTemp!.toFixed(1)} °C — seuil ${threshold} °C dépassé !`
            : `Température normale${currentTemp !== null ? ` : ${currentTemp.toFixed(1)} °C` : ''}`}
        </span>
      </div>

      {/* Configurer le seuil */}
      <div className={styles.config}>
        <label htmlFor="alert-threshold" className={styles.label}>
          Seuil d'alerte (°C)
        </label>
        <input
          id="alert-threshold"
          type="number"
          min={15}
          max={50}
          step={0.5}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className={styles.input}
          aria-label="Seuil de température en degrés Celsius"
        />
        <button
          className={styles.applyBtn}
          onClick={() => onChangeThreshold(draft)}
          aria-label={`Appliquer le seuil à ${draft} degrés`}
        >
          Appliquer
        </button>
      </div>
    </div>
  );
}
