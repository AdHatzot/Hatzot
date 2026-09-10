/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Line icons for the debrief page chrome. 24×24, stroked in currentColor.
 */
import type { SortDirection } from '../types';

interface IconProps {
  className?: string;
}

const STROKE = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function CalendarIcon({ className }: IconProps): JSX.Element {
  return (
    <svg {...STROKE} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps): JSX.Element {
  return (
    <svg {...STROKE} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps): JSX.Element {
  return (
    <svg {...STROKE} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps): JSX.Element {
  return (
    <svg {...STROKE} className={className}>
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
    </svg>
  );
}

export function ChevronIcon({ className, pointing }: IconProps & { pointing: 'left' | 'right' }): JSX.Element {
  return (
    <svg {...STROKE} className={className}>
      <path d={pointing === 'left' ? 'm14.5 6-6 6 6 6' : 'm9.5 6 6 6-6 6'} />
    </svg>
  );
}

/** Both arrows; the active direction is drawn at full strength. */
export function SortIcon({ className, direction }: IconProps & { direction: SortDirection }): JSX.Element {
  return (
    <svg {...STROKE} width={14} height={14} className={className}>
      <path d="m8 9.5 4-4 4 4" opacity={direction === 'asc' ? 1 : 0.45} />
      <path d="m8 14.5 4 4 4-4" opacity={direction === 'desc' ? 1 : 0.45} />
    </svg>
  );
}
