// =========================================================
//  NetworkPage — vue globale de tous les groupes IoT
//  G1E : donnees live · G1A-G1D : integration prevue
// =========================================================
import { useMemo } from 'react';
import { Link }            from 'react-router-dom';
import { useDevices }      from '../hooks/useDevices';
import { useMeasurements } from '../hooks/useMeasurements';
import { SensorIcon }      from '../components/svg/SensorIcon';
import { GROUPS, formatValue } from '../lib/groups';
import type { Measurement } from '../lib/types';
import styles from './NetworkPage.module.css';

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

export function NetworkPage() {
  const { loading, error, refresh } = useDevices();
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
            {GROUPS.length} groupes &mdash; {GROUPS.reduce((n, g) => n + g.sensors.length, 0)} appareils au total
          </p>
        </div>
      </header>

      {loading && <p className={styles.stateMsg} role="status">Chargement…</p>}
      {error && (
        <div className={styles.errorBanner} role="alert">
          Erreur : {error}
          <button onClick={refresh} className={styles.retryBtn}>Reessayer</button>
        </div>
      )}

      {/* Un panneau par groupe */}
      <div className={styles.groupsGrid}>
        {GROUPS.map(group => {
          const isOurs = group.ours;
          return (
            <div
              key={group.code}
              className={`${styles.groupPanel} ${isOurs ? styles.groupPanelOwn : ''}`}
            >
              {/* Header groupe */}
              <div className={styles.groupHeader}>
                <div>
                  <span className={styles.groupCode} style={{ color: group.color }}>
                    {group.code}
                  </span>
                  <span className={styles.groupName}>{group.name}</span>
                </div>
                {isOurs ? (
                  <span className={styles.liveBadge}>
                    <span className={styles.liveDot} />
                    Live
                  </span>
                ) : (
                  <span className={styles.pendingBadge}>En attente</span>
                )}
              </div>

              {/* Liste des capteurs */}
              <div className={styles.sensorList}>
                {group.sensors.map(sensor => {
                  const meas   = lastMeasMap.get(sensor.deviceId);
                  const online = isOurs && isOnline(meas);

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
                        {isOurs && meas ? (
                          <span className={styles.sensorValue} style={{ color: group.color }}>
                            {formatValue(meas.value, sensor.type, sensor.unit)}
                          </span>
                        ) : (
                          <span className={styles.sensorUnit}>{sensor.unit || sensor.kind}</span>
                        )}
                        <span className={styles.sensorArrow}>›</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      {/* Note d'integration */}
      <aside className={styles.integrationNote}>
        <p className={styles.noteTitle}>Integration des autres groupes</p>
        <p className={styles.noteText}>
          Chaque groupe suit la nomenclature <code>GXX_devices</code> / <code>GXX_measurements</code>.
          Des qu&rsquo;un groupe connecte ses tables, leurs donnees apparaissent ici en temps reel.
          Cliquez sur un capteur pour accceder a sa page de surveillance detaillee.
        </p>
      </aside>

    </div>
  );
}