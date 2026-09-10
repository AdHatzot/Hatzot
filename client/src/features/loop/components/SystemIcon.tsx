/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Tactical air defense system icons matching the Figma C2 design.
 * - ShieldNest-Lite: Blue/Cyan Diamond
 * - IronHook-SR: Orange Double Chevron
 * - HorizonEye-MX: Green Triangle
 * - CloudFence-Area: Purple Hexagon
 */

interface SystemIconProps {
  systemName: string;
  className?: string;
}

export function SystemIcon({ systemName, className = 'w-4 h-4 shrink-0' }: SystemIconProps): JSX.Element {
  const name = systemName.toLowerCase();

  if (name.includes('shieldnest')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={`${className} text-sky-400`} aria-label="ShieldNest">
        <polygon points="10,2 18,10 10,18 2,10" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.25" />
        <circle cx="10" cy="10" r="2.5" fill="currentColor" />
      </svg>
    );
  }

  if (name.includes('ironhook')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={`${className} text-amber-500`} aria-label="IronHook">
        <path d="M4 11L10 6L16 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16L10 11L16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name.includes('horizoneye')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={`${className} text-emerald-400`} aria-label="HorizonEye">
        <polygon points="10,3 18,17 2,17" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.2" />
        <circle cx="10" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (name.includes('cloudfence')) {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={`${className} text-purple-400`} aria-label="CloudFence">
        <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.25" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${className} text-text-dim`} aria-label="Defense System">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}
