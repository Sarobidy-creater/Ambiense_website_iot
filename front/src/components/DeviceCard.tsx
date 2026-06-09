// =========================================================
//  DeviceCard — carte affichant un appareil + dernière mesure
// =========================================================
import type { Device, Measurement } from '../lib/types';
import styles from './DeviceCard.module.css';

interface Props {
  device: Device;
  lastMeasurement?: Measurement;
}

/** Un appareil est considéré « en ligne » si sa dernière mesure date de moins de 5 min */
function isOnline(meas?: Measurement): boolean {
  if (!meas) return false;
  return Date.now() - new Date(meas.created_at).getTime() < 5 * 60_000;
}

function formatValue(value: number, type: string): string {
  if (type === 'presence') return value === 1 ? 'Occupé' : 'Libre';
  return value.toFixed(type === 'temperature' || type === 'humidity' ? 1 : 0);
}

const TYPE_ICONS: Record<string, string> = {
  temperature: '🌡️',
  sound:       '🔊',
  light:       '💡',
  presence:    '👥',
  motor:       '🌀',
  humidity:    '💧',
  co2:         '🌿',
  smoke:       '💨',
  alcohol:     '🍺',
};

export function DeviceCard({ device, lastMeasurement }: Props) {
  const online = isOnline(lastMeasurement);
  const ageMs  = lastMeasurement
    ? Date.now() - new Date(lastMeasurement.created_at).getTime()
    : null;
  const ageStr = ageMs !== null
    ? ageMs < 60_000
      ? `il y a ${Math.round(ageMs / 1000)} s`
      : `il y a ${Math.round(ageMs / 60_000)} min`
    : 'jamais';

  return (
    <article className={`${styles.card} animate-in`} aria-label={device.label ?? device.id}>
      {/* En-tête */}
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {TYPE_ICONS[device.type] ?? '📡'}
        </span>
        <div className={styles.meta}>
          <span className={styles.label}>{device.label ?? device.id}</span>
        </div>
        <span className={`badge ${online ? 'badge-online' : 'badge-offline'}`} aria-label={online ? 'En ligne' : 'Hors ligne'}>
          <span aria-hidden="true">{online ? '●' : '○'}</span>
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
            <span className={styles.unit}>{lastMeasurement.unit ?? device.unit ?? ''}</span>
          </>
        ) : (
          <span className={styles.noData}>—</span>
        )}
      </div>

      {/* Pied de carte */}
      <div className={styles.footer}>
        <span className={`badge ${device.kind === 'sensor' ? 'badge-sensor' : 'badge-actuator'}`}>
          {device.kind === 'sensor' ? 'Capteur' : 'Actionneur'}
        </span>
        <span className={styles.age} aria-label={`Dernière mise à jour : ${ageStr}`}>
          {ageStr}
        </span>
      </div>
    </article>
  );
}
