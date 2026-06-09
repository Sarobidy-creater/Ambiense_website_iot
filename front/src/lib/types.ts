// =========================================================
//  Types partagés — projet bar Coupe du Monde · G1E
// =========================================================

/** Appareil physique : capteur ou actionneur */
export interface Device {
  id: string;          // ex: 'G1E_temperature'
  kind: 'sensor' | 'actuator';
  type: string;        // 'temperature' | 'motor'
  unit: string | null;
  label: string | null;
  created_at: string;
}

/** Mesure envoyée par un capteur */
export interface Measurement {
  id: number;
  device_id: string;
  type: string;
  value: number;
  unit: string | null;
  created_at: string;
}

/** Commande envoyée vers un actionneur */
export interface Command {
  id: number;
  device_id: string;
  action: 'set_speed' | 'on' | 'off' | string;
  payload: Record<string, unknown> | null;
  status: 'pending' | 'done' | 'error';
  created_by: string | null;
  created_at: string;
}

/** Température extérieure Open-Meteo */
export interface WeatherData {
  temperature: number;
  unit: string;
  fetchedAt: string;
}

/** Seuil d'alerte configurable */
export interface AlertConfig {
  enabled: boolean;
  threshold: number; // °C
}

/** Résumé statistique d'une série de mesures */
export interface MeasurementStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

/** Fenêtre temporelle pour les graphiques */
export type TimeWindow = '5min' | '1h' | 'all';
