// =========================================================
//  FanControl — controle ventilateur G1E avec SVG anime
//  Pas d'emoji.
// =========================================================
import { useState } from 'react';
import { useCommand } from '../hooks/useCommand';
import { FanSvg }    from './svg/FanSvg';
import { OUR_DEVICES } from '../lib/supabase';
import styles from './FanControl.module.css';

export function FanControl() {
  const { lastCommand, sending, error, sendCommand } = useCommand();
  // Etat local optimiste : on met a jour localement en attendant
  const [isRunning, setIsRunning] = useState(false);

  const send = (action: 'on' | 'off') => {
    if (action === 'on')  setIsRunning(true);
    if (action === 'off') setIsRunning(false);
    sendCommand({
      deviceId: OUR_DEVICES.ventilateur,
      action,
    });
  };

  const cmdStatus = lastCommand?.status ?? null;
  const statusClass =
    cmdStatus === 'done'    ? styles.statusDone    :
    cmdStatus === 'error'   ? styles.statusError   :
    cmdStatus === 'pending' ? styles.statusPending :
    '';

  return (
    <section className={styles.panel} aria-labelledby="fan-title">

      {/* Visualisation SVG */}
      <div className={styles.fanVisual}>
        <FanSvg speed={100} running={isRunning} size={100} />
        <div className={styles.fanState}>
          <span className={isRunning ? styles.fanOn : styles.fanOff}>
            {isRunning ? 'En marche' : 'Arrete'}
          </span>
        </div>
      </div>

      {/* Titre */}
      <h3 id="fan-title" className={styles.title}>Ventilateur G1E</h3>

      {/* Boutons marche / arret */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnOn} ${isRunning ? styles.btnActive : ''}`}
          onClick={() => send('on')}
          disabled={sending}
          aria-pressed={isRunning}
          aria-label="Allumer le ventilateur"
        >
          Marche
        </button>
        <button
          className={`${styles.btn} ${styles.btnOff} ${!isRunning ? styles.btnActive : ''}`}
          onClick={() => send('off')}
          disabled={sending}
          aria-pressed={!isRunning}
          aria-label="Eteindre le ventilateur"
        >
          Arret
        </button>
      </div>

      {/* Statut commande */}
      {lastCommand && (
        <div className={`${styles.cmdStatus} ${statusClass}`} role="status" aria-live="polite">
          <span className={styles.cmdDot} />
          <span>
            Commande <strong>{lastCommand.action}</strong> — {lastCommand.status}
          </span>
        </div>
      )}

      {error && (
        <p className={styles.errorMsg} role="alert">{error}</p>
      )}
    </section>
  );
}