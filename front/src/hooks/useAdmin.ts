// =========================================================
//  useAdminDevices — CRUD complet sur G1E_devices
// =========================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Device } from '../lib/types';

export interface DeviceForm {
  id:    string;
  kind:  'sensor' | 'actuator';
  type:  string;
  unit:  string;
  label: string;
}

interface Result {
  devices:  Device[];
  loading:  boolean;
  saving:   boolean;
  error:    string | null;
  refresh:  () => void;
  create:   (form: DeviceForm) => Promise<string | null>;
  update:   (id: string, patch: Partial<Omit<DeviceForm, 'id'>>) => Promise<string | null>;
  remove:   (id: string) => Promise<string | null>;
}

export function useAdminDevices(): Result {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('G1E_devices')
      .select('*')
      .order('id');
    if (err) setError(err.message);
    else setDevices((data ?? []) as Device[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (form: DeviceForm): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase.from('G1E_devices').insert({
      id:    form.id,
      kind:  form.kind,
      type:  form.type,
      unit:  form.unit  || null,
      label: form.label || null,
    });
    setSaving(false);
    if (err) return err.message;
    await load();
    return null;
  }, [load]);

  const update = useCallback(async (
    id: string,
    patch: Partial<Omit<DeviceForm, 'id'>>,
  ): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase
      .from('G1E_devices')
      .update({ ...patch, unit: patch.unit || null, label: patch.label || null })
      .eq('id', id);
    setSaving(false);
    if (err) return err.message;
    await load();
    return null;
  }, [load]);

  const remove = useCallback(async (id: string): Promise<string | null> => {
    setSaving(true);
    const { error: err } = await supabase
      .from('G1E_devices')
      .delete()
      .eq('id', id);
    setSaving(false);
    if (err) return err.message;
    await load();
    return null;
  }, [load]);

  return { devices, loading, saving, error, refresh: load, create, update, remove };
}

// =========================================================
//  useAdminMeasurements — explorateur de mesures avec pagination
// =========================================================
export interface MeasFilter {
  deviceId?: string;
  type?:     string;
  from?:     string; // ISO date
  to?:       string; // ISO date
  limit:     number;
  offset:    number;
}

interface MeasResult {
  rows:    { id: number; device_id: string; type: string; value: number; unit: string | null; created_at: string }[];
  total:   number;
  loading: boolean;
  error:   string | null;
  fetch:   (f: MeasFilter) => void;
}

export function useAdminMeasurements(): MeasResult {
  const [rows,    setRows]    = useState<MeasResult['rows']>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch_ = useCallback(async (f: MeasFilter) => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('G1E_measurements')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(f.offset, f.offset + f.limit - 1);

      if (f.deviceId) q = q.eq('device_id', f.deviceId);
      if (f.type)     q = q.eq('type', f.type);
      if (f.from)     q = q.gte('created_at', f.from);
      if (f.to)       q = q.lte('created_at', f.to);

      const { data, count, error: err } = await q;
      if (err) { setError(err.message); return; }
      setRows((data ?? []) as MeasResult['rows']);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rows, total, loading, error, fetch: fetch_ };
}

// =========================================================
//  useAdminCommands — historique des commandes
// =========================================================
export interface CommandRow {
  id:         number;
  device_id:  string;
  action:     string;
  payload:    Record<string, unknown> | null;
  status:     string;
  created_by: string | null;
  created_at: string;
}

export interface CommandCounts { pending: number; done: number; error: number }

interface CmdResult {
  commands: CommandRow[];
  total:    number;
  counts:   CommandCounts;
  loading:  boolean;
  error:    string | null;
  fetch:    (limit?: number, offset?: number, status?: string) => void;
  cancel:   (id: number) => Promise<string | null>;
}

export function useAdminCommands(): CmdResult {
  const [commands, setCommands] = useState<CommandRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [counts,   setCounts]   = useState<CommandCounts>({ pending: 0, done: 0, error: 0 });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Comptages globaux (indépendants de la pagination)
  const fetchCounts = useCallback(async () => {
    const [rP, rD, rE] = await Promise.all([
      supabase.from('G1E_commands').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('G1E_commands').select('*', { count: 'exact', head: true }).eq('status', 'done'),
      supabase.from('G1E_commands').select('*', { count: 'exact', head: true }).eq('status', 'error'),
    ]);
    setCounts({ pending: rP.count ?? 0, done: rD.count ?? 0, error: rE.count ?? 0 });
  }, []);

  const fetch_ = useCallback(async (limit = 50, offset = 0, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('G1E_commands')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (status) q = q.eq('status', status);

      const { data, count, error: err } = await q;
      if (err) { setError(err.message); return; }
      setCommands((data ?? []) as CommandRow[]);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
    fetchCounts();
  }, [fetchCounts]);

  const cancel = useCallback(async (id: number): Promise<string | null> => {
    const { data, error: err } = await supabase
      .from('G1E_commands')
      .update({ status: 'error' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id');
    if (err) return err.message;
    if (!data || data.length === 0)
      return 'Annulation refusée : la commande est déjà traitée ou les permissions sont insuffisantes (vérifiez les policies RLS dans Supabase).';
    return null;
  }, []);

  return { commands, total, counts, loading, error, fetch: fetch_, cancel };
}

// =========================================================
//  useAdminAggregates — statistiques agregees par capteur
//  Calcul cote client a partir des N dernieres mesures
// =========================================================

export interface DeviceStat {
  deviceId: string;
  count:    number;
  min:      number;
  max:      number;
  avg:      number;
  std:      number;
  last:     number;
  lastAt:   string;
  trend:    number; // diff last - prev (positif = hausse)
  points:   { time: string; value: number }[]; // sparkline
}

interface AggResult {
  stats:   DeviceStat[];
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

export function useAdminAggregates(deviceIds: string[], limit = 120): AggResult {
  const [stats,   setStats]   = useState<DeviceStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!deviceIds.length) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        deviceIds.map(id =>
          supabase
            .from('G1E_measurements')
            .select('id, value, created_at')
            .eq('device_id', id)
            .order('created_at', { ascending: false })
            .limit(limit)
        )
      );

      const built: DeviceStat[] = deviceIds.map((id, i) => {
        const rows = (results[i].data ?? []) as { id: number; value: number; created_at: string }[];
        if (!rows.length) return {
          deviceId: id, count: 0, min: 0, max: 0, avg: 0, std: 0,
          last: 0, lastAt: '', trend: 0, points: [],
        };
        const vals = rows.map(r => r.value);
        const avg  = vals.reduce((a, b) => a + b, 0) / vals.length;
        const std  = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
        const sorted = [...rows].reverse();
        const pts = sorted.map(r => ({
          time:  new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          value: r.value,
        }));
        return {
          deviceId: id,
          count:    rows.length,
          min:      Math.min(...vals),
          max:      Math.max(...vals),
          avg,
          std,
          last:     rows[0].value,
          lastAt:   rows[0].created_at,
          trend:    rows.length > 1 ? rows[0].value - rows[1].value : 0,
          points:   pts.slice(-30),
        };
      });
      setStats(built);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [deviceIds.join(','), limit]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, refresh: load };
}

// =========================================================
//  useAdminHourly — agregat mesures par heure (24h)
// =========================================================

export interface HourlyBucket {
  hour:  string; // 'HH:00'
  count: number;
  avg:   number;
  min:   number;
  max:   number;
}

interface HourlyResult {
  buckets:  HourlyBucket[];
  loading:  boolean;
  error:    string | null;
  refresh:  () => void;
}

export function useAdminHourly(deviceId: string): HourlyResult {
  const [buckets,  setBuckets]  = useState<HourlyBucket[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data, error: err } = await supabase
        .from('G1E_measurements')
        .select('value, created_at')
        .eq('device_id', deviceId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (err) { setError(err.message); return; }
      const rows = (data ?? []) as { value: number; created_at: string }[];

      // Grouper par heure
      const map = new Map<string, number[]>();
      for (const r of rows) {
        const h = new Date(r.created_at).getHours();
        const key = `${String(h).padStart(2, '0')}:00`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r.value);
      }
      const built: HourlyBucket[] = [];
      for (const [hour, vals] of map) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        built.push({ hour, count: vals.length, avg, min: Math.min(...vals), max: Math.max(...vals) });
      }
      setBuckets(built.sort((a, b) => a.hour.localeCompare(b.hour)));
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { load(); }, [load]);

  return { buckets, loading, error, refresh: load };
}
