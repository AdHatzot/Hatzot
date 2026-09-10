/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Status and result pills. Tinted tones mix a token with transparency via
 * color-mix, so no hex is hardcoded and Tailwind's opacity modifiers (which
 * do not work on var() colours) are not needed.
 */
import type { CSSProperties } from 'react';
import type { LoopLabel, LoopTone } from '../status';

const TINT_TOKEN: Partial<Record<LoopTone, string>> = {
  active: '--accent',
  success: '--team-logistics',
  danger: '--team-red',
  warning: '--team-alerts',
};

const TONE_CLASS: Readonly<Record<LoopTone, string>> = {
  neutral: 'border-line-hot bg-panel-2 text-text',
  pending: 'border-dashed border-line-hot text-text-dim',
  active: '',
  success: '',
  danger: '',
  warning: '',
};

function tint(token: string | undefined): CSSProperties | undefined {
  if (!token) return undefined;
  return {
    color: `var(${token})`,
    borderColor: `color-mix(in srgb, var(${token}) 50%, transparent)`,
    backgroundColor: `color-mix(in srgb, var(${token}) 12%, transparent)`,
  };
}

export function LoopBadge({ label }: { label: LoopLabel }): JSX.Element {
  return (
    <span
      className={`inline-flex h-6 min-w-[72px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium ${TONE_CLASS[label.tone]}`}
      style={tint(TINT_TOKEN[label.tone])}
    >
      {label.tone === 'active' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />}
      {label.text}
    </span>
  );
}
