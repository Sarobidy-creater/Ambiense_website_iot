// =========================================================
//  SensorDetailPage — surveillance détaillée d'un capteur
//  Route : /sensor/:deviceId
// =========================================================
import { useParams, Link } from 'react-router-dom';
import { useMeasurements } from '../hooks/useMeasurements';
import { useGroupHistory } from '../hooks/useGroupHistory';
import { SensorChart }     from '../components/SensorChart';
import { GroupSensorChart } from '../components/GroupSensorChart';
import { FanControl }      from '../components/FanControl';
import { SensorIcon }      from '../components/svg/SensorIcon';
import { findSensor, formatValue } from '../lib/groups';
import styles from './SensorDetailPage.module.css';

export function SensorDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();

  const sensor = deviceId ? findSensor(deviceId) : undefined;

  // Dernière mesure en live (polling 1 s)
  const { measurements } = useMeasurements({
    deviceId: deviceId ?? '',
    limit:    5,
  });

  const latest = measurements[0] ?? null;

  // Historique pour les groupes externes (G1A-G1D)
  // 'all' pour ne pas filtrer par fenêtre ici — la valeur la plus récente
  // doit s'afficher même si la dernière mesure date de plusieurs heures.
  const { points: extPoints } = useGroupHistory(
    sensor && !sensor.ours ? sensor.group : undefined,
    'all',
  );
  const latestExt = extPoints.length > 0 ? extPoints[extPoints.length - 1] : null;

  // Capteur introuvable dans nos définitions
  if (!sensor) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <p className={styles.notFoundCode}>404</p>
          <p className={styles.notFoundText}>Capteur introuvable : {deviceId}</p>
          <Link to="/network" className={styles.backLink}>
            &larr; Retour au réseau
          </Link>
        </div>
      </div>
    );
  }

  const isOurs  = sensor.ours;
  const hasData = isOurs ? measurements.length > 0 : extPoints.length > 0;

  return (
    <div className={styles.page}>

      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link to="/network" className={styles.breadLink}>Réseau</Link>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{sensor.label}</span>
      </nav>

      {/* ── En-tête ── */}
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrap} style={{ borderColor: `${sensor.color}40`, color: sensor.color }}>
            <SensorIcon type={sensor.type} size={28} />
          </div>
          <div>
            <p className={styles.pageEye}>
              <span className={styles.groupBadge} style={{ color: sensor.color, borderColor: `${sensor.color}50` }}>
                {sensor.group}
              </span>
              &nbsp;·&nbsp;{sensor.groupName}
            </p>
            <h1 className={styles.pageTitle}>{sensor.label}</h1>
            <p className={styles.pageSubtitle}>
              {sensor.kind === 'sensor' ? 'Capteur' : 'Actionneur'}
              {sensor.unit ? ` · ${sensor.unit}` : ''}
            </p>
          </div>
        </div>

        {/* Valeur live — masquée pour les actionneurs */}
        {sensor.kind !== 'actuator' && (
        <div className={styles.liveValue}>
          {isOurs && hasData ? (
            <>
              <span className={styles.liveIndicator} role="img" aria-label="En direct" />
              <span
                className={styles.liveNum}
                style={{ color: sensor.color }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatValue(latest.value, sensor.type, sensor.unit)}
              </span>
              <span className={styles.liveLabel}>En direct</span>
            </>
          ) : isOurs ? (
            <span className={styles.liveWaiting}>En attente de données</span>
          ) : latestExt ? (
            <>
              <span
                className={styles.liveNum}
                style={{ color: sensor.color }}
              >
                {formatValue(latestExt.value, sensor.type, sensor.unit)}
              </span>
              <span className={styles.liveLabel} style={{ color: sensor.color }}>
                Dernière mesure
              </span>
            </>
          ) : (
            <span className={styles.liveWaiting}>Aucune donnée</span>
          )}
        </div>
        )}
      </header>

      {/* ── Graphique principal / contrôle actionneur ── */}
      {sensor.kind === 'actuator' ? (
        <FanControl />
      ) : isOurs ? (
        <SensorChart
          deviceId={sensor.deviceId}
          unit={sensor.unit}
          label={sensor.label}
          color={sensor.color}
          ours={true}
        />
      ) : (
        <GroupSensorChart
          groupCode={sensor.group}
          unit={sensor.unit}
          label={sensor.label}
          color={sensor.color}
        />
      )}

      {/* ── Informations capteur ── */}
      <section className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>Informations</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Identifiant</span>
            <code className={styles.infoVal}>{sensor.deviceId}</code>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Type</span>
            <span className={styles.infoVal}>{sensor.type}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Classe</span>
            <span className={styles.infoVal}>{sensor.kind === 'sensor' ? 'Capteur passif' : 'Actionneur'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Unité</span>
            <span className={styles.infoVal}>{sensor.unit || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Groupe</span>
            <span className={styles.infoVal}>{sensor.group} — {sensor.groupName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Statut</span>
            <span className={styles.infoVal}>
              {sensor.kind === 'actuator'
                ? 'Actionnable — marche / arrêt'
                : isOurs
                  ? (hasData ? 'Connecté' : 'En attente de mesures')
                  : (hasData ? 'Données disponibles' : 'Aucune donnée en base')}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
