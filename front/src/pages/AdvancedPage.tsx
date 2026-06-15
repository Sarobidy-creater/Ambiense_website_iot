// =========================================================
//  AdvancedPage — module bonus : pilotage des actionneurs
//  des autres équipes. Clairement séparé (onglet "Avancé").
// =========================================================
import { useDevices }  from '../hooks/useDevices';
import { useCommand }  from '../hooks/useCommand';

import type { Device } from '../lib/types';
import styles from './AdvancedPage.module.css';

/** Panneau de contrôle pour un actionneur externe */
function ExternalActuatorPanel({ device }: { device: Device }) {
  const { lastCommand, sending, error, sendCommand } = useCommand();

  const send = (action: 'on' | 'off') => {
    sendCommand({ deviceId: device.id, action });
  };

  const statusColors: Record<string, string> = {
    pending: 'var(--clr-ambre)',
    done:    'var(--clr-vert)',
    error:   'var(--clr-danger)',
  };

  return (
    <article className={styles.actuatorCard} aria-labelledby={`act-${device.id}`}>
      <header className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          {/* icone actionneur generique */}
        </div>
        <div>
          <h3 id={`act-${device.id}`}>{device.label ?? device.id}</h3>
          <span className={styles.teamBadge}>{device.id}</span>
        </div>
      </header>

      <div className={styles.cardActions}>
        <button
          className={`${styles.btn} ${styles.btnOn}`}
          onClick={() => send('on')}
          disabled={sending}
          aria-label={`Allumer ${device.label ?? device.id}`}
        >Marche</button>
        <button
          className={`${styles.btn} ${styles.btnOff}`}
          onClick={() => send('off')}
          disabled={sending}
          aria-label={`Éteindre ${device.label ?? device.id}`}
        >Arrêt</button>
      </div>

      {/* Slider de vitesse si l'actionneur le supporte — supprimé : on/off uniquement */}

      {/* Statut de la dernière commande */}
      {lastCommand && (
        <div
          className={styles.status}
          style={{ color: statusColors[lastCommand.status] ?? 'inherit' }}
          role="status"
          aria-live="polite"
        >
          <span className={styles.statusDot} aria-hidden="true" />
          Commande {lastCommand.action} — {lastCommand.status}
        </div>
      )}

      {error && (
        <div className={styles.errorMsg} role="alert">{error}</div>
      )}
    </article>
  );
}

export function AdvancedPage() {
  // Uniquement les actionneurs des AUTRES équipes
  const { devices: externalActuators, loading, error, refresh } = useDevices({ kind: 'actuator' });

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Centre de contrôle</h1>
          <p className={styles.subtitle}>Actionneurs externes — accès inter-groupes</p>
        </div>
      </header>

      {/* Note d'information */}
      <div className={styles.infoBox} role="note">
        <div>
          <strong>Actionneurs inter-groupes</strong>
          <p>
            Envoyez des commandes aux actionneurs des autres groupes connectés au réseau.
            Chaque commande est traitée par la passerelle du groupe concerné.
          </p>
        </div>
      </div>

      {/* États */}
      {loading && (
        <p className={styles.stateMsg} role="status">Chargement des actionneurs…</p>
      )}
      {error && (
        <div className={styles.errorBanner} role="alert">
          Erreur : {error}
          <button onClick={refresh} className={styles.retryBtn}>Réessayer</button>
        </div>
      )}

      {!loading && externalActuators.length === 0 && (
        <div className={styles.empty}>
          <p>Aucun actionneur externe disponible</p>
          <p className={styles.emptyHint}>
            Les autres équipes n'ont pas encore déclaré d'actionneurs.
          </p>
        </div>
      )}

      {/* Grille des actionneurs */}
      <div className={styles.grid}>
        {externalActuators.map(device => (
          <ExternalActuatorPanel key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
