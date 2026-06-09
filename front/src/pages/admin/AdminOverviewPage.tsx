// =========================================================
//  AdminOverviewPage — KPIs + état du réseau en direct
// =========================================================
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminDevices, useAdminMeasurements, useAdminCommands } from '../../hooks/useAdmin';
import { GROUPS } from '../../lib/groups';
import type { Device } from '../../lib/types';
import styles from './AdminPage.module.css';

function KpiCard({ label, value, sub, accent }: {
  label: string;
  value: string | number;
  sub?:  string;
  accent?: boolean;
}) {
  return (
    <div className={`${styles.kpi} ${accent ? styles.kpiAccent : ''}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </div>
  );
}

export function AdminOverviewPage() {
  const { devices, loading: dLoading } = useAdminDevices();
  const measHook = useAdminMeasurements();
  const cmdHook  = useAdminCommands();

  useEffect(() => {
    measHook.fetch({ limit: 10, offset: 0 });
    cmdHook.fetch(10, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors    = useMemo(() => devices.filter((d: Device) => d.kind === 'sensor'),    [devices]);
  const actuators  = useMemo(() => devices.filter((d: Device) => d.kind === 'actuator'),  [devices]);
  const pendingCmd = useMemo(() => cmdHook.commands.filter(c => c.status === 'pending').length, [cmdHook.commands]);
  const errorCmd   = useMemo(() => cmdHook.commands.filter(c => c.status === 'error').length,   [cmdHook.commands]);

  function statusColor(s: string) {
    if (s === 'done')    return 'var(--clr-vert)';
    if (s === 'pending') return 'var(--clr-ambre)';
    return 'var(--clr-danger)';
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Espace administration</p>
        <h1 className={styles.pageTitle}>Vue d&rsquo;ensemble</h1>
        <p className={styles.pageSub}>
          Etat du r&eacute;seau IoT G1E &mdash; {new Date().toLocaleString('fr-FR')}
        </p>
      </header>

      {/* KPIs */}
      <section className={styles.kpiGrid} aria-label="Indicateurs cles">
        <KpiCard
          label="Appareils G1E"
          value={dLoading ? '—' : devices.length}
          sub={`${sensors.length} capteurs · ${actuators.length} actionneurs`}
          accent
        />
        <KpiCard
          label="Mesures totales"
          value={measHook.total || '—'}
          sub="G1E_measurements"
        />
        <KpiCard
          label="Commandes totales"
          value={cmdHook.total || '—'}
          sub={`${pendingCmd} en attente · ${errorCmd} erreurs`}
        />
        <KpiCard
          label="Groupes du reseau"
          value={GROUPS.length}
          sub={`${GROUPS.filter(g => g.ours).length} en ligne · ${GROUPS.filter(g => !g.ours).length} en attente`}
        />
      </section>

      {/* Etat des appareils */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Appareils enregistres</h2>
          <Link to="/admin/devices" className={styles.sectionLink}>Gérer →</Link>
        </div>
        {dLoading ? (
          <p className={styles.stateMsg}>Chargement…</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Identifiant</th>
                <th>Classe</th>
                <th>Type</th>
                <th>Unité</th>
                <th>Label</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id}>
                  <td><code className={styles.code}>{d.id}</code></td>
                  <td>
                    <span className={`${styles.badge} ${d.kind === 'sensor' ? styles.badgeTeal : styles.badgeOr}`}>
                      {d.kind}
                    </span>
                  </td>
                  <td>{d.type}</td>
                  <td>{d.unit ?? '—'}</td>
                  <td>{d.label ?? '—'}</td>
                  <td className={styles.mono}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Dernières mesures */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Dernières mesures</h2>
          <Link to="/admin/measurements" className={styles.sectionLink}>Explorer →</Link>
        </div>
        {measHook.loading ? (
          <p className={styles.stateMsg}>Chargement…</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Appareil</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Unité</th>
                <th>Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {measHook.rows.map(r => (
                <tr key={r.id}>
                  <td className={styles.mono}>{r.id}</td>
                  <td><code className={styles.code}>{r.device_id}</code></td>
                  <td>{r.type}</td>
                  <td className={styles.valueCell}>{r.value.toFixed(2)}</td>
                  <td>{r.unit ?? '—'}</td>
                  <td className={styles.mono}>
                    {new Date(r.created_at).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Dernières commandes */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Dernières commandes</h2>
          <Link to="/admin/commands" className={styles.sectionLink}>Historique →</Link>
        </div>
        {cmdHook.loading ? (
          <p className={styles.stateMsg}>Chargement…</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Appareil</th>
                <th>Action</th>
                <th>Payload</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {cmdHook.commands.map(c => (
                <tr key={c.id}>
                  <td className={styles.mono}>{c.id}</td>
                  <td><code className={styles.code}>{c.device_id}</code></td>
                  <td>{c.action}</td>
                  <td className={styles.mono}>{c.payload ? JSON.stringify(c.payload) : '—'}</td>
                  <td>
                    <span className={styles.statusDot} style={{ background: statusColor(c.status) }} />
                    <span style={{ color: statusColor(c.status), fontSize: '0.75rem', fontWeight: 500 }}>
                      {c.status}
                    </span>
                  </td>
                  <td className={styles.mono}>{new Date(c.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
