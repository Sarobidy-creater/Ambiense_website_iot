// Silhouette baobab stylisée — Allée des Baobabs, Morondava
// SVG léger, pas d'image externe (éco-conception)
interface Props {
  className?: string;
  height?: number;
  color?: string;
  opacity?: number;
}

export function Baobab({
  className,
  height = 120,
  color = '#A8341C',
  opacity = 0.6,
}: Props) {
  const w = height * 0.55;
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 55 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* Tronc renflé caractéristique du baobab */}
      <path
        d="M22 118 L20 85 C18 72 10 65 8 55 C6 45 10 38 15 35 C12 32 10 28 12 22 C14 16 22 12 27.5 10 C33 12 41 16 43 22 C45 28 43 32 40 35 C45 38 49 45 47 55 C45 65 37 72 35 85 L33 118 Z"
        fill={color}
        opacity={opacity}
      />
      {/* Couronne — touffu au sommet */}
      <ellipse cx="27.5" cy="10" rx="18" ry="10" fill={color} opacity={opacity * 0.8} />
      <ellipse cx="15"   cy="15" rx="12" ry="8"  fill={color} opacity={opacity * 0.7} />
      <ellipse cx="40"   cy="15" rx="12" ry="8"  fill={color} opacity={opacity * 0.7} />
      <ellipse cx="10"   cy="22" rx="8"  ry="6"  fill={color} opacity={opacity * 0.5} />
      <ellipse cx="45"   cy="22" rx="8"  ry="6"  fill={color} opacity={opacity * 0.5} />
      {/* Ligne du sol */}
      <line x1="10" y1="118" x2="45" y2="118" stroke={color} strokeWidth="2" opacity={opacity} />
    </svg>
  );
}

/** Bandeau de plusieurs baobabs pour le héros */
export function BaobabBanner({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', pointerEvents: 'none' }}
    >
      <Baobab height={60}  color="#A8341C" opacity={0.3} />
      <Baobab height={90}  color="#E8A33D" opacity={0.35} />
      <Baobab height={120} color="#A8341C" opacity={0.5} />
      <Baobab height={75}  color="#E8A33D" opacity={0.3} />
      <Baobab height={50}  color="#A8341C" opacity={0.25} />
      <Baobab height={100} color="#A8341C" opacity={0.4} />
      <Baobab height={65}  color="#E8A33D" opacity={0.3} />
      <Baobab height={85}  color="#A8341C" opacity={0.35} />
    </div>
  );
}
