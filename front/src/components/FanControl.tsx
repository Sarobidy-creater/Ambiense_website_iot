// =========================================================
//  FanControl — contrôle du ventilateur G1E
//  Actions : on / off / set_speed (0-100%)
// =========================================================
import { useState } from 'react';
import { useCommand } from '../hooks/useCommand';
import { OUR_DEVICES } from '../lib/supabase';
import styles from './FanControl.module.css';

export function FanControl() {
  const { lastCommand, sending, error, sendCommand } = useCommand();
  const [speed, setSpeed] = useState(50);

  const send = (action: 'on' | 'off' | 'set_speed') => {
    sendCommand({
      deviceId: OUR_DEVICES.ventilateur,
      action,
      payload: action === 'set_speed' ? { speed } : undefined,
    });
  };

  const statusColor = {
    pending: 'var(--clr-ambre)',
    done:    'var(--clr-vert)',
    error:   'var(--clr-danger)',
  };

  return (
    <section className={styles.panel} aria-labelledby="fan-title">
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">🌀</span>
        <h3 id="fan-title">Ventilateur G1E</h3>
      </div>

      {/* Boutons on/off */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnOn}`}
          onClick={() => send('on')}
          disabled={sending}
          aria-label="Allumer le ventilateur"
        >
          Marche
        </button>
        <button
          className={`${styles.btn} ${styles.btnOff}`}
          onClick={() => send('off')}
          disabled={sending}
          aria-label="Éteindre le ventilateur"
        >
          Arrêt
        </button>
      </div>

      {/* Slider de vitesse */}
      <div className={styles.sliderGroup}>
        <label htmlFor="fan-speed" className={styles.sliderLabel}>
          Vitesse : <strong>{speed} %</strong>
        </label>
        <input
          id="fan-speed"
          type="range"
          min={0}
          max={100}
          step={5}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className={styles.slider}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={speed}
          aria-label="Vitesse du ventilateur"
        />
        <button
          className={`${styles.btn} ${styles.btnSpeed}`}
          onClick={() => send('set_speed')}
          disabled={sending}
          aria-label={`Appliquer la vitesse ${speed}%`}
        >
          {sending ? 'Envoi…' : 'Appliquer'}
        </button>
      </div>

      {/* Statut de la dernière commande */}
      {lastCommand && (
        <div
          className={styles.status}
          role="status"
          aria-live="polite"
          style={{ borderColor: statusColor[lastCommand.status as keyof typeof statusColor] }}
        >
          <span
            className={`badge badge-${lastCommand.status}`}
            aria-label={`Statut : ${lastCommand.status}`}
          >
            {lastCommand.status === 'pending' && '⏳ En attente'}
            {lastCommand.status === 'done'    && '✅ Exécutée'}
            {lastCommand.status === 'error'   && '❌ Erreur'}
          </span>
          <span className={styles.statusDetail}>
            {lastCommand.action}
            {lastCommand.payload?.speed !== undefined && ` — ${lastCommand.payload.speed}%`}
          </span>
        </div>
      )}

      {/* Erreur réseau */}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
