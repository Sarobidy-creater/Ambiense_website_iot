// =========================================================
//  NetworkPage — vue globale de tous les groupes IoT
//  G1E : données live · G1A-G1D : lecture directe des capteurs
// =========================================================
import { useMemo } from 'react';
import { Link }            from 'react-router-dom';
import { useDevices }      from '../hooks/useDevices';
import { useMeasurements } from '../hooks/useMeasurements';
import { useGroupSensors } from '../hooks/useGroupSensors';
import type { GroupSensorReading } from '../hooks/useGroupSensors';
import { SensorIcon }      from '../components/svg/SensorIcon';
import { GROUPS, formatValue } from '../lib/groups';
import type { Measurement } from '../lib/types';
import styles from './NetworkPage.module.css';

// ── Helpers ───────────────────────────────────────────────

function buildLastMeasMap(measurements: Measurement[]): Map<string, Measurement> {
  const map = new Map<string, Measurement>();
  for (const m of measurements) {
    if (!map.has(m.device_id)) map.set(m.device_id, m);
  }
  return map;
}

function isOnline(meas?: Measurement): boolean {
  if (!meas) return false;
  return Date.now() - new Date(meas.created_at).getTime() < 5 * 60_000;
}

function formatSensorValue(s: GroupSensorReading): string {
  if (s.value === null) return '—';
  if (s.type === 'presence') return `${s.value} ${s.unit}`;
  if (s.type === 'alcohol')  return `${s.value.toFixed(2)} ${s.unit}`;
  if (s.type === 'sound')    return `${Math.round(s.value)} ${s.unit}`;
  return `${s.value} ${s.unit}`;
}

function timeAgo(ts: string | null): string {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (sec < 60)    return `${sec} s`;
  if (sec < 3600)  return `${Math.floor(sec / 60)} min`;
  return `${Math.floor(sec / 3600)} h`;
}

// ── Panneau d'un groupe externe ───────────────────────────

interface OtherGroupPanelProps {
  code:     string;
  name:     string;
  color:    string;
  reading:  GroupSensorReading | undefined;
  deviceId: string;
}

function OtherGroupPanel({ code, name, color, reading, deviceId }: OtherGroupPanelProps) {
  const connected = reading != null;
  const online    = reading?.online ?? false;
  const hasValue  = reading?.value !== null && reading?.value !== undefined;

  return (
    <div className={styles.groupPanel}>
      <div className={styles.groupHeader}>
        <div>
          <span className={styles.groupCode} style={{ color }}>{code}</span>
          <span className={styles.groupName}>{name}</span>
        </div>
        {online ? (
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Live
          </span>
        ) : connected ? (
          <span className={styles.connectedBadge}>Connecté</span>
        ) : (
          <span className={styles.pendingBadge}>En attente</span>
        )}
      </div>

      <div className={styles.sensorList}>
        {reading ? (
          <Link
            to={`/sensor/${deviceId}`}
            className={`${styles.sensorRow} ${online ? styles.sensorOnline : ''}`}
          >
            <span className={styles.sensorIcon} style={{ color: online ? color : undefined }}>
              <SensorIcon type={reading.type} size={16} />
            </span>
            <div className={styles.sensorInfo}>
              <span className={styles.sensorLabel}>{reading.label}</span>
              {reading.timestamp && (
                <span className={styles.sensorId}>
                  il y a {timeAgo(reading.timestamp)}
                </span>
              )}
              {!reading.timestamp && reading.error && (
                <span className={styles.sensorId}>{reading.error}</span>
              )}
            </div>
            <div className={styles.sensorRight}>
              {hasValue ? (
                <span className={styles.sensorValue} style={{ color: online ? color : undefined }}>
                  {formatSensorValue(reading)}
                </span>
              ) : (
                <span className={styles.sensorUnit}>—</span>
              )}
              <span className={styles.sensorArrow} aria-hidden="true">›</span>
            </div>
          </Link>
        ) : (
          <p className={styles.noData}>Aucune donnée disponible</p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────

export function NetworkPage() {
  const { loading: devLoading, error: devError, refresh: devRefresh } = useDevices();
  const { measurements } = useMeasurements({ limit: 200 });
  const lastMeasMap = useMemo(() => buildLastMeasMap(measurements), [measurements]);

  const { sensors, loading: sensLoading, refresh: sensRefresh } = useGroupSensors();

  const loading  = devLoading || sensLoading;
  const anyError = devError;
  const refresh  = () => { devRefresh(); sensRefresh(); };

  const onlineCount = sensors.filter(s => s.online).length + 1; // +1 pour G1E

  return (
    <div className={styles.page}>

      {/* En-tete */}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageEye}>Infrastructure IoT</p>
          <h1 className={styles.pageTitle}>Réseau de capteurs</h1>
          <p className={styles.pageSubtitle}>
            {GROUPS.length} groupes &mdash; {onlineCount} en ligne
          </p>
        </div>
        <button
          onClick={refresh}
          className={styles.retryBtn}
          aria-label="Actualiser"
          disabled={loading}
        >
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </header>

      {anyError && (
        <div className={styles.errorBanner} role="alert">
          {anyError}
          <button onClick={refresh} className={styles.retryBtn}>Réessayer</button>
        </div>
      )}

      <div className={styles.groupsGrid}>

        {/* G1E : notre groupe */}
        {GROUPS.filter(g => g.ours).map(group => (
          <div key={group.code} className={`${styles.groupPanel} ${styles.groupPanelOwn}`}>
            <div className={styles.groupHeader}>
              <div>
                <span className={styles.groupCode} style={{ color: group.color }}>{group.code}</span>
                <span className={styles.groupName}>{group.name}</span>
              </div>
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} />
                Live
              </span>
            </div>
            <div className={styles.sensorList}>
              {group.sensors.map(sensor => {
                const meas   = lastMeasMap.get(sensor.deviceId);
                const online = isOnline(meas);
                return (
                  <Link
                    key={sensor.deviceId}
                    to={`/sensor/${sensor.deviceId}`}
                    className={`${styles.sensorRow} ${online ? styles.sensorOnline : ''}`}
                  >
                    <span className={styles.sensorIcon} style={{ color: online ? group.color : undefined }}>
                      <SensorIcon type={sensor.type} size={16} />
                    </span>
                    <div className={styles.sensorInfo}>
                      <span className={styles.sensorLabel}>{sensor.label}</span>
                      <span className={styles.sensorId}>{sensor.deviceId}</span>
                    </div>
                    <div className={styles.sensorRight}>
                      {meas ? (
                        <span className={styles.sensorValue} style={{ color: group.color }}>
                          {formatValue(meas.value, sensor.type, sensor.unit)}
                        </span>
                      ) : (
                        <span className={styles.sensorUnit}>
                          {sensor.unit || (sensor.kind === 'actuator' ? 'Actionneur' : '—')}
                        </span>
                      )}
                      <span className={styles.sensorArrow} aria-hidden="true">›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* G1A-G1D : données directes */}
        {GROUPS.filter(g => !g.ours).map(group => {
          const reading = sensors.find(s => s.group === group.code);
          return (
            <OtherGroupPanel
              key={group.code}
              code={group.code}
              name={group.name}
              color={group.color}
              reading={reading}
              deviceId={group.sensors[0]?.deviceId ?? ''}
            />
          );
        })}
      </div>

    </div>
  );
}
