// =========================================================
//  Hook useDevices — liste les appareils depuis la table
//  `G1E_devices`. Filtrage optionnel par kind.
// =========================================================
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Device } from '../lib/types';

interface Options {
  kind?: 'sensor' | 'actuator';
}

interface Result {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDevices(opts: Options = {}): Result {
  const { kind } = opts;
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from('G1E_devices').select('*').order('id');
    if (kind) q = q.eq('kind', kind);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setDevices((data ?? []) as Device[]);
    setLoading(false);
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  return { devices, loading, error, refresh: load };
}
