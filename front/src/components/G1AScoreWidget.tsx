// =========================================================
//  G1AScoreWidget — widget flottant de scores G1A
//  S'affiche en bas à droite, collapsible.
// =========================================================
import { useState, useMemo } from 'react';
import { useG1AMatches, sortMatches } from '../hooks/useG1AMatches';
import type { G1AMatch, MatchStatus } from '../hooks/useG1AMatches';
import { SoccerBall } from './svg/SoccerBall';
import styles from './G1AScoreWidget.module.css';

// ── Badge statut ──────────────────────────────────────────

function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === 'live') {
    return (
      <span className={styles.badgeLive}>
        <span className={styles.liveDot} />
        Live
      </span>
    );
  }
  if (status === 'upcoming') {
    return <span className={styles.badgeUpcoming}>À venir</span>;
  }
  return <span className={styles.badgeFinished}>Terminé</span>;
}

// ── Ligne de score ────────────────────────────────────────

function MatchRow({ m }: { m: G1AMatch }) {
  const hasScore = m.final_home_score !== null && m.final_away_score !== null;
  const kickoff  = m.kickoff_at
    ? new Date(m.kickoff_at).toLocaleString('fr-FR', {
        day:    '2-digit',
        month:  '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={styles.matchRow}>
      <div className={styles.matchMeta}>
        {m.competition && <span className={styles.competition}>{m.competition}</span>}
        <StatusBadge status={m.status} />
      </div>

      <div className={styles.scoreBlock}>
        <span className={styles.teamHome}>{m.home_team}</span>
        <span className={styles.score}>
          {hasScore
            ? `${m.final_home_score} — ${m.final_away_score}`
            : kickoff ?? 'vs'}
        </span>
        <span className={styles.teamAway}>{m.away_team}</span>
      </div>

      {/* Zones du bar G1A */}
      {m.zone_a_team && m.zone_b_team && (
        <div className={styles.zones}>
          <span className={styles.zone}>Zone A · {m.zone_a_team}</span>
          <span className={styles.zone}>Zone B · {m.zone_b_team}</span>
        </div>
      )}
    </div>
  );
}

// ── Widget principal ──────────────────────────────────────

export function G1AScoreWidget() {
  const { matches, loading, error, lastFetch } = useG1AMatches();
  const [open, setOpen] = useState(true);

  const sorted  = useMemo(() => sortMatches(matches), [matches]);
  const liveCount = sorted.filter(m => m.status === 'live').length;

  const timeStr = lastFetch
    ? lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Pas de contenu du tout → rien à afficher
  if (!loading && !error && matches.length === 0) return null;

  return (
    <div className={`${styles.widget} ${open ? styles.widgetOpen : ''}`}>

      {/* ── Bouton toggle ─────────────────────────────── */}
      <button
        className={styles.toggle}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? 'Réduire le widget scores' : 'Afficher les scores'}
      >
        <span className={styles.toggleIcon} aria-hidden="true">
          <SoccerBall size={16} />
        </span>
        <span className={styles.toggleLabel}>
          Scores
          {liveCount > 0 && (
            <span className={styles.liveCount}>{liveCount} live</span>
          )}
        </span>
        <span className={styles.toggleArrow} aria-hidden="true">
          {open ? '▾' : '▴'}
        </span>
      </button>

      {/* ── Corps (visible quand ouvert) ──────────────── */}
      {open && (
        <div className={styles.body}>

          {loading && (
            <div className={styles.stateRow} role="status">
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          )}

          {error && !loading && (
            <p className={styles.errorText}>{error}</p>
          )}

          {!loading && sorted.map(m => (
            <MatchRow key={m.id} m={m} />
          ))}

          <div className={styles.footer}>
            Source : G1A &nbsp;·&nbsp; {timeStr ?? '—'}
          </div>
        </div>
      )}

    </div>
  );
}
