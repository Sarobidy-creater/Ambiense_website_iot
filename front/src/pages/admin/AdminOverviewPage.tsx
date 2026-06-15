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
import { useCommand }       from '../../hooks/useCommand';
import { useGroupSensors }  from '../../hooks/useGroupSensors';
import type { GroupSensorReading } from '../../hooks/useGroupSensors';
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
  if (!data.length) return <div className={ov.sparkEmpty}>Pas de données</div>;
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
        <span className={ov.legendGreen}>{done} terminé</span>
        <span className={ov.legendAmbre}>{pending} en attente</span>
        <span className={ov.legendRed}>{error_} erreur</span>
      </div>
    </div>
  );
}

// ── External sensor card ────────────────────────────────

function ExtSensorCard({ reading }: { reading: GroupSensorReading }) {
  const online  = reading.online;
  const hasVal  = reading.value !== null;
  const group   = GROUPS.find(g => g.code === reading.group);
  const color   = group?.color ?? '#787790';

  function fmt(r: GroupSensorReading): string {
    if (!hasVal) return '—';
    if (r.type === 'presence') return `${r.value} ${r.unit}`;
    if (r.type === 'alcohol')  return `${(r.value as number).toFixed(2)} ${r.unit}`;
    if (r.type === 'sound')    return `${Math.round(r.value as number)} ${r.unit}`;
    return `${r.value} ${r.unit}`;
  }

  return (
    <div className={ov.extCard}>
      <div className={ov.extCardHead}>
        <span className={ov.extCode} style={{ color }}>{reading.group}</span>
        <span className={ov.extDot} style={{ background: online ? 'var(--clr-vert)' : hasVal ? color : 'var(--clr-nuit-bord)' }} />
      </div>
      <p className={ov.extLabel}>{reading.label}</p>
      <p className={ov.extValue} style={{ color: hasVal ? color : undefined }}>
        {fmt(reading)}
      </p>
      <p className={ov.extStatus}>
        {online ? 'En direct' : hasVal ? `Données disponibles` : reading.error ?? 'Aucune donnée'}
      </p>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────

export function AdminOverviewPage() {
  const { devices, loading: dLoading } = useAdminDevices();
  const measHook = useAdminMeasurements();
  const cmdHook  = useAdminCommands();
  const { lastCommand, sending, sendCommand } = useCommand();
  const { sensors: extSensors, loading: extLoading, refresh: extRefresh } = useGroupSensors();

  // Commande d'urgence : envoie 'off' à tous les actionneurs connus
  const emergencyStop = () => {
    const actuators = GROUPS.flatMap(g => g.sensors.filter(s => s.kind === 'actuator'));
    for (const a of actuators) {
      sendCommand({ deviceId: a.deviceId, action: 'off' });
    }
  };

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

  // Nombre de capteurs externes en ligne
  const extOnline = extSensors.filter(s => s.online).length;

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
          label="Température actuelle"
          value={tempStat?.count ? `${tempStat.last.toFixed(1)} °C` : '—'}
          sub={tempStat ? `moy ${tempStat.avg.toFixed(1)} · std ${tempStat.std.toFixed(2)}` : 'Pas de données'}
          accent
          trend={tempStat ? trendDir(tempStat.trend) : undefined}
        />
        <KpiCard
          label="Humidité actuelle"
          value={humStat?.count ? `${humStat.last.toFixed(0)} %` : '—'}
          sub={humStat ? `moy ${humStat.avg.toFixed(1)} · min ${humStat.min.toFixed(0)} / max ${humStat.max.toFixed(0)}` : 'Pas de données'}
          trend={humStat ? trendDir(humStat.trend) : undefined}
        />
        <KpiCard
          label="Appareils"
          value={dLoading ? '—' : devices.length}
          sub={`${sensors.length} capteurs · ${actuators.length} actionneurs`}
        />
        <KpiCard
          label="Groupes partenaires"
          value={extLoading ? '—' : `${extOnline} / ${extSensors.length}`}
          sub="groupes avec données en direct"
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
            <h2 className={ov.panelTitle}>Température — derniers 120 points</h2>
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
            <h2 className={ov.panelTitle}>Humidité — derniers 120 points</h2>
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
              <span className={ov.panelSub}>Contrôle direct</span>
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
                Arrêt
              </button>
            </div>
            {lastCommand && (
              <p className={ov.cmdStatus} role="status" aria-live="polite">
                Dernière commande :
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
              <h2 className={ov.panelTitle}>État système G1E</h2>
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
      </div>{/* end twoCol */}

      {/* Capteurs groupes partenaires */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Groupes partenaires — dernières mesures</h2>
          <button onClick={extRefresh} disabled={extLoading} className={styles.sectionLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {extLoading ? 'Actualisation…' : 'Actualiser →'}
          </button>
        </div>
        <div className={ov.extGrid}>
          {extSensors.map(r => <ExtSensorCard key={r.group} reading={r} />)}
        </div>
      </section>

      {/* Arrêt d'urgence */}
      <section className={ov.emergencySection}>
        <div className={ov.emergencyLeft}>
          <p className={ov.emergencyTitle}>⚡ ARRÊT D'URGENCE</p>
          <p className={ov.emergencySub}>
            Coupe immédiatement tous les actionneurs du réseau G1E.
            À utiliser uniquement en cas d'urgence.
          </p>
          {lastCommand && (
            <p className={ov.cmdStatus} role="status" aria-live="polite" style={{ marginTop: 8 }}>
              Dernière commande :
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
        <div className={ov.emergencyActions}>
          <button
            className={ov.emergencyBtn}
            onClick={emergencyStop}
            disabled={sending}
            aria-label="Arrêt d'urgence — couper tous les actionneurs"
          >
            {sending ? 'Envoi…' : 'TOUT ARRÊTER'}
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => quickFan('on')}
            disabled={sending}
            style={{ minWidth: 120 }}
          >
            Ventilateur ON
          </button>
        </div>
      </section>
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