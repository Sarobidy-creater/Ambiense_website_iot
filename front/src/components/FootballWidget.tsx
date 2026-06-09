// =========================================================
//  FootballWidget — joueurs football live (RapidAPI)
//  Affiché dans le slot galerie de la HomePage
// =========================================================
import { useState } from 'react';
import { useFootballPlayers } from '../hooks/useFootballPlayers';
import styles from './FootballWidget.module.css';

const QUERIES = [
  { label: 'M',        value: 'm'        },
  { label: 'Ronaldo',  value: 'ronaldo'  },
  { label: 'Messi',    value: 'messi'    },
  { label: 'Mbappe',   value: 'mbappe'   },
];

export function FootballWidget() {
  const [query, setQuery] = useState('m');
  const { players, loading, error } = useFootballPlayers(query);

  return (
    <div className={styles.widget}>

      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.liveTag}>Live</span>
          <h3 className={styles.title}>Joueurs — Coupe du Monde</h3>
        </div>
        {/* Filtres rapides */}
        <div className={styles.filters}>
          {QUERIES.map(q => (
            <button
              key={q.value}
              className={`${styles.filterBtn} ${query === q.value ? styles.filterBtnActive : ''}`}
              onClick={() => setQuery(q.value)}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className={styles.body}>
        {loading && (
          <div className={styles.state}>
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
          </div>
        )}

        {error && !loading && (
          <div className={styles.error}>
            <span className={styles.errorLine} />
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <p className={styles.empty}>Aucun résultat pour « {query} »</p>
        )}

        {!loading && players.length > 0 && (
          <ul className={styles.list}>
            {players.map((p, i) => (
              <li key={p.id} className={styles.playerRow}>
                <span className={styles.playerIndex}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    className={styles.playerPhoto}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.playerPhotoFallback} aria-hidden="true" />
                )}
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>{p.name}</span>
                  <span className={styles.playerMeta}>
                    {[p.position, p.team, p.nationality].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Source */}
      <div className={styles.source}>
        Données : Free API Live Football Data · RapidAPI
      </div>
    </div>
  );
}
