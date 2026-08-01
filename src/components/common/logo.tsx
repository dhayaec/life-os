import { cn } from '@/lib/utils';

function Mark({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}Gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-icon-from)" />
          <stop offset="100%" stopColor="var(--logo-icon-to)" />
        </linearGradient>
        <filter id={`${id}Shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity=".18" />
        </filter>
      </defs>
      <g transform="translate(25,25)" filter={`url(#${id}Shadow)`}>
        <line x1="65" y1="65" x2="25" y2="25" stroke={`url(#${id}Gradient)`} strokeWidth="5" />
        <line x1="65" y1="65" x2="105" y2="25" stroke={`url(#${id}Gradient)`} strokeWidth="5" />
        <line x1="65" y1="65" x2="25" y2="105" stroke={`url(#${id}Gradient)`} strokeWidth="5" />
        <line x1="65" y1="65" x2="105" y2="105" stroke={`url(#${id}Gradient)`} strokeWidth="5" />

        <circle cx="65" cy="65" r="22" fill={`url(#${id}Gradient)`} />

        <rect
          x="12"
          y="12"
          width="26"
          height="26"
          rx="8"
          fill="white"
          stroke={`url(#${id}Gradient)`}
          strokeWidth="3"
        />
        <rect
          x="92"
          y="12"
          width="26"
          height="26"
          rx="8"
          fill="white"
          stroke={`url(#${id}Gradient)`}
          strokeWidth="3"
        />
        <rect
          x="12"
          y="92"
          width="26"
          height="26"
          rx="8"
          fill="white"
          stroke={`url(#${id}Gradient)`}
          strokeWidth="3"
        />
        <rect
          x="92"
          y="92"
          width="26"
          height="26"
          rx="8"
          fill="white"
          stroke={`url(#${id}Gradient)`}
          strokeWidth="3"
        />

        <circle cx="65" cy="65" r="8" fill="white" />
      </g>
    </>
  );
}

export function LifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" aria-hidden="true" className={cn('block', className)}>
      <Mark id="lifeIcon" />
    </svg>
  );
}

export function LifeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 170" role="img" aria-label="LifeOS" className={cn('block', className)}>
      <Mark id="life" />

      <g transform="translate(180,71)">
        <text
          x="0"
          y="42"
          fontFamily="Inter, SF Pro Display, Segoe UI, Arial, sans-serif"
          fontSize="64"
          fontWeight="800"
          fill="var(--logo-ink)"
          letterSpacing="-2"
        >
          Life<tspan fill="url(#lifeGradient)">OS</tspan>
        </text>
      </g>
    </svg>
  );
}
