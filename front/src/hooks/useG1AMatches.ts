// =========================================================
//  useG1AMatches — données de matchs issues de g1a_events
//  Requête directe sur la table du groupe G1A.
//  Fallback sur la RPC get_group_table_generic si RLS bloque.
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type MatchStatus = 'live' | 'upcoming' | 'finished' | string;

export interface G1AMatch {
  id:               number;
  name:             string;
  status:           MatchStatus;
  match_id:         string;
  home_team:        string;
  away_team:        string;
  competition:      string | null;
  kickoff_at:       string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  zone_a_team:      string | null;
  zone_b_team:      string | null;
}

interface Result {
  matches:  G1AMatch[];
  loading:  boolean;
  error:    string | null;
  lastFetch: Date | null;
  refresh:  () => void;
}

const POLL_MS = 30_000;

function parseRow(row: Record<string, unknown>): G1AMatch {
  return {
    id:               Number(row.id ?? 0),
    name:             String(row.name ?? ''),
    status:           String(row.status ?? 'unknown'),
    match_id:         String(row.match_id ?? ''),
    home_team:        String(row.home_team ?? ''),
    away_team:        String(row.away_team ?? ''),
    competition:      row.competition != null ? String(row.competition) : null,
    kickoff_at:       row.kickoff_at  != null ? String(row.kickoff_at)  : null,
    final_home_score: row.final_home_score != null ? Number(row.final_home_score) : null,
    final_away_score: row.final_away_score != null ? Number(row.final_away_score) : null,
    zone_a_team:      row.zone_a_team != null ? String(row.zone_a_team) : null,
    zone_b_team:      row.zone_b_team != null ? String(row.zone_b_team) : null,
  };
}

export function useG1AMatches(): Result {
  const [matches,   setMatches]   = useState<G1AMatch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ── Tentative 1 : requête directe (si RLS autorise) ──
    const { data: directData, error: directErr } = await supabase
      .from('g1a_events')
      .select('id, name, status, match_id, home_team, away_team, competition, kickoff_at, final_home_score, final_away_score, zone_a_team, zone_b_team')
      .order('kickoff_at', { ascending: false })
      .limit(20);

    if (!directErr && directData && directData.length > 0) {
      const parsed = (directData as Record<string, unknown>[]).map(parseRow);
      setMatches(deduplicateMatches(parsed));
      setLastFetch(new Date());
      setLoading(false);
      return;
    }

    // ── Fallback : RPC générique (security definer) ───────
    const { data: rpcData, error: rpcErr } = await supabase
      .rpc('get_group_table_generic', {
        table_name_param: 'g1a_events',
        row_limit: 20,
      });

    if (rpcErr) {
      setError(rpcErr.message);
      setLoading(false);
      return;
    }

    const rows = ((rpcData ?? []) as Array<{ raw_data: Record<string, unknown> }>)
      .map(r => r.raw_data)
      .filter(r => r.home_team && r.away_team);

    setMatches(deduplicateMatches(rows.map(parseRow)));
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  return { matches, loading, error, lastFetch, refresh: load };
}

/** Déduplique par match_id, garde la ligne la plus récente (updated_at ou created_at) */
export function deduplicateMatches(matches: G1AMatch[]): G1AMatch[] {
  const seen = new Map<string, G1AMatch>();
  for (const m of matches) {
    const key = m.match_id || String(m.id);
    if (!seen.has(key)) {
      seen.set(key, m);
    }
    // Les lignes sont déjà triées par created_at desc → la première est la plus récente
  }
  return Array.from(seen.values());
}

/** Tri : live en tête, puis upcoming triés par kickoff, puis finished récents */
export function sortMatches(matches: G1AMatch[]): G1AMatch[] {
  const order = (s: MatchStatus) => {
    if (s === 'live')     return 0;
    if (s === 'upcoming') return 1;
    return 2;
  };
  return [...matches].sort((a, b) => {
    const o = order(a.status) - order(b.status);
    if (o !== 0) return o;
    if (a.kickoff_at && b.kickoff_at)
      return new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime();
    return 0;
  });
}
