// =========================================================
//  Hook useMeasurements — polling OU realtime selon le flag
//  VITE_USE_REALTIME. Masque complètement le mode au reste
//  de l'app : toujours la même interface en sortie.
// =========================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, USE_REALTIME } from '../lib/supabase';
import type { Measurement } from '../lib/types';

interface Options {
  /** Filtrer par device_id (optionnel) */
  deviceId?: string;
  /** Filtrer par type (optionnel) */
  type?: string;
  /** Fenêtre temporelle : '5min' | '1h' | 'all' (défaut 'all') */
  since?: '5min' | '1h' | 'all';
  /** Nombre max de lignes (défaut 200) */
  limit?: number;
}

interface Result {
  measurements: Measurement[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Calcule l'horodatage ISO correspondant à la fenêtre choisie */
function sinceTimestamp(since: Options['since']): string | null {
  if (!since || since === 'all') return null;
  const ms = since === '5min' ? 5 * 60_000 : 60 * 60_000;
  return new Date(Date.now() - ms).toISOString();
}

export function useMeasurements(opts: Options = {}): Result {
  const { deviceId, type, since = 'all', limit = 200 } = opts;

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Curseur pour le polling : on ne retélécharge que les nouvelles lignes
  const lastTsRef = useRef<string | null>(null);

  const buildQuery = useCallback(() => {
    let q = supabase
      .from('G1E_measurements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (deviceId) q = q.eq('device_id', deviceId);
    if (type)     q = q.eq('type', type);

    const ts = sinceTimestamp(since);
    if (ts) q = q.gte('created_at', ts);

    return q;
  }, [deviceId, type, since, limit]);

  // Charge initial
  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await buildQuery();
    if (err) {
      setError(err.message);
    } else if (data) {
      setMeasurements(data as Measurement[]);
      if (data.length > 0) lastTsRef.current = data[0].created_at;
    }
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // ---- Mode Realtime ----
  useEffect(() => {
    if (!USE_REALTIME) return;

    const channelName = `meas-${deviceId ?? 'all'}-${type ?? 'all'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'G1E_measurements' },
        (payload) => {
          const row = payload.new as Measurement;
          // Filtre côté client pour correspondre aux options
          if (deviceId && row.device_id !== deviceId) return;
          if (type     && row.type      !== type)      return;

          setMeasurements((prev) => [row, ...prev].slice(0, limit));
          lastTsRef.current = row.created_at;
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [deviceId, type, limit]);

  // ---- Mode Polling ----
  useEffect(() => {
    if (USE_REALTIME) return;

    const INTERVAL_MS = 1000;

    const poll = async () => {
      // Pause quand l'onglet est caché — économie de requêtes
      if (document.visibilityState === 'hidden') return;

      try {
        let q = supabase
          .from('G1E_measurements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50); // petites tranches en polling

        if (deviceId) q = q.eq('device_id', deviceId);
        if (type)     q = q.eq('type', type);

        // Ne récupère que les lignes plus récentes que le curseur
        if (lastTsRef.current) q = q.gt('created_at', lastTsRef.current);

        const { data, error: err } = await q;
        if (err) { setError(err.message); return; }
        if (data && data.length > 0) {
          setMeasurements((prev) =>
            [...(data as Measurement[]), ...prev].slice(0, limit)
          );
          lastTsRef.current = (data as Measurement[])[0].created_at;
          setError(null);
        }
      } catch {
        setError('Erreur réseau — nouvelle tentative...');
      }
    };

    const id = setInterval(poll, INTERVAL_MS);
    return () => clearInterval(id);
  }, [deviceId, type, limit]);

  return { measurements, loading, error, refresh: initialLoad };
}
