// =========================================================
//  useGroupSensors — lecture directe des capteurs des groupes
//
//  G1A : g1a_sound           → db_value      (dB)
//  G1B : g1b_compteur_personnes → nb_personnes (pers.)
//  G1C : aucun capteur connecté
//  G1D : g1d_mq3_measurements → alcohol_level (mg/L)
//        (via RPC security definer car RLS G1D bloque l'accès direct)
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface GroupSensorReading {
  group:     string;
  label:     string;
  value:     number | null;
  unit:      string;
  type:      string;
  timestamp: string | null;
  online:    boolean;        // mesure de moins de 5 min
  error:     string | null;
}

interface Result {
  sensors:  GroupSensorReading[];
  loading:  boolean;
  refresh:  () => void;
}

const ONLINE_MS  = 5 * 60_000;
const POLL_MS    = 15_000;

function isOnline(ts: string | null): boolean {
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < ONLINE_MS;
}

// ── Lecteurs spécifiques ──────────────────────────────────

async function readG1ASound(): Promise<Omit<GroupSensorReading, 'group'>> {
  // Essai direct (RLS G1A autorise les authentifiés)
  const { data, error } = await supabase
    .from('g1a_sound')
    .select('db_value, measured_at')
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return {
      label: 'Son ambiant',
      value: data.db_value as number,
      unit:  'dB',
      type:  'sound',
      timestamp: data.measured_at as string,
      online: isOnline(data.measured_at as string),
      error:  null,
    };
  }

  // Fallback RPC (security definer)
  const { data: rpc, error: rpcErr } = await supabase
    .rpc('get_group_table_generic', { table_name_param: 'g1a_sound', row_limit: 1 });

  if (rpcErr || !rpc?.length) {
    return { label: 'Son ambiant', value: null, unit: 'dB', type: 'sound', timestamp: null, online: false, error: rpcErr?.message ?? null };
  }
  const row = rpc[0].raw_data as Record<string, unknown>;
  const ts  = (row.measured_at ?? null) as string | null;
  return {
    label: 'Son ambiant',
    value: row.db_value != null ? Number(row.db_value) : null,
    unit:  'dB',
    type:  'sound',
    timestamp: ts,
    online: isOnline(ts),
    error: null,
  };
}

async function readG1BPresence(): Promise<Omit<GroupSensorReading, 'group'>> {
  const { data, error } = await supabase
    .from('g1b_compteur_personnes')
    .select('nb_personnes, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return {
      label: 'Présence',
      value: data.nb_personnes as number,
      unit:  'pers.',
      type:  'presence',
      timestamp: data.created_at as string,
      online: isOnline(data.created_at as string),
      error: null,
    };
  }

  // Fallback RPC
  const { data: rpc, error: rpcErr } = await supabase
    .rpc('get_group_table_generic', { table_name_param: 'g1b_compteur_personnes', row_limit: 1 });

  if (rpcErr || !rpc?.length) {
    return { label: 'Présence', value: null, unit: 'pers.', type: 'presence', timestamp: null, online: false, error: rpcErr?.message ?? null };
  }
  const row = rpc[0].raw_data as Record<string, unknown>;
  const ts  = (row.created_at ?? null) as string | null;
  return {
    label: 'Présence',
    value: row.nb_personnes != null ? Number(row.nb_personnes) : null,
    unit:  'pers.',
    type:  'presence',
    timestamp: ts,
    online: isOnline(ts),
    error: null,
  };
}

async function readG1CSmoke(): Promise<Omit<GroupSensorReading, 'group'>> {
  // Découverte dynamique : on cherche toutes les tables G1C dans la base
  const { data: tables, error: discErr } = await supabase
    .rpc('discover_group_tables');

  if (discErr) {
    return { label: 'Fumée', value: null, unit: 'ppm', type: 'smoke', timestamp: null, online: false, error: discErr.message };
  }

  const g1cTables = ((tables ?? []) as Array<{ group_prefix: string; table_name: string }>)
    .filter(t => t.group_prefix === 'G1C');

  if (!g1cTables.length) {
    return { label: 'Fumée', value: null, unit: 'ppm', type: 'smoke', timestamp: null, online: false, error: 'Aucune table G1C trouvée' };
  }

  // Lecture de chaque table G1C jusqu'à trouver une ligne
  for (const table of g1cTables) {
    const { data: rpc, error: rpcErr } = await supabase
      .rpc('get_group_table_generic', { table_name_param: table.table_name, row_limit: 1 });

    if (rpcErr || !rpc?.length) continue;

    const row = rpc[0].raw_data as Record<string, unknown>;
    const ts  = (row.created_at ?? row.measured_at ?? null) as string | null;
    // Colonnes courantes pour un capteur de fumée/gaz
    const rawVal = row.smoke_level ?? row.ppm ?? row.value ?? row.gas_value ?? row.smoke_value ?? null;
    return {
      label:     'Fumée',
      value:     rawVal != null ? Number(rawVal) : null,
      unit:      'ppm',
      type:      'smoke',
      timestamp: ts,
      online:    isOnline(ts),
      error:     null,
    };
  }

  return { label: 'Fumée', value: null, unit: 'ppm', type: 'smoke', timestamp: null, online: false, error: 'Aucune donnée G1C en base' };
}

async function readG1DAlcohol(): Promise<Omit<GroupSensorReading, 'group'>> {
  // G1D a une RLS stricte → toujours passer par security definer
  const { data: rpc, error: rpcErr } = await supabase
    .rpc('get_group_table_generic', { table_name_param: 'g1d_mq3_measurements', row_limit: 1 });

  if (rpcErr || !rpc?.length) {
    return { label: 'Alcool', value: null, unit: 'mg/L', type: 'alcohol', timestamp: null, online: false, error: rpcErr?.message ?? null };
  }
  const row = rpc[0].raw_data as Record<string, unknown>;
  const ts  = (row.measured_at ?? null) as string | null;
  return {
    label: 'Alcool',
    value: row.alcohol_level != null ? Number(row.alcohol_level) : null,
    unit:  'mg/L',
    type:  'alcohol',
    timestamp: ts,
    online: isOnline(ts),
    error: null,
  };
}

// ── Hook principal ────────────────────────────────────────

export function useGroupSensors(): Result {
  const [sensors,  setSensors]  = useState<GroupSensorReading[]>([]);
  const [loading,  setLoading]  = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [g1a, g1b, g1c, g1d] = await Promise.all([
      readG1ASound(),
      readG1BPresence(),
      readG1CSmoke(),
      readG1DAlcohol(),
    ]);

    setSensors([
      { group: 'G1A', ...g1a },
      { group: 'G1B', ...g1b },
      { group: 'G1C', ...g1c },
      { group: 'G1D', ...g1d },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  return { sensors, loading, refresh: load };
}
