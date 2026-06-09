// =========================================================
//  useFootballLive — matchs en direct depuis RapidAPI
//  Endpoint : /football-get-all-live-matches
//  Refresh toutes les 30 secondes
// =========================================================
import { useEffect, useState, useCallback } from 'react';

const API_KEY  = import.meta.env.VITE_RAPIDAPI_KEY as string;
const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const BASE     = `https://${API_HOST}`;

export interface LiveMatch {
  id:          string | number;
  homeTeam:    string;
  awayTeam:    string;
  homeScore:   number | null;
  awayScore:   number | null;
  minute:      string | null;
  competition: string | null;
  status:      string | null;
}

interface Result {
  matches:   LiveMatch[];
  loading:   boolean;
  error:     string | null;
  lastFetch: Date | null;
}

function parseMatches(json: any): LiveMatch[] {
  // Essaie les structures possibles de l'API
  const raw: any[] =
    json?.response?.liveMatches    ??
    json?.response?.matches        ??
    json?.response?.events         ??
    json?.response?.live           ??
    (Array.isArray(json?.response) ? json.response : null) ??
    json?.liveMatches              ??
    json?.matches                  ??
    (Array.isArray(json) ? json : []);

  return raw.slice(0, 20).map((m: any) => {
    // home team
    const home: string =
      m?.homeTeam?.name ?? m?.home_team?.name ?? m?.home?.name ??
      m?.homeTeamName   ?? m?.home_team_name  ?? m?.team_home  ?? '—';
    // away team
    const away: string =
      m?.awayTeam?.name ?? m?.away_team?.name ?? m?.away?.name ??
      m?.awayTeamName   ?? m?.away_team_name  ?? m?.team_away  ?? '—';
    // score
    const hs: number | null =
      m?.homeTeam?.score ?? m?.home_team?.score ?? m?.score?.home ??
      m?.homeScore       ?? m?.home_score       ?? m?.score_home  ?? null;
    const as_: number | null =
      m?.awayTeam?.score ?? m?.away_team?.score ?? m?.score?.away ??
      m?.awayScore       ?? m?.away_score       ?? m?.score_away  ?? null;
    // minute
    const min: string | null =
      m?.minute?.toString() ?? m?.elapsed?.toString() ??
      m?.time?.elapsed?.toString() ?? m?.clock ?? null;
    // competition
    const comp: string | null =
      m?.tournament?.name ?? m?.competition?.name ??
      m?.league?.name     ?? m?.leagueName        ??
      m?.competitionName  ?? null;
    // status
    const st: string | null =
      m?.status?.description ?? m?.status?.type ??
      m?.statusText           ?? m?.state        ?? null;

    return {
      id:          m?.id ?? m?.match_id ?? Math.random(),
      homeTeam:    home,
      awayTeam:    away,
      homeScore:   hs !== null ? Number(hs) : null,
      awayScore:   as_ !== null ? Number(as_) : null,
      minute:      min,
      competition: comp,
      status:      st,
    };
  });
}

export function useFootballLive(): Result {
  const [matches,   setMatches]   = useState<LiveMatch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    if (!API_KEY) {
      setError('Cle API manquante — ajoutez VITE_RAPIDAPI_KEY dans .env.local');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE}/football-get-all-live-matches`, {
        headers: {
          'x-rapidapi-key':  API_KEY,
          'x-rapidapi-host': API_HOST,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const parsed = parseMatches(json);
      setMatches(parsed);
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur reseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000); // refresh toutes les 30 s
    return () => clearInterval(id);
  }, [fetch_]);

  return { matches, loading, error, lastFetch };
}