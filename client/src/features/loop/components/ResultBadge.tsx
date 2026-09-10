/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Interception result badge matching the Figma design:
 * - הושמד (Green)
 * - החטאה (Red)
 * - לא בוצע (Dim/Neutral)
 */
import type { InterceptionResult } from '../types';

interface ResultBadgeProps {
  result: InterceptionResult | null;
}

export function ResultBadge({ result }: ResultBadgeProps): JSX.Element {
  if (result === 'HIT') {
    return (
      <span className="inline-block min-w-[62px] text-center rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        הושמד
      </span>
    );
  }

  if (result === 'MISS') {
    return (
      <span className="inline-block min-w-[62px] text-center rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
        החטאה
      </span>
    );
  }

  return (
    <span className="inline-block min-w-[62px] text-center rounded border border-line bg-panel-2/60 px-2.5 py-0.5 text-xs text-text-dim">
      לא בוצע
    </span>
  );
}