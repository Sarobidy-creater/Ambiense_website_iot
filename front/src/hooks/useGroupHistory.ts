// =========================================================
//  useGroupHistory — historique d'un capteur externe
//  Requête via get_group_table_generic (security definer)
//  Filtrage côté client par fenêtre temporelle.
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TimeWindow } from '../lib/types';

// ── Config par groupe ─────────────────────────────────────

interface GroupChartConfig {
  tableName:  string | null;   // null → découverte via discover_group_tables
  valueKeys:  string[];        // colonnes candidates pour la valeur (ordre de priorité)
  tsKeys:     string[];        // colonnes candidates pour le timestamp
}

export const GROUP_CHART_CONFIGS: Record<string, GroupChartConfig> = {
  G1A: {
    tableName: 'g1a_sound',
    valueKeys: ['db_value'],
    tsKeys:    ['measured_at', 'created_at'],
  },
  G1B: {
    tableName: 'g1b_compteur_personnes',
    valueKeys: ['nb_personnes'],
    tsKeys:    ['created_at', 'measured_at'],
  },
  G1C: {
    tableName: 'g1c_smoke',
    valueKeys: ['ppm', 'smoke_level', 'value', 'gas_value', 'smoke_value'],
    tsKeys:    ['measured_at', 'created_at'],
  },
  G1D: {
    tableName: 'g1d_mq3_measurements',
    valueKeys: ['alcohol_level'],
    tsKeys:    ['measured_at', 'created_at'],
  },
};

// ── Types exportés ────────────────────────────────────────

export interface HistoryPoint {
  time:    string;   // HH:mm formatté
  isoTime: string;   // ISO brut pour le filtrage
  value:   number;
}

interface Result {
  points:  HistoryPoint[];
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

// ── Helpers ───────────────────────────────────────────────

function pickFirst(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] != null) return row[k];
  }
  return null;
}

function filterByWindow(pts: HistoryPoint[], window_: TimeWindow): HistoryPoint[] {
  if (window_ === 'all') return pts;
  const cutoffMs = window_ === '5min' ? 5 * 60_000 : 60 * 60_000;
  const now = Date.now();
  return pts.filter(p => now - new Date(p.isoTime).getTime() < cutoffMs);
}

// ── Hook principal ────────────────────────────────────────

export function useGroupHistory(
  code:    string | undefined,
  window_: TimeWindow,
): Result {
  const [points,  setPoints]  = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    const cfg = GROUP_CHART_CONFIGS[code];
    if (!cfg) return;

    setLoading(true);
    setError(null);

    // Résoudre le nom de table (découverte dynamique si null)
    let tableName = cfg.tableName;
    if (!tableName) {
      const { data: tables, error: discErr } = await supabase
        .rpc('discover_group_tables');
      if (discErr) {
        setError(discErr.message);
        setLoading(false);
        return;
      }
      const found = ((tables ?? []) as Array<{ group_prefix: string; table_name: string }>)
        .find(t => t.group_prefix === code);
      if (!found) {
        setPoints([]);
        setLoading(false);
        return;
      }
      tableName = found.table_name;
    }

    // Récupérer les 200 dernières lignes (tri par ctid desc dans la RPC)
    const { data, error: fetchErr } = await supabase
      .rpc('get_group_table_generic', {
        table_name_param: tableName,
        row_limit: 200,
      });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Array<{ raw_data: Record<string, unknown> }>;

    const all: HistoryPoint[] = rows
      .map(r => {
        const valRaw = pickFirst(r.raw_data, cfg.valueKeys);
        const tsRaw  = pickFirst(r.raw_data, cfg.tsKeys);
        if (valRaw == null || tsRaw == null) return null;
        return {
          isoTime: String(tsRaw),
          time:    new Date(String(tsRaw)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          value:   Number(valRaw),
        };
      })
      .filter((r): r is HistoryPoint => r !== null)
      // Les lignes arrivent en ordre ctid desc → inverser pour ordre chronologique
      .reverse();

    setPoints(filterByWindow(all, window_));
    setLoading(false);
  }, [code, window_]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  return { points, loading, error, refresh: load };
}
