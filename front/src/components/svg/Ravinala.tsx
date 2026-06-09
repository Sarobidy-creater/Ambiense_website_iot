// Palmier du voyageur (ravinala) — icône / séparateur
// Éventail caractéristique de Madagascar
interface Props {
  size?: number;
  color?: string;
  className?: string;
}

export function Ravinala({ size = 32, color = '#2E7D5B', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Tronc */}
      <rect x="14.5" y="18" width="3" height="13" rx="1.5" fill={color} opacity={0.7} />
      {/* Feuilles en éventail */}
      {[
        'M16 18 L4 6',
        'M16 18 L8 3',
        'M16 18 L16 2',
        'M16 18 L24 3',
        'M16 18 L28 6',
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.6 + i * 0.05}
        />
      ))}
      {/* Folioles sur chaque tige */}
      <ellipse cx="4"  cy="6"  rx="3" ry="1.5" fill={color} opacity={0.5} transform="rotate(-30 4 6)" />
      <ellipse cx="8"  cy="3"  rx="3" ry="1.5" fill={color} opacity={0.5} transform="rotate(-15 8 3)" />
      <ellipse cx="16" cy="2"  rx="3" ry="1.5" fill={color} opacity={0.5} />
      <ellipse cx="24" cy="3"  rx="3" ry="1.5" fill={color} opacity={0.5} transform="rotate(15 24 3)" />
      <ellipse cx="28" cy="6"  rx="3" ry="1.5" fill={color} opacity={0.5} transform="rotate(30 28 6)" />
    </svg>
  );
}
