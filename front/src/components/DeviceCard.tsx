// =========================================================
//  DeviceCard — carte appareil + derniere mesure
//  Icones SVG via SensorIcon, pas d emotion.
// =========================================================
import type { Device, Measurement } from '../lib/types';
import { SensorIcon } from './svg/SensorIcon';
import styles from './DeviceCard.module.css';

interface Props {
  device: Device;
  lastMeasurement?: Measurement;
}

function isOnline(meas?: Measurement): boolean {
  if (!meas) return false;
  return Date.now() - new Date(meas.created_at).getTime() < 5 * 60_000;
}

function formatValue(value: number, type: string): string {
  if (type === 'presence') return value === 1 ? 'Occupe' : 'Libre';
  return value.toFixed(type === 'temperature' || type === 'humidity' ? 1 : 0);
}

function ageLabel(meas?: Measurement): string {
  if (!meas) return 'jamais';
  const ms = Date.now() - new Date(meas.created_at).getTime();
  return ms < 60_000
    ? `il y a ${Math.round(ms / 1000)} s`
    : `il y a ${Math.round(ms / 60_000)} min`;
}

export function DeviceCard({ device, lastMeasurement }: Props) {
  const online = isOnline(lastMeasurement);

  return (
    <article
      className={`${styles.card} ${online ? styles.cardOnline : ''}`}
      aria-label={device.label ?? device.id}
    >
      {/* En-tete */}
      <div className={styles.header}>
        <span className={`${styles.icon} ${online ? styles.iconOnline : styles.iconOffline}`}>
          <SensorIcon type={device.type} size={20} />
        </span>
        <div className={styles.meta}>
          <span className={styles.label}>{device.label ?? device.id}</span>
          <span className={styles.deviceId}>{device.id}</span>
        </div>
        <span
          className={`${styles.badge} ${online ? styles.badgeOnline : styles.badgeOffline}`}
          aria-label={online ? 'En ligne' : 'Hors ligne'}
        >
          <span className={styles.badgeDot} />
          {online ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>

      {/* Valeur principale */}
      <div className={styles.valueBlock}>
        {lastMeasurement ? (
          <>
            <span className={`${styles.value} ${online ? styles.valueActive : ''}`}>
              {formatValue(lastMeasurement.value, device.type)}
            </span>
            <span className={styles.unit}>
              {lastMeasurement.unit ?? device.unit ?? ''}
            </span>
          </>
        ) : (
          <span className={styles.noData}>—</span>
        )}
      </div>

      {/* Pied */}
      <div className={styles.footer}>
        <span className={`${styles.kindBadge} ${device.kind === 'sensor' ? styles.kindSensor : styles.kindActuator}`}>
          {device.kind === 'sensor' ? 'Capteur' : 'Actionneur'}
        </span>
        <span className={styles.age}>{ageLabel(lastMeasurement)}</span>
      </div>
    </article>
  );
}