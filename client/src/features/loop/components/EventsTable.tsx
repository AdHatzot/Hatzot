/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Interception events table strictly matching the Figma layout and styling:
 * - "יומן אירועים" header with "ייצוא CSV" button
 * - Columns: Event ID, Interception System (with icon), Interceptor, Drone ID, Launch Time, Coordinates, Status, Result
 * - Row selection with active highlight indicator
 * - Pagination bar at bottom
 */
import { SystemIcon } from './SystemIcon';
import { StatusBadge } from './StatusBadge';
import { ResultBadge } from './ResultBadge';
import { EmptyState } from './EmptyState';
import type { InterceptionEvent } from '../types';

interface EventsTableProps {
  events: InterceptionEvent[];
  selectedEventId: string | null;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onSelectEvent: (event: InterceptionEvent) => void;
  onExportCsv: () => void;
}

function formatCoordinates(event: InterceptionEvent): string {
  if (event.threat.lastPosition) {
    return `${event.threat.lastPosition.latitude.toFixed(4)}, ${event.threat.lastPosition.longitude.toFixed(4)}`;
  }
  if (event.interceptorLaunchPosition) {
    return `${event.interceptorLaunchPosition.latitude.toFixed(4)}, ${event.interceptorLaunchPosition.longitude.toFixed(4)}`;
  }
  return '—';
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toTimeString().split(' ')[0] ?? '—';
  } catch {
    return '—';
  }
}

export function EventsTable({
  events,
  selectedEventId,
  isLoading,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onSelectEvent,
  onExportCsv,
}: EventsTableProps): JSX.Element {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-panel">
      {/* Table Header with Title and CSV Export */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-base font-semibold text-text">יומן אירועים</h3>
        <button
          onClick={onExportCsv}
          className="flex items-center gap-1.5 rounded border border-line bg-panel-2/60 px-3 py-1.5 text-xs text-text transition hover:bg-panel-2 hover:border-line-hot"
          title="הורדת קובץ CSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ייצוא CSV
        </button>
      </div>

      {/* Table Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <EmptyState title="טוען נתונים..." />
        ) : events.length === 0 ? (
          <EmptyState title="אין אירועים להצגה" description="לא נמצאו אירועים התואמים את החיפוש והסינון." />
        ) : (
          <table className="w-full border-collapse text-start text-xs">
            <thead className="sticky top-0 z-10 bg-panel text-text-dim">
              <tr className="border-b border-line">
                <th className="px-3 py-3 text-start font-medium">מזהה אירוע</th>
                <th className="px-3 py-3 text-start font-medium">מערכת יירוט</th>
                <th className="px-3 py-3 text-start font-medium">מיירט</th>
                <th className="px-3 py-3 text-start font-medium">מזהה רחפן</th>
                <th className="px-3 py-3 text-start font-medium">
                  <span className="inline-flex items-center gap-1">
                    שעת שיגור
                    <span className="text-[10px] text-text-dim">⇅</span>
                  </span>
                </th>
                <th className="px-3 py-3 text-start font-medium">קואורדינטת יירוט</th>
                <th className="px-3 py-3 text-center font-medium">סטטוס יירוט</th>
                <th className="px-3 py-3 text-center font-medium">תוצאת היירוט</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const isSelected = event.id === selectedEventId;
                const eventCode = `EVT-2026-${event.id.padStart(4, '0')}`;
                const interceptorName = `מיירט-${event.launcher.liveLauncherId.padStart(2, '0')}`;
                const droneName = `רחפן-${event.threat.droneId.padStart(3, '0')}`;

                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={`relative cursor-pointer border-b border-line/60 transition ${
                      isSelected ? 'bg-panel-2 font-medium text-white' : 'hover:bg-panel-2/50 text-text'
                    }`}
                  >
                    <td className="relative whitespace-nowrap px-3 py-3 font-mono text-text-dim">
                      {isSelected && (
                        <span className="absolute inset-y-0 start-0 w-1 bg-white" aria-hidden />
                      )}
                      <span className={isSelected ? 'text-white' : 'text-text-dim'}>{eventCode}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <SystemIcon systemName={event.launcher.launcherTypeName} />
                        <span>{event.launcher.launcherTypeName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{interceptorName}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono">{droneName}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-text-dim">
                      {formatTime(event.launchedAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-text-dim">
                      {formatCoordinates(event)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <ResultBadge result={event.result} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-text-dim">
        <div>
          {startItem}-{endItem} מתוך {totalItems}
        </div>
        <div className="flex items-center gap-1" dir="rtl">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded border border-line px-2 py-1 text-text-dim transition hover:bg-panel-2 disabled:opacity-30"
          >
            &gt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[24px] rounded px-2 py-1 text-center transition ${
                page === currentPage
                  ? 'bg-panel-2 font-semibold text-white border border-line-hot'
                  : 'text-text-dim hover:bg-panel-2'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded border border-line px-2 py-1 text-text-dim transition hover:bg-panel-2 disabled:opacity-30"
          >
            &lt;
          </button>
        </div>
      </div>
    </div>
  );
}