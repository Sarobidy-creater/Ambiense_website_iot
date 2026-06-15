// =========================================================
//  GroupDetailPage — surveillance complète d'un groupe externe
//  Route : /group/:code  (G1A, G1B, G1C, G1D)
// =========================================================
import { Link, useParams } from 'react-router-dom';
import { GROUPS }              from '../lib/groups';
import { GroupSensorChart }    from '../components/GroupSensorChart';
import { SensorIcon }          from '../components/svg/SensorIcon';
import { useGroupSensors }     from '../hooks/useGroupSensors';
import styles from './GroupDetailPage.module.css';

function timeAgo(ts: string | null): string {
  if (!ts) return '—';
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (sec < 60)   return `${sec} s`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min`;
  return `${Math.floor(sec / 3600)} h`;
}

export function GroupDetailPage() {
  const { code } = useParams<{ code: string }>();
  const group    = GROUPS.find(g => g.code === code && !g.ours);
  const { sensors, loading, refresh } = useGroupSensors();
  const reading  = sensors.find(s => s.group === code);

  if (!group) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <p className={styles.notFoundCode}>404</p>
          <p className={styles.notFoundText}>Groupe introuvable : {code}</p>
          <Link to="/network" className={styles.backLink}>← Retour au réseau</Link>
        </div>
      </div>
    );
  }

  const sensor   = group.sensors[0];
  const hasValue = reading?.value !== null && reading?.value !== undefined;

  const formattedValue = hasValue
    ? reading!.type === 'presence'
      ? `${reading!.value} ${reading!.unit}`
      : `${(reading!.value as number).toFixed(2)} ${reading!.unit}`
    : null;

  return (
    <div className={styles.page}>

      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link to="/network" className={styles.breadLink}>Réseau</Link>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{group.name}</span>
      </nav>

      {/* ── En-tête ── */}
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div
            className={styles.iconWrap}
            style={{ borderColor: `${group.color}40`, color: group.color }}
          >
            <SensorIcon type={sensor?.type ?? 'sensor'} size={28} />
          </div>
          <div>
            <p className={styles.pageEye}>
              <span
                className={styles.groupBadge}
                style={{ color: group.color, borderColor: `${group.color}50` }}
              >
                {group.code}
              </span>
              &nbsp;·&nbsp;Infrastructure IoT
            </p>
            <h1 className={styles.pageTitle}>{group.name}</h1>
            <p className={styles.pageSubtitle}>
              {sensor?.label ?? 'Capteur'}
              {sensor?.unit ? ` · ${sensor.unit}` : ''}
            </p>
          </div>
        </div>

        {/* Valeur courante */}
        <div className={styles.liveValue}>
          {hasValue ? (
            <>
              {reading!.online && (
                <span className={styles.liveIndicator} role="img" aria-label="En ligne" />
              )}
              <span className={styles.liveNum} style={{ color: group.color }}>
                {formattedValue}
              </span>
              <span className={styles.liveLabel}>
                {reading!.online
                  ? 'En direct'
                  : `il y a ${timeAgo(reading!.timestamp)}`}
              </span>
            </>
          ) : loading ? (
            <span className={styles.liveWaiting}>Chargement…</span>
          ) : (
            <span className={styles.liveWaiting}>
              {reading?.error ?? 'Aucune donnée'}
            </span>
          )}
        </div>

        <button
          onClick={refresh}
          className={styles.refreshBtn}
          aria-label="Actualiser"
          disabled={loading}
        >
          {loading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </header>

      {/* ── Graphique ── */}
      {sensor && (
        <GroupSensorChart
          groupCode={group.code}
          unit={sensor.unit}
          label={sensor.label}
          color={group.color}
        />
      )}

      {/* ── Informations ── */}
      <section className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>Informations</h2>
        <div className={styles.infoGrid}>
          {[
            { key: 'Groupe',              val: `${group.code} — ${group.name}` },
            { key: 'Capteur',             val: sensor?.label ?? '—' },
            { key: 'Type',                val: sensor?.type  ?? '—' },
            { key: 'Unité',               val: sensor?.unit  || '—' },
            { key: 'Statut',              val: reading?.online
                ? 'En ligne (< 5 min)'
                : hasValue
                  ? 'Hors ligne (données en base)'
                  : 'Aucune donnée reçue' },
            { key: 'Dernière mise à jour', val: reading?.timestamp
                ? `il y a ${timeAgo(reading.timestamp)}`
                : '—' },
          ].map(row => (
            <div key={row.key} className={styles.infoRow}>
              <span className={styles.infoKey}>{row.key}</span>
              <span className={styles.infoVal}>{row.val}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
