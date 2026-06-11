// =========================================================
//  FootballWidget — matchs football en direct (RapidAPI)
//  Endpoint : /football-get-all-live-matches
//  Refresh auto toutes les 30 secondes
// =========================================================
import { useFootballLive, type LiveMatch } from '../hooks/useFootballLive';
import styles from './FootballWidget.module.css';

function ScoreBoard({ m }: { m: LiveMatch }) {
  const hasScore = m.homeScore !== null && m.awayScore !== null;
  return (
    <div className={styles.matchRow}>

      {/* Ligne competition + minute */}
      <div className={styles.matchMeta}>
        {m.competition && (
          <span className={styles.matchComp}>{m.competition}</span>
        )}
        {m.minute && (
          <span className={styles.matchMin}>{m.minute}&apos;</span>
        )}
        {m.status && !m.minute && (
          <span className={styles.matchMin}>{m.status}</span>
        )}
      </div>

      {/* Score */}
      <div className={styles.matchScore}>
        <span className={styles.teamName}>{m.homeTeam}</span>
        <span className={styles.score}>
          {hasScore ? `${m.homeScore} \u2014 ${m.awayScore}` : 'vs'}
        </span>
        <span className={[styles.teamName, styles.teamAway].join(' ')}>{m.awayTeam}</span>
      </div>

    </div>
  );
}

export function FootballWidget() {
  const { matches, loading, error, lastFetch } = useFootballLive();

  const timeStr = lastFetch
    ? lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className={styles.widget}>

      {/* En-tete */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.liveTag}>Live</span>
          <h3 className={styles.title}>Matchs en cours</h3>
        </div>
        {timeStr && (
          <span className={styles.lastUpdate}>MAJ {timeStr}</span>
        )}
      </div>

      {/* Corps */}
      <div className={styles.body}>

        {loading && (
          <div className={styles.state} role="status" aria-label="Chargement des matchs en cours">
            <span className={styles.loadingDot} aria-hidden="true" />
            <span className={styles.loadingDot} aria-hidden="true" />
            <span className={styles.loadingDot} aria-hidden="true" />
          </div>
        )}

        {error && !loading && (
          <div className={styles.error} role="alert">
            <span className={styles.errorLine} aria-hidden="true" />
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className={styles.noMatch}>
            <div className={styles.noMatchDot} />
            <p className={styles.noMatchText}>Aucun match en cours</p>
            <p className={styles.noMatchSub}>Prochain rafraichissement dans 30 s</p>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <ul className={styles.list} aria-live="polite" aria-label="Matchs en cours">
            {matches.map(m => (
              <li key={m.id}>
                <ScoreBoard m={m} />
              </li>
            ))}
          </ul>
        )}

      </div>

      {/* Source */}
      <div className={styles.source}>
        Football Live Data · RapidAPI &nbsp;·&nbsp; Actualisation 30 s
      </div>

    </div>
  );
}