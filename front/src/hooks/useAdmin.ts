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
interface CommandRow {
  id:         number;
  device_id:  string;
  action:     string;
  payload:    Record<string, unknown> | null;
  status:     string;
  created_by: string | null;
  created_at: string;
}

interface CmdResult {
  commands: CommandRow[];
  total:    number;
  loading:  boolean;
  error:    string | null;
  fetch:    (limit?: number, offset?: number, status?: string) => void;
  cancel:   (id: number) => Promise<string | null>;
}

export function useAdminCommands(): CmdResult {
  const [commands, setCommands] = useState<CommandRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

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
  }, []);

  const cancel = useCallback(async (id: number): Promise<string | null> => {
    const { error: err } = await supabase
      .from('G1E_commands')
      .update({ status: 'error' })
      .eq('id', id)
      .eq('status', 'pending');
    if (err) return err.message;
    await fetch_();
    return null;
  }, [fetch_]);

  return { commands, total, loading, error, fetch: fetch_, cancel };
}
