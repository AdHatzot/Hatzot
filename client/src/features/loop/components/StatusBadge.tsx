/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Interception status badge matching the Figma design.
 */
import type { InterceptionStatus } from '../types';

interface StatusBadgeProps {
  status: InterceptionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  if (status === 'SUCCESS' || status === 'FAILED') {
    return (
      <span className="inline-block min-w-[62px] text-center rounded border border-[#2b3a4a] bg-[#111820] px-2.5 py-0.5 text-xs text-text">
        הסתיים
      </span>
    );
  }

  if (status === 'ABORTED') {
    return (
      <span className="inline-block min-w-[62px] text-center rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400">
        בוטל
      </span>
    );
  }

  return (
    <span className="inline-block min-w-[62px] text-center rounded border border-team-loop/40 bg-team-loop/10 px-2.5 py-0.5 text-xs text-team-loop animate-pulse">
      ביירוט
    </span>
  );
}