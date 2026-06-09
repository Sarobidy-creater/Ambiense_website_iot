// =========================================================
//  Hook useWeather — température extérieure via Open-Meteo
//  API gratuite, sans clé API, pour Paris.
//  Rafraîchissement toutes les 10 minutes (données météo
//  ne changent pas à la seconde — éco-conception).
// =========================================================
import { useCallback, useEffect, useState } from 'react';
import type { WeatherData } from '../lib/types';

const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=48.8566&longitude=2.3522' +
  '&current=temperature_2m' +
  '&timezone=Europe%2FParis';

const REFRESH_MS = 10 * 60_000; // 10 minutes

interface Result {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
}

export function useWeather(): Result {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(OPEN_METEO_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as {
        current: { temperature_2m: number };
        current_units: { temperature_2m: string };
      };
      setWeather({
        temperature: json.current.temperature_2m,
        unit:        json.current_units.temperature_2m,
        fetchedAt:   new Date().toISOString(),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur météo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetch_]);

  return { weather, loading, error };
}
