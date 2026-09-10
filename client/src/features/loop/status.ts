/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Backend enum values are never shown as-is — each maps to Hebrew text and a
 * tone the badge knows how to colour.
 */
import type { InterceptionLogEntry, InterceptionStatus } from './types';

export type LoopTone = 'neutral' | 'pending' | 'active' | 'success' | 'danger' | 'warning';

export interface LoopLabel {
  text: string;
  tone: LoopTone;
}

const STATUS_LABELS: Readonly<Record<InterceptionStatus, LoopLabel>> = {
  PENDING: { text: 'ממתין', tone: 'pending' },
  IN_PROGRESS: { text: 'בביצוע', tone: 'active' },
  SUCCESS: { text: 'הסתיים', tone: 'neutral' },
  FAILED: { text: 'הסתיים', tone: 'neutral' },
  ABORTED: { text: 'בוטל', tone: 'warning' },
};

export function statusLabel(event: InterceptionLogEntry): LoopLabel {
  return STATUS_LABELS[event.status] ?? { text: event.status, tone: 'neutral' };
}

export function resultLabel(event: InterceptionLogEntry): LoopLabel {
  if (event.result === 'HIT') return { text: 'הושמד', tone: 'success' };
  if (event.result === 'MISS') return { text: 'החטאה', tone: 'danger' };
  // The DDL forbids a result on ABORTED — the interceptor never flew.
  if (event.status === 'ABORTED') return { text: 'לא בוצע', tone: 'neutral' };
  return { text: 'טרם הוכרע', tone: 'pending' };
}
