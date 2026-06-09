// État vide illustré : baobab solitaire + message
interface Props {
  message?: string;
  subMessage?: string;
}

export function EmptyBaobab({
  message = 'Pas encore de données',
  subMessage = 'En attente du premier relevé…',
}: Props) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '16px', padding: '40px 20px', textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      {/* Coucher de soleil dégradé */}
      <svg width="160" height="100" viewBox="0 0 160 100" aria-hidden="true">
        <defs>
          <linearGradient id="sunset-empty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8341C" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#E8A33D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1F1712" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="160" height="100" fill="url(#sunset-empty)" rx="8" />
        {/* Soleil */}
        <circle cx="80" cy="65" r="18" fill="#F4C25B" opacity="0.7" />
        {/* Horizon */}
        <rect x="0" y="80" width="160" height="20" fill="#2A2018" opacity="0.8" rx="0" />
        {/* Baobab solitaire */}
        <g transform="translate(60, 20)">
          <rect x="17" y="50" width="7" height="30" rx="3" fill="#A8341C" opacity="0.7" />
          <ellipse cx="20.5" cy="25" rx="14" ry="9" fill="#A8341C" opacity="0.6" />
          <ellipse cx="10" cy="32" rx="9" ry="6" fill="#A8341C" opacity="0.5" />
          <ellipse cx="32" cy="32" rx="9" ry="6" fill="#A8341C" opacity="0.5" />
        </g>
      </svg>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--clr-text-muted)' }}>
        {message}
      </p>
      {subMessage && (
        <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-faint)' }}>
          {subMessage}
        </p>
      )}
    </div>
  );
}
