// =========================================================
//  SensorIcon — icônes SVG par type de capteur
//  Aucun emoji. Geometric minimal, 24x24 viewBox.
//  Couleur héritée via currentColor (stroke + fill).
// =========================================================

import type React from 'react';

interface Props {
  type: string;
  size?: number;
  className?: string;
}

// ── Paths individuels ───────────────────────────────────

function Thermometer() {
  return (
    <>
      <rect x="10" y="2" width="4" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="14" x2="12" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </>
  );
}

function FanBlades() {
  const B = 'M12 10 Q10 7 9 4 Q12 2 15 4 Q14 7 12 10 Z';
  return (
    <>
      <path d={B} fill="currentColor" />
      <path d={B} fill="currentColor" transform="rotate(120 12 12)" />
      <path d={B} fill="currentColor" transform="rotate(240 12 12)" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </>
  );
}

function Soundwave() {
  return (
    <>
      <rect x="2"  y="10" width="3" height="4"  rx="1" fill="currentColor"/>
      <rect x="7"  y="6"  width="3" height="12" rx="1" fill="currentColor"/>
      <rect x="12" y="8"  width="3" height="8"  rx="1" fill="currentColor"/>
      <rect x="17" y="4"  width="3" height="16" rx="1" fill="currentColor"/>
    </>
  );
}

function Person() {
  return (
    <>
      <circle cx="12" cy="6" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path
        d="M4.5 21 C4.5 16.3 7.9 12.5 12 12.5 C16.1 12.5 19.5 16.3 19.5 21"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
    </>
  );
}

function Smoke() {
  return (
    <>
      <path d="M8 22 Q5 18 8 14 Q11 10 8 6"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 22 Q11 18 14 14 Q17 10 14 6"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </>
  );
}

function WineGlass() {
  return (
    <>
      <path d="M6 2 L18 2 Q18 11 12 14 Q6 11 6 2 Z"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="12" y1="14" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="7" y1="21" x2="17" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  );
}

function WaterDrop() {
  return (
    <path
      d="M12 2 Q6 10 6 15 A6 6 0 0 0 18 15 Q18 10 12 2 Z"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
    />
  );
}

function SignalWaves() {
  return (
    <>
      <circle cx="5" cy="12" r="2" fill="currentColor"/>
      <path d="M9 8 A6.4 6.4 0 0 1 9 16"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 4.5 A10.5 10.5 0 0 1 13 19.5"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 2 A14 14 0 0 1 17 22"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  );
}

function Buzzer() {
  return (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  );
}

// ── Map type → composant ────────────────────────────────

const ICONS: Record<string, () => React.ReactElement> = {
  temperature: Thermometer,
  motor:       FanBlades,
  fan:         FanBlades,
  sound:       Soundwave,
  presence:    Person,
  smoke:       Smoke,
  alcohol:     WineGlass,
  humidity:    WaterDrop,
  co2:         WaterDrop,
  light:       SignalWaves,
  buzzer:      Buzzer,
};

// ── Export ──────────────────────────────────────────────

export function SensorIcon({ type, size = 24, className }: Props): React.ReactElement {
  const IconComponent = ICONS[type] ?? SignalWaves;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <IconComponent />
    </svg>
  );
}
