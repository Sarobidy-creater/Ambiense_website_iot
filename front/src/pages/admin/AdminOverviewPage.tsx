// =========================================================
//  AdminOverviewPage — dashboard admin avec graphes live
// =========================================================
import { useEffect, useMemo } from 'react';
import { Link }               from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { useAdminDevices, useAdminMeasurements, useAdminCommands, useAdminAggregates } from '../../hooks/useAdmin';
import { useCommand }  from '../../hooks/useCommand';
import { GROUPS }      from '../../lib/groups';
import type { Device } from '../../lib/types';
import styles from './AdminPage.module.css';
import ov    from './AdminOverview.module.css';

// ── KPI card ────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, trend }: {
  label: string; value: string | number;
  sub?: string; accent?: boolean;
  trend?: 'up' | 'down' | 'flat';
}) {
  const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : null;
  const col   = trend === 'up' ? 'var(--clr-danger)' : trend === 'down' ? 'var(--clr-vert)' : undefined;
  return (
    <div className={[styles.kpi, accent ? styles.kpiAccent : ''].filter(Boolean).join(' ')}>
      <span className={styles.kpiLabel}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className={styles.kpiValue}>{value}</span>
        {arrow && <span style={{ fontSize: '0.75rem', color: col, fontWeight: 700 }}>{arrow}</span>}
      </div>
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </div>
  );
}

// ── Sparkline inline ─────────────────────────────────────

function Sparkline({ data, color }: {
  data: { time: string; value: number }[];
  color: string;
}) {
  if (!data.length) return <div className={ov.sparkEmpty}>Pas de donnees</div>;
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#0E0D14', border: '1px solid #232235', fontSize: 11, color: '#EDE9E0' }}
          labelStyle={{ color: '#57566A' }}
          formatter={undefined}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
          fill={`url(#sg${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Status distribution bar ──────────────────────────────

function StatusBar({ done, pending, error_ }: { done: number; pending: number; error_: number }) {
  const total = done + pending + error_ || 1;
  return (
    <div className={ov.statusBar}>
      <div className={ov.statusBarTrack}>
        <div className={ov.statusDone}    style={{ width: `${((done    / total) * 100).toFixed(1)}%` }} />
        <div className={ov.statusPending} style={{ width: `${((pending / total) * 100).toFixed(1)}%` }} />
        <div className={ov.statusError}   style={{ width: `${((error_  / total) * 100).toFixed(1)}%` }} />
      </div>
      <div className={ov.statusLegend}>
        <span className={ov.legendGreen}>{done} termine</span>
        <span className={ov.legendAmbre}>{pending} en attente</span>
        <span className={ov.legendRed}>{error_} erreur</span>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────

export function AdminOverviewPage() {
  const { devices, loading: dLoading } = useAdminDevices();
  const measHook = useAdminMeasurements();
  const cmdHook  = useAdminCommands();
  const { lastCommand, sending, sendCommand } = useCommand();

  const ownDeviceIds = useMemo(
    () => GROUPS.find(g => g.ours)?.sensors.map(s => s.deviceId) ?? [],
    []
  );
  const { stats } = useAdminAggregates(ownDeviceIds, 120);

  useEffect(() => {
    measHook.fetch({ limit: 5, offset: 0 });
    cmdHook.fetch(5, 0);
  }, []); // eslint-disable-line

  const sensors    = useMemo(() => devices.filter((d: Device) => d.kind === 'sensor'),   [devices]);
  const actuators  = useMemo(() => devices.filter((d: Device) => d.kind === 'actuator'), [devices]);
  const pendingCmd = useMemo(() => cmdHook.commands.filter(c => c.status === 'pending').length, [cmdHook.commands]);
  const errorCmd   = useMemo(() => cmdHook.commands.filter(c => c.status === 'error').length,   [cmdHook.commands]);
  const doneCmd    = useMemo(() => cmdHook.commands.filter(c => c.status === 'done').length,     [cmdHook.commands]);

  const tempStat = stats.find(s => s.deviceId === 'G1E_temperature');
  const humStat  = stats.find(s => s.deviceId === 'G1E_humidity');

  const trendDir = (t: number) => t > 0.1 ? 'up' : t < -0.1 ? 'down' : 'flat';

  const quickFan = (action: 'on' | 'off') => {
    sendCommand({ deviceId: 'G1E_ventilateur', action });
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Espace administration</p>
        <h1 className={styles.pageTitle}>Vue d&rsquo;ensemble</h1>
        <p className={styles.pageSub}>{new Date().toLocaleString('fr-FR')} &mdash; Réseau G1E</p>
      </header>

      {/* KPIs */}
      <section className={styles.kpiGrid}>
        <KpiCard
          label="Temperature actuelle"
          value={tempStat?.count ? `${tempStat.last.toFixed(1)} °C` : '—'}
          sub={tempStat ? `moy ${tempStat.avg.toFixed(1)} · std ${tempStat.std.toFixed(2)}` : 'Pas de donnees'}
          accent
          trend={tempStat ? trendDir(tempStat.trend) : undefined}
        />
        <KpiCard
          label="Humidite actuelle"
          value={humStat?.count ? `${humStat.last.toFixed(0)} %` : '—'}
          sub={humStat ? `moy ${humStat.avg.toFixed(1)} · min ${humStat.min.toFixed(0)} / max ${humStat.max.toFixed(0)}` : 'Pas de donnees'}
          trend={humStat ? trendDir(humStat.trend) : undefined}
        />
        <KpiCard
          label="Appareils"
          value={dLoading ? '—' : devices.length}
          sub={`${sensors.length} capteurs · ${actuators.length} actionneurs`}
        />
        <KpiCard
          label="Commandes"
          value={cmdHook.total || '—'}
          sub={`${pendingCmd} en attente · ${errorCmd} erreurs`}
        />
      </section>

      {/* Graphes sparkline + controle rapide */}
      <div className={ov.twoCol}>

        {/* Col gauche : sparklines */}
        <div className={ov.panel}>
          <div className={ov.panelHead}>
            <h2 className={ov.panelTitle}>Temperature — derniers 120 points</h2>
            <span className={ov.panelSub}>G1E_temperature</span>
          </div>
          <Sparkline data={tempStat?.points ?? []} color="#C9A240" />
          {tempStat && (
            <div className={ov.miniStats}>
              <span className={ov.miniStat}><b>Min</b> {tempStat.min.toFixed(1)}°C</span>
              <span className={ov.miniStat}><b>Max</b> {tempStat.max.toFixed(1)}°C</span>
              <span className={ov.miniStat}><b>Moy</b> {tempStat.avg.toFixed(1)}°C</span>
              <span className={ov.miniStat}><b>Points</b> {tempStat.count}</span>
            </div>
          )}

          <div className={ov.panelDivider} />

          <div className={ov.panelHead}>
            <h2 className={ov.panelTitle}>Humidite — derniers 120 points</h2>
            <span className={ov.panelSub}>G1E_humidity</span>
          </div>
          <Sparkline data={humStat?.points ?? []} color="#2BBFBF" />
          {humStat && (
            <div className={ov.miniStats}>
              <span className={ov.miniStat}><b>Min</b> {humStat.min.toFixed(0)}%</span>
              <span className={ov.miniStat}><b>Max</b> {humStat.max.toFixed(0)}%</span>
              <span className={ov.miniStat}><b>Moy</b> {humStat.avg.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Col droite : status + quick action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

          {/* Distribution commandes */}
          <div className={ov.panel}>
            <div className={ov.panelHead}>
              <h2 className={ov.panelTitle}>Commandes</h2>
              <Link to="/admin/commands" className={styles.sectionLink}>Historique →</Link>
            </div>
            <StatusBar done={doneCmd} pending={pendingCmd} error_={errorCmd} />
          </div>

          {/* Controle rapide ventilateur */}
          <div className={ov.panel}>
            <div className={ov.panelHead}>
              <h2 className={ov.panelTitle}>Ventilateur G1E</h2>
              <span className={ov.panelSub}>Controle direct</span>
            </div>
            <div className={ov.fanActions}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => quickFan('on')}
                disabled={sending}
                aria-label="Allumer le ventilateur G1E"
              >
                Marche
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => quickFan('off')}
                disabled={sending}
                aria-label="Éteindre le ventilateur G1E"
              >
                Arret
              </button>
            </div>
            {lastCommand && (
              <p className={ov.cmdStatus} role="status" aria-live="polite">
                Derniere commande :
                <span style={{
                  color: lastCommand.status === 'done' ? 'var(--clr-vert)' :
                         lastCommand.status === 'error' ? 'var(--clr-danger)' : 'var(--clr-ambre)',
                  marginLeft: 6, fontWeight: 600,
                }}>
                  {lastCommand.action} — {lastCommand.status}
                </span>
              </p>
            )}
          </div>

          {/* Etat systeme */}
          <div className={ov.panel}>
            <div className={ov.panelHead}>
              <h2 className={ov.panelTitle}>Etat systeme</h2>
            </div>
            <div className={ov.sysGrid}>
              {GROUPS.find(g => g.ours)?.sensors.map(s => {
                const st = stats.find(x => x.deviceId === s.deviceId);
                const online = st && st.lastAt
                  ? Date.now() - new Date(st.lastAt).getTime() < 5 * 60_000
                  : false;
                return (
                  <div key={s.deviceId} className={ov.sysRow}>
                    <span className={ov.sysDot} style={{ background: online ? 'var(--clr-vert)' : 'var(--clr-nuit-bord)' }} />
                    <span className={ov.sysName}>{s.label}</span>
                    <span className={ov.sysStatus}>{online ? 'En ligne' : 'Hors ligne'}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Dernieres mesures */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Dernieres mesures</h2>
          <Link to="/admin/measurements" className={styles.sectionLink}>Explorer →</Link>
        </div>
        <table className={styles.table}>
          <thead><tr><th scope="col">Appareil</th><th scope="col">Type</th><th scope="col">Valeur</th><th scope="col">Unite</th><th scope="col">Date</th></tr></thead>
          <tbody>
            {measHook.rows.map(r => (
              <tr key={r.id}>
                <td><code className={styles.code}>{r.device_id}</code></td>
                <td>{r.type}</td>
                <td className={styles.valueCell}>{r.value.toFixed(2)}</td>
                <td>{r.unit ?? '—'}</td>
                <td className={styles.mono}>{new Date(r.created_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}