// =========================================================
//  groups.ts — source unique de vérité pour tous les groupes
//  et capteurs du réseau IoT Coupe du Monde
// =========================================================

export interface SensorDef {
  deviceId: string;           // 'G1E_temperature'
  type:     string;           // 'temperature' | 'humidity' | ...
  label:    string;           // 'Température'
  unit:     string;           // '°C' | 'dB' | ...
  kind:     'sensor' | 'actuator';
}

export interface GroupDef {
  code:    string;            // 'G1E'
  name:    string;            // 'Bar G1E'
  ours:    boolean;
  color:   string;            // accent CSS hex
  sensors: SensorDef[];
}

export const GROUPS: GroupDef[] = [
  {
    code: 'G1E', name: 'Bar G1E', ours: true, color: '#C9A240',
    sensors: [
      { deviceId: 'G1E_temperature', type: 'temperature', label: 'Température', unit: 'degC', kind: 'sensor'   },
      { deviceId: 'G1E_humidity',    type: 'humidity',    label: 'Humidité',    unit: '%',    kind: 'sensor'   },
      { deviceId: 'G1E_ventilateur', type: 'motor',       label: 'Ventilateur', unit: '',     kind: 'actuator' },
    ],
  },
  {
    code: 'G1A', name: 'Groupe G1A', ours: false, color: '#2BBFBF',
    sensors: [
      { deviceId: 'G1A_sound', type: 'sound', label: 'Son ambiant', unit: 'dB', kind: 'sensor' },
    ],
  },
  {
    code: 'G1B', name: 'Groupe G1B', ours: false, color: '#3AC98A',
    sensors: [
      { deviceId: 'G1B_presence', type: 'presence', label: 'Personnes présentes', unit: 'pers.', kind: 'sensor' },
    ],
  },
  {
    code: 'G1C', name: 'Groupe G1C', ours: false, color: '#E8A33D',
    sensors: [
      { deviceId: 'G1C_smoke', type: 'smoke', label: 'Fumée', unit: 'ppm', kind: 'sensor' },
    ],
  },
  {
    code: 'G1D', name: 'Groupe G1D', ours: false, color: '#8B7CF8',
    sensors: [
      { deviceId: 'G1D_alcohol', type: 'alcohol', label: 'Alcool (éthylotest)', unit: 'mg/L', kind: 'sensor' },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────

export type SensorWithGroup = SensorDef & {
  group:     string;
  groupName: string;
  ours:      boolean;
  color:     string;
};

/** Liste plate de tous les appareils avec leur groupe */
export const ALL_SENSORS: SensorWithGroup[] = GROUPS.flatMap(g =>
  g.sensors.map(s => ({
    ...s,
    group:     g.code,
    groupName: g.name,
    ours:      g.ours,
    color:     g.color,
  }))
);

/** Uniquement les capteurs (kind=sensor), sans les actionneurs */
export const ALL_SENSOR_ONLY: SensorWithGroup[] =
  ALL_SENSORS.filter(s => s.kind === 'sensor');

export function findSensor(deviceId: string): SensorWithGroup | undefined {
  return ALL_SENSORS.find(s => s.deviceId === deviceId);
}

export function findGroup(code: string): GroupDef | undefined {
  return GROUPS.find(g => g.code === code);
}

/** Formatte une valeur selon le type de capteur */
export function formatValue(value: number, type: string, unit: string): string {
  if (type === 'presence') return `${Math.max(0, Math.round(value))} ${unit}`.trim();
  const decimals = ['temperature', 'humidity'].includes(type) ? 1 : 0;
  return `${value.toFixed(decimals)} ${unit}`.trim();
}
