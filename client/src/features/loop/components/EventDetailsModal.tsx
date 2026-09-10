/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Full details for a single event, opened by clicking its table row.
 * Uses the row data already in memory — the list endpoint is already
 * denormalized, so no extra round trip is needed.
 */
import { StatusBadge } from './StatusBadge';
import { ResultBadge } from './ResultBadge';
import { ABORTED_RESULT_LABEL } from '../statusDisplay';
import type { InterceptionEvent } from '../types';

interface EventDetailsModalProps {
  event: InterceptionEvent;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-dim">{label}</dt>
      <dd className="font-mono text-sm text-text">{value}</dd>
    </div>
  );
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-lg border border-line bg-panel p-5 text-text shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">אירוע EVT-{event.id}</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-text-dim hover:bg-panel-2 hover:text-text"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <StatusBadge status={event.status} />
          {event.result ? (
            <ResultBadge result={event.result} />
          ) : (
            event.closed && <span className="text-xs text-text-dim">{ABORTED_RESULT_LABEL}</span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Field label="סוג איום" value={event.threat.droneTypeName} />
          <Field
            label="מיקום איום אחרון"
            value={
              event.threat.lastPosition
                ? `${event.threat.lastPosition.latitude.toFixed(4)}, ${event.threat.lastPosition.longitude.toFixed(4)}`
                : '—'
            }
          />
          <Field label="מהירות (מ׳/ש)" value={event.threat.velocity?.toFixed(1) ?? '—'} />
          <Field label="כיוון (מעלות)" value={event.threat.heading?.toFixed(0) ?? '—'} />
          <Field label="מערכת הגנה" value={event.defenseSystem.deploymentName ?? '—'} />
          <Field label="משגר" value={event.launcher.launcherTypeName} />
          <Field label="מיירט" value={event.interceptor.interceptorTypeName} />
          <Field
            label="מיקום שיגור מיירט"
            value={
              event.interceptorLaunchPosition
                ? `${event.interceptorLaunchPosition.latitude.toFixed(4)}, ${event.interceptorLaunchPosition.longitude.toFixed(4)}`
                : '—'
            }
          />
          <Field label="עדיפות" value={String(event.priority)} />
          <Field label="זמן שיגור" value={new Date(event.launchedAt).toLocaleString('he-IL')} />
        </dl>
      </div>
    </div>
  );
}