// =========================================================
//  FanControl — contrôle du ventilateur G1E
//  Actions : on / off / set_speed (0-100%)
// =========================================================
import { useCommand } from '../hooks/useCommand';
import { OUR_DEVICES } from '../lib/supabase';
import styles from './FanControl.module.css';

export function FanControl() {
  const { lastCommand, sending, error, sendCommand } = useCommand();

  const send = (action: 'on' | 'off') => {
    sendCommand({
      deviceId: OUR_DEVICES.ventilateur,
      action,
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
