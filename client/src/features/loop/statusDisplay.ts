/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Backend status/result values are never shown to the user as-is —
 * every value must map to clear Hebrew text (see assignment.txt:
 * "הסטטוסים מוצגים למשתמש בטקסט ברור ולא בערכי Backend בלבד").
 *
 * Mapping note: assignment.txt's example strings ("מנתח את תמונת המצב...",
 * "המיירט באוויר") are introduced with "לדוגמה:" (for example) — i.e.
 * illustrative UI copy for statuses, not literal enum names. The real
 * enum (per the hatzot DDL) is PENDING/IN_PROGRESS/SUCCESS/FAILED/ABORTED.
 * Mapped PENDING -> "analyzing" copy, IN_PROGRESS -> "in flight" copy.
 */
import type { InterceptionResult, InterceptionStatus } from './types';

export const STATUS_LABELS: Record<InterceptionStatus, string> = {
  PENDING: 'מנתח את תמונת המצב...',
  IN_PROGRESS: 'המיירט באוויר',
  SUCCESS: 'האירוע הסתיים',
  FAILED: 'האירוע הסתיים',
  ABORTED: 'האירוע בוטל',
};

export const RESULT_LABELS: Record<InterceptionResult, string> = {
  HIT: 'פגיעה',
  MISS: 'החטאה',
};

/** For ABORTED rows, which have no HIT/MISS result (DB forbids one). */
export const ABORTED_RESULT_LABEL = 'בוטל';

/**
 * Best-effort label for a status value. Falls back to a readable
 * version of the raw value instead of ever printing the enum as-is,
 * in case the backend adds a status the UI doesn't know about yet.
 */
export function getStatusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as InterceptionStatus];
  }
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getResultLabel(result: string): string {
  if (result in RESULT_LABELS) {
    return RESULT_LABELS[result as InterceptionResult];
  }
  return result;
}