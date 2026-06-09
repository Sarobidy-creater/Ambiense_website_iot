// =========================================================
//  NetworkPage — vue de tous les groupes du réseau IoT
//  G1E : données live depuis la BDD
//  G1A–G1D : en attente de connexion (integration future)
// =========================================================
import { useMemo } from 'react';
import { useDevices }       from '../hooks/useDevices';
import { useMeasurements }  from '../hooks/useMeasurements';
import { DeviceCard }       from '../components/DeviceCard';
import { SensorIcon }       from '../components/svg/SensorIcon';
import type { Device, Measurement } from '../lib/types';
import styles from './NetworkPage.module.css';

/** Associe device_id → dernière mesure */
function buildLastMeasMap(measurements: Measurement[]): Map<string, Measurement> {
  const map = new Map<string, Measurement>();
  for (const m of measurements) {
    if (!map.has(m.device_id)) map.set(m.device_id, m);
  }
  return map;
}

// ── Définition statique des groupes et capteurs attendus ──

interface ExpectedDevice {
  type: string;
  label: string;
  unit: string;
  kind: 'sensor' | 'actuator';
}
interface GroupDef {
  code: string;
  name: string;
  ours: boolean;
  expected: ExpectedDevice[];
}

const GROUPS: GroupDef[] = [
  {
    code: 'G1E', name: 'Bar G1E', ours: true,
    expected: [
      { type: 'temperature', label: 'Temperature', unit: '°C',   kind: 'sensor' },
      { type: 'motor',       label: 'Ventilateur', unit: '',      kind: 'actuator' },
    ],
  },
  {
    code: 'G1A', name: 'Groupe G1A', ours: false,
    expected: [
      { type: 'sound', label: 'Son ambiant', unit: 'dB', kind: 'sensor' },
    ],
  },
  {
    code: 'G1B', name: 'Groupe G1B', ours: false,
    expected: [
      { type: 'presence', label: 'Presence', unit: 'pers.', kind: 'sensor' },
    ],
  },
  {
    code: 'G1C', name: 'Groupe G1C', ours: false,
    expected: [
      { type: 'smoke', label: 'Fumee', unit: 'ppm', kind: 'sensor' },
    ],
  },
  {
    code: 'G1D', name: 'Groupe G1D', ours: false,
    expected: [
      { type: 'alcohol', label: 'Alcool', unit: 'ppm',  kind: 'sensor'   },
      { type: 'buzzer',  label: 'Buzzer', unit: '',      kind: 'actuator' },
    ],
  },
];

// ── Panneau d'un groupe en attente ────────────────────────

function PendingGroupPanel({ group }: { group: GroupDef }) {
  return (
    <div className={styles.groupPanel}>
      <div className={styles.groupHeader}>
        <div>
          <span className={styles.groupCode}>{group.code}</span>
          <span className={styles.groupName}>{group.name}</span>
        </div>
        <span className={styles.pendingBadge}>En attente</span>
      </div>

      <div className={styles.pendingDevices}>
        {group.expected.map(d => (
          <div key={d.label} className={styles.pendingDevice}>
            <span className={styles.pendingIcon}>
              <SensorIcon type={d.type} size={16} />
            </span>
            <span className={styles.pendingLabel}>{d.label}</span>
            {d.unit && <span className={styles.pendingUnit}>{d.unit}</span>}
            <span className={`${styles.kindTag} ${d.kind === 'sensor' ? styles.kindSensor : styles.kindActuator}`}>
              {d.kind === 'sensor' ? 'Capteur' : 'Actionneur'}
            </span>
          </div>
        ))}
      </div>

      <p className={styles.pendingNote}>
        Integration disponible des connexion du groupe
      </p>
    </div>
  );
}

// ── Panneau G1E live ─────────────────────────────────────

function G1EPanel({ devices, lastMeasMap }: {
  devices: Device[];
  lastMeasMap: Map<string, Measurement>;
}) {
  const group = GROUPS[0];
  return (
    <div className={`${styles.groupPanel} ${styles.groupPanelOwn}`}>
      <div className={styles.groupHeader}>
        <div>
          <span className={styles.groupCode}>{group.code}</span>
          <span className={styles.groupName}>{group.name}</span>
        </div>
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Live
        </span>
      </div>

      {devices.length === 0 ? (
        <p className={styles.pendingNote}>Aucun appareil enregistre en BDD</p>
      ) : (
        <div className={styles.deviceGrid}>
          {devices.map(d => (
            <DeviceCard
              key={d.id}
              device={d}
              lastMeasurement={lastMeasMap.get(d.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export function NetworkPage() {
  const { devices, loading, error, refresh } = useDevices();
  const { measurements } = useMeasurements({ limit: 200 });
  const lastMeasMap = useMemo(() => buildLastMeasMap(measurements), [measurements]);

  return (
    <div className={styles.page}>

      {/* En-tete */}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageEye}>Infrastructure IoT</p>
          <h1 className={styles.pageTitle}>Reseau de capteurs</h1>
          <p className={styles.pageSubtitle}>
            5 groupes — {GROUPS.reduce((n, g) => n + g.expected.length, 0)} appareils au total
          </p>
        </div>
      </header>

      {/* Etats globaux */}
      {loading && (
        <p className={styles.stateMsg} role="status">Chargement des appareils…</p>
      )}
      {error && (
        <div className={styles.errorBanner} role="alert">
          Erreur : {error}
          <button onClick={refresh} className={styles.retryBtn}>Reessayer</button>
        </div>
      )}

      {/* Grille des groupes */}
      <div className={styles.groupsGrid}>

        {/* Notre groupe : live */}
        <G1EPanel devices={devices} lastMeasMap={lastMeasMap} />

        {/* Autres groupes : en attente */}
        {GROUPS.filter(g => !g.ours).map(g => (
          <PendingGroupPanel key={g.code} group={g} />
        ))}
      </div>

      {/* Note d'integration */}
      <aside className={styles.integrationNote}>
        <p className={styles.noteTitle}>Integration des autres groupes</p>
        <p className={styles.noteText}>
          Chaque groupe suit la nomenclature <code>GXX_devices</code> / <code>GXX_measurements</code>.
          Des qu'un groupe connecte ses tables, leurs donnees apparaitront ici en temps reel.
        </p>
      </aside>

    </div>
  );
}
