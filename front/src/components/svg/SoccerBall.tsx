// Ballon de foot stylisé — touche festive Coupe du Monde
interface Props {
  size?: number;
  className?: string;
}

export function SoccerBall({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="14" cy="14" r="13" stroke="#E8A33D" strokeWidth="1.5" fill="none" />
      {/* Pentagone central */}
      <polygon
        points="14,6 18.7,9.5 17,14.8 11,14.8 9.3,9.5"
        fill="#A8341C"
        opacity={0.8}
      />
      {/* Hexagones autour */}
      <polygon points="14,6 19.5,4 22,9 18.7,9.5"    fill="none" stroke="#E8A33D" strokeWidth="1" opacity={0.6} />
      <polygon points="22,9 25,13 22,18 18.7,9.5"     fill="none" stroke="#E8A33D" strokeWidth="1" opacity={0.6} />
      <polygon points="22,18 19,22 14,22 17,14.8"     fill="none" stroke="#E8A33D" strokeWidth="1" opacity={0.6} />
      <polygon points="14,22 9,22 6,18 11,14.8"       fill="none" stroke="#E8A33D" strokeWidth="1" opacity={0.6} />
      <polygon points="6,18 3,13 6,9 9.3,9.5"         fill="none" stroke="#E8A33D" strokeWidth="1" opacity={0.6} />
      <polygon points="6,9 8.5,4 14,6 9.3,9.5"        fill="none" stroke="#E8A33D" strokeWidth="1" opacity={0.6} />
    </svg>
  );
}
