// =========================================================
//  FanSvg — ventilateur animé SVG, vitesse réelle
//  Pas d'emoji. Animation CSS inline dans les defs SVG.
// =========================================================
import React from 'react';

interface Props {
  /** 0–100 : vitesse en % */
  speed: number;
  /** Indique si le ventilateur tourne */
  running: boolean;
  /** Diamètre en px (défaut 80) */
  size?: number;
}

/** Forme d'une pale de ventilateur — origin center at (36,36) */
const BLADE = 'M 35 33 Q 32 24 29 14 Q 36 9 42 14 Q 40 24 37 33 Z';

export function FanSvg({ speed, running, size = 80 }: Props) {
  // durée : 0.4 s à 100%, 3 s à 1%, arrêt si speed=0 ou running=false
  const duration = running && speed > 0
    ? `${(0.4 + (1 - speed / 100) * 2.6).toFixed(2)}s`
    : '0s';

  const bladeStyle: React.CSSProperties = {
    transformOrigin: '36px 36px',
    animation: running && speed > 0
      ? `_fanSpin ${duration} linear infinite`
      : 'none',
  };

  const gold  = 'var(--clr-or, #C9A240)';
  const faint = 'var(--clr-text-faint, #57566A)';
  const nuit  = 'var(--clr-nuit, #06050A)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* keyframe défini localement pour ne pas polluer global.css */}
        <style>{`@keyframes _fanSpin { to { transform: rotate(360deg); } }`}</style>
      </defs>

      {/* Anneau extérieur décoratif */}
      <circle
        cx="36" cy="36" r="34"
        stroke={running ? 'rgba(201,162,64,0.22)' : 'rgba(87,86,106,0.25)'}
        strokeWidth="1"
      />

      {/* 3 pales à 120° */}
      <g style={bladeStyle}>
        <path d={BLADE} fill={running ? gold : faint} opacity="0.9" />
        <path d={BLADE} fill={running ? gold : faint} opacity="0.9" transform="rotate(120 36 36)" />
        <path d={BLADE} fill={running ? gold : faint} opacity="0.9" transform="rotate(240 36 36)" />
      </g>

      {/* Moyeu */}
      <circle cx="36" cy="36" r="7"  fill={running ? gold  : faint} />
      <circle cx="36" cy="36" r="3"  fill={nuit} />
    </svg>
  );
}
