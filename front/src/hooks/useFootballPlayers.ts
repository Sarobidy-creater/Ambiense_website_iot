// =========================================================
//  useFootballPlayers — joueurs en live depuis RapidAPI
//  Endpoint : /football-players-search?search=<query>
//  Refresh automatique toutes les 60 secondes
// =========================================================
import { useEffect, useState, useCallback } from 'react';

const API_KEY  = import.meta.env.VITE_RAPIDAPI_KEY as string;
const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const BASE     = `https://${API_HOST}`;

export interface FootballPlayer {
  id:         number | string;
  name:       string;
  position?:  string;
  team?:      string;
  nationality?: string;
  photo?:     string;
}

interface Result {
  players: FootballPlayer[];
  loading: boolean;
  error:   string | null;
}

export function useFootballPlayers(query = 'm'): Result {
  const [players, setPlayers] = useState<FootballPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!API_KEY) {
      setError('Clé API manquante (VITE_RAPIDAPI_KEY)');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${BASE}/football-players-search?search=${encodeURIComponent(query)}`,
        {
          headers: {
            'x-rapidapi-key':  API_KEY,
            'x-rapidapi-host': API_HOST,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // L'API peut retourner { response: [...] } ou directement un tableau
      const raw: unknown[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.response)
          ? json.response
          : Array.isArray(json?.players)
            ? json.players
            : [];

      const mapped: FootballPlayer[] = raw.slice(0, 12).map((p: any) => ({
        id:          p.id ?? p.player_id ?? Math.random(),
        name:        p.name ?? p.player_name ?? p.player ?? '—',
        position:    p.position ?? p.pos ?? undefined,
        team:        p.team ?? p.club ?? p.team_name ?? undefined,
        nationality: p.nationality ?? p.country ?? undefined,
        photo:       p.photo ?? p.image ?? undefined,
      }));

      setPlayers(mapped);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 60_000); // rafraichit chaque minute
    return () => clearInterval(id);
  }, [fetch_]);

  return { players, loading, error };
}
