/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * The event log rows for one page. Click or Enter selects a row (and puts it
 * on the map); ↑/↓ walk the selection, across pages if needed.
 */
import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { droneCode, eventCode, formatClock, formatDay, formatPoint, interceptorCode } from '../format';
import { resultLabel, statusLabel } from '../status';
import type { InterceptionLogEntry, SortDirection } from '../types';
import type { LoopLoadState } from '../useLoopEvents';
import { LoopBadge } from './LoopBadge';
import { SortIcon } from './LoopIcons';
import { LoopSystemGlyph } from './LoopSystemGlyph';

/** Keep in sync with the h-11 header and h-[46px] rows below — the page size is measured from them. */
export const LOOP_TABLE_HEADER_PX = 44;
export const LOOP_TABLE_ROW_PX = 46;

interface LoopEventsTableProps {
  rows: InterceptionLogEntry[];
  state: LoopLoadState;
  skeletonRows: number;
  selectedId: string | null;
  sortDirection: SortDirection;
  scrollRef: RefObject<HTMLDivElement>;
  onSelect: (id: string) => void;
  onStep: (fromId: string, delta: 1 | -1) => void;
  onToggleSort: () => void;
  onRetry: () => void;
}

const CELL = 'whitespace-nowrap border-b border-line px-3 2xl:px-4';

function HeaderCell({ children, first = false, centred = false, ariaSort }: {
  children: ReactNode;
  first?: boolean;
  centred?: boolean;
  ariaSort?: 'ascending' | 'descending';
}): JSX.Element {
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`sticky top-0 z-[1] h-11 whitespace-nowrap border-b border-line bg-panel-2 px-3 text-xs font-medium text-text-dim 2xl:px-4 ${
        centred ? 'text-center' : 'text-start'
      } ${first ? '' : 'border-s'}`}
    >
      {children}
    </th>
  );
}

function Notice({ title, detail, action }: { title: string; detail: string; action?: JSX.Element }): JSX.Element {
  return (
    <div
      data-testid="loop-table-notice"
      className="flex flex-col items-center justify-center gap-1.5 px-6 text-center"
      style={{ minHeight: `calc(100% - ${LOOP_TABLE_HEADER_PX}px)` }}
    >
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="text-xs text-text-dim">{detail}</p>
      {action}
    </div>
  );
}

export function LoopEventsTable({
  rows,
  state,
  skeletonRows,
  selectedId,
  sortDirection,
  scrollRef,
  onSelect,
  onStep,
  onToggleSort,
  onRetry,
}: LoopEventsTableProps): JSX.Element {
  // Set by ↑/↓ so the newly selected row takes focus once it renders — it may
  // be on another page, in which case the old row unmounted with the focus.
  const focusSelection = useRef(false);

  useEffect(() => {
    if (!focusSelection.current || selectedId === null) return;
    const row = scrollRef.current?.querySelector<HTMLTableRowElement>(`tr[data-event-id="${CSS.escape(selectedId)}"]`);
    if (!row) return;
    focusSelection.current = false;
    row.focus();
  }, [selectedId, rows, scrollRef]);

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: string): void => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusSelection.current = true;
      onStep(id, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div ref={scrollRef} data-testid="loop-events-table" className="min-h-0 flex-1 overflow-auto border-t border-line">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <HeaderCell first>מזהה אירוע</HeaderCell>
            <HeaderCell>מערכת יירוט</HeaderCell>
            <HeaderCell>מיירט</HeaderCell>
            <HeaderCell>מזהה רחפן</HeaderCell>
            <HeaderCell ariaSort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
              <button
                type="button"
                onClick={onToggleSort}
                title={sortDirection === 'desc' ? 'מהחדש לישן — לחצו להפוך' : 'מהישן לחדש — לחצו להפוך'}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-text"
              >
                שעת שיגור
                <SortIcon direction={sortDirection} />
              </button>
            </HeaderCell>
            <HeaderCell>קואורדינטת יירוט</HeaderCell>
            <HeaderCell centred>סטטוס יירוט</HeaderCell>
            <HeaderCell centred>תוצאת היירוט</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {state === 'loading' &&
            Array.from({ length: skeletonRows }, (_, index) => (
              <tr key={index} className="h-[46px]" aria-hidden="true">
                {Array.from({ length: 8 }, (_, cell) => (
                  <td key={cell} className={CELL}>
                    <span className="block h-2.5 w-3/4 animate-pulse rounded bg-line" />
                  </td>
                ))}
              </tr>
            ))}

          {state === 'ready' &&
            rows.map((row) => {
              const selected = row.id === selectedId;
              return (
                <tr
                  key={row.id}
                  data-event-id={row.id}
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => onRowKeyDown(event, row.id)}
                  className={`h-[46px] cursor-pointer text-text outline-none transition-colors focus-visible:bg-panel-2 ${
                    selected ? 'bg-line' : 'hover:bg-panel-2'
                  }`}
                >
                  <td className={`${CELL} relative font-mono`}>
                    {selected && <span className="absolute inset-y-0 start-0 w-[3px] bg-text" aria-hidden="true" />}
                    {eventCode(row)}
                  </td>
                  <td className={CELL}>
                    <span className="inline-flex items-center gap-2.5">
                      {row.launcher.type ?? '—'}
                      <LoopSystemGlyph system={row.launcher.type} />
                    </span>
                  </td>
                  <td className={`${CELL} tabular-nums`} title={row.interceptor.type ?? undefined}>
                    {interceptorCode(row)}
                  </td>
                  <td className={`${CELL} tabular-nums`} title={row.drone.type ?? undefined}>
                    {droneCode(row)}
                  </td>
                  <td className={`${CELL} font-mono`} title={formatDay(row.launchedAt)}>
                    {formatClock(row.launchedAt)}
                  </td>
                  <td className={`${CELL} font-mono`}>
                    <span dir="ltr">{formatPoint(row.interceptPoint)}</span>
                  </td>
                  <td className={`${CELL} text-center`}>
                    <LoopBadge label={statusLabel(row)} />
                  </td>
                  <td className={`${CELL} text-center`}>
                    <LoopBadge label={resultLabel(row)} />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {state === 'error' && (
        <Notice
          title="לא ניתן לטעון את יומן האירועים"
          detail="השרת לא הגיב. בדקו את החיבור ונסו שוב."
          action={
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 h-8 rounded-md border border-line-hot px-4 text-sm text-text transition-colors hover:bg-panel-2"
            >
              נסה שוב
            </button>
          }
        />
      )}
      {state === 'ready' && rows.length === 0 && (
        <Notice title="לא נמצאו אירועים" detail="נסו להרחיב את טווח הזמן או לשנות את החיפוש." />
      )}
    </div>
  );
}
