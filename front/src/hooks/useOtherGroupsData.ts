// =========================================================
//  useOtherGroupsData — découverte et récupération des données
//  des groupes G1A, G1B, G1C, G1D via les fonctions RPC.
//
//  Étapes :
//   1. discover_group_tables()  → liste les tables existantes
//   2. get_group_devices()      → appareils (si table _devices)
//   3. get_group_latest_measurements() → mesures (si _measurements)
//   4. get_group_table_generic() → tables non standard
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Device, Measurement } from '../lib/types';

export interface GroupTableInfo {
  group_prefix: string;
  table_name:   string;
  table_type:   'devices' | 'measurements' | 'commands' | 'other';
}

/** Mesure générique issue d'une table non standard */
export interface GenericRow {
  tableName: string;
  data:      Record<string, unknown>[];
}

export interface OtherGroupData {
  code:               string;
  connected:          boolean;
  tables:             GroupTableInfo[];
  devices:            Device[];
  /** Dernière mesure par device_id */
  latestMeasurements: Map<string, Measurement>;
  /** Données brutes des tables non standard */
  genericData:        GenericRow[];
  error:              string | null;
}

interface Result {
  groups:   OtherGroupData[];
  loading:  boolean;
  error:    string | null;
  refresh:  () => void;
}

const OTHER_GROUPS = ['G1A', 'G1B', 'G1C', 'G1D'] as const;

/** Intervalles de polling en ms pour les groupes distants */
const POLL_INTERVAL_MS = 30_000;

export function useOtherGroupsData(): Result {
  const [groups,  setGroups]  = useState<OtherGroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ── Étape 1 : Découvrir les tables disponibles ──────
      const { data: tableData, error: tableErr } = await supabase
        .rpc('discover_group_tables');

      if (tableErr) {
        setError(`Découverte des tables : ${tableErr.message}`);
        setLoading(false);
        return;
      }

      const allTables: GroupTableInfo[] = (tableData ?? []) as GroupTableInfo[];

      // Regrouper par préfixe
      const tablesByGroup = new Map<string, GroupTableInfo[]>();
      for (const code of OTHER_GROUPS) tablesByGroup.set(code, []);
      for (const t of allTables) {
        const list = tablesByGroup.get(t.group_prefix as typeof OTHER_GROUPS[number]);
        if (list) list.push(t);
      }

      // ── Étape 2 : Charger devices + mesures pour chaque groupe ──
      const results = await Promise.all(
        OTHER_GROUPS.map(async (code): Promise<OtherGroupData> => {
          const groupTables = tablesByGroup.get(code) ?? [];
          if (!groupTables.length) {
            return {
              code, connected: false, tables: [], devices: [],
              latestMeasurements: new Map(), genericData: [], error: null,
            };
          }

          const hasDevices  = groupTables.some(t => t.table_type === 'devices');
          const hasMeas     = groupTables.some(t => t.table_type === 'measurements');
          const otherTables = groupTables.filter(t => t.table_type === 'other');

          let devices: Device[]               = [];
          const latestMeasurements            = new Map<string, Measurement>();
          const genericData: GenericRow[]     = [];
          let groupError: string | null       = null;

          // Appareils
          if (hasDevices) {
            const { data, error: err } = await supabase
              .rpc('get_group_devices', { group_prefix: code });
            if (err) {
              groupError = `Appareils ${code} : ${err.message}`;
            } else {
              devices = (data ?? []) as Device[];
            }
          }

          // Mesures standard
          if (hasMeas) {
            const { data, error: err } = await supabase
              .rpc('get_group_latest_measurements', {
                group_prefix: code,
                row_limit:    200,
              });
            if (err) {
              groupError = groupError
                ? `${groupError} | Mesures ${code} : ${err.message}`
                : `Mesures ${code} : ${err.message}`;
            } else {
              for (const m of (data ?? []) as Measurement[]) {
                if (!latestMeasurements.has(m.device_id)) {
                  latestMeasurements.set(m.device_id, m);
                }
              }
            }
          }

          // Tables non standard
          for (const ot of otherTables) {
            const { data, error: err } = await supabase
              .rpc('get_group_table_generic', {
                table_name_param: ot.table_name,
                row_limit: 10,
              });
            if (!err && data) {
              const rows = (data as Array<{ raw_data: Record<string, unknown> }>)
                .map(r => r.raw_data);
              if (rows.length > 0) {
                genericData.push({ tableName: ot.table_name, data: rows });
              }
            }
          }

          return {
            code,
            connected: true,
            tables: groupTables,
            devices,
            latestMeasurements,
            genericData,
            error: groupError,
          };
        })
      );

      setGroups(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    load();
  }, [load]);

  // Polling léger toutes les 30 s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      load();
    }, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  return { groups, loading, error, refresh: load };
}

/**
 * Cherche dans le résultat de useOtherGroupsData la dernière mesure
 * pour un deviceId donné dans tous les groupes.
 */
export function findMeasurementInGroups(
  groups: OtherGroupData[],
  deviceId: string,
): Measurement | undefined {
  for (const g of groups) {
    const m = g.latestMeasurements.get(deviceId);
    if (m) return m;
  }
  return undefined;
}

/**
 * Retourne true si la mesure date de moins de 5 minutes.
 */
export function isMeasurementOnline(m?: Measurement): boolean {
  if (!m) return false;
  return Date.now() - new Date(m.created_at).getTime() < 5 * 60_000;
}
