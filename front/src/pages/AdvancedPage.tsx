// =========================================================
//  AdvancedPage — module bonus : pilotage des actionneurs
//  des autres équipes. Clairement séparé (onglet "Avancé").
// =========================================================
import { useState } from 'react';
import { useDevices }  from '../hooks/useDevices';
import { useCommand }  from '../hooks/useCommand';

import type { Device } from '../lib/types';
import styles from './AdvancedPage.module.css';

/** Panneau de contrôle pour un actionneur externe */
function ExternalActuatorPanel({ device }: { device: Device }) {
  const { lastCommand, sending, error, sendCommand } = useCommand();
  const [speed, setSpeed] = useState(50);

  const send = (action: 'on' | 'off' | 'set_speed') => {
    sendCommand({
      deviceId: device.id,
      action,
      payload: action === 'set_speed' ? { speed } : undefined,
    });
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

      {/* Slider de vitesse si l'actionneur le supporte */}
      {device.type === 'motor' && (
        <div className={styles.sliderGroup}>
          <label htmlFor={`speed-${device.id}`}>
            Vitesse : <strong>{speed} %</strong>
          </label>
          <div className={styles.sliderRow}>
            <input
              id={`speed-${device.id}`}
              type="range"
              min={0} max={100} step={5}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className={styles.slider}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={speed}
            />
            <button
              className={`${styles.btn} ${styles.btnSpeed}`}
              onClick={() => send('set_speed')}
              disabled={sending}
              aria-label={`Appliquer vitesse ${speed}% à ${device.label ?? device.id}`}
            >Appliquer</button>
          </div>
        </div>
      )}

      {/* Statut de la dernière commande */}
      {lastCommand && (
        <div className={styles.status} style={{ color: statusColors[lastCommand.status] ?? 'inherit' }}>
          <span className={styles.statusDot} />
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

      {/* Avertissement */}
      <div className={styles.infoBox} role="note">
        <div>
          <strong>Accès inter-groupes</strong>
          <p>
            Cette section vous permet d'envoyer des commandes aux actionneurs des
            équipes G2E–G5E. Les commandes sont insérées dans Supabase avec votre
            identifiant utilisateur et exécutées par la passerelle de chaque équipe.
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

      {/* Section informative sur notre passerelle */}
      <section className={styles.infoSection} aria-labelledby="gateway-info">
        <h2 id="gateway-info">Architecture passerelle</h2>
        <p>
          Notre passerelle surveille la table <code>G1E_commands</code> en polling
          (filtre <code>status = 'pending'</code>).
          Elle exécute la commande sur la carte Tiva puis met à jour le statut en <code>done</code> ou <code>error</code>.
        </p>
        <p>
          <strong>TODO Edge Function email :</strong> créer <code>supabase/functions/alert-email/index.ts</code>
          qui reçoit un appel authentifié et envoie un email via Resend ou SMTP.
          Ne jamais mettre de clé API dans le code front-end.
        </p>
      </section>
    </div>
  );
}
