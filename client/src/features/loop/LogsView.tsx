/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * תחקור אירועים — the interception debrief page on /logs. Filter bar on top;
 * below it the event log and the selected event's map, side by side. The
 * time range is filtered on the server, the text search and paging here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoopEventMap } from './components/LoopEventMap';
import { LOOP_TABLE_HEADER_PX, LOOP_TABLE_ROW_PX, LoopEventsTable } from './components/LoopEventsTable';
import { LoopFilterBar } from './components/LoopFilterBar';
import { DownloadIcon } from './components/LoopIcons';
import { LoopPagination } from './components/LoopPagination';
import { downloadInterceptionCsv } from './csv';
import { defaultFilters, filtersRange, type LoopFilters } from './filters';
import { compareByLaunch, matchesQuery } from './format';
import type { SortDirection } from './types';
import { useLoopEvents } from './useLoopEvents';
import { useLoopFitRows } from './useLoopFitRows';

const MIN_PAGE_SIZE = 5;

export function LogsView(): JSX.Element {
  const [draft, setDraft] = useState<LoopFilters>(() => defaultFilters());
  const [applied, setApplied] = useState<LoopFilters>(draft);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const draftValid = useMemo(() => filtersRange(draft) !== null, [draft]);
  const appliedRange = useMemo(() => filtersRange(applied), [applied]);
  const { events, truncated, state, retry } = useLoopEvents(appliedRange);
  const pageSize = useLoopFitRows(scrollRef, LOOP_TABLE_ROW_PX, LOOP_TABLE_HEADER_PX, MIN_PAGE_SIZE);

  const visible = useMemo(() => {
    const matched = events.filter((event) => matchesQuery(event, applied.query));
    return matched.sort(sortDirection === 'asc' ? compareByLaunch : (a, b) => compareByLaunch(b, a));
  }, [events, applied.query, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = useMemo(
    () => visible.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visible, currentPage, pageSize],
  );
  const selected = useMemo(() => visible.find((event) => event.id === selectedId) ?? null, [visible, selectedId]);

  // Keep an event on the map: when the selection leaves the results, fall
  // back to the first row on screen.
  useEffect(() => {
    if (selected === null && rows.length > 0) setSelectedId(rows[0].id);
  }, [selected, rows]);

  const apply = (): void => {
    if (!draftValid) return;
    setApplied(draft);
    setPage(1);
  };

  const clear = (): void => {
    const fresh = defaultFilters();
    setDraft(fresh);
    setApplied(fresh);
    setPage(1);
  };

  const toggleSort = (): void => {
    setSortDirection((direction) => (direction === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  const step = useCallback(
    (fromId: string, delta: 1 | -1): void => {
      const index = visible.findIndex((event) => event.id === fromId);
      const nextIndex = index + delta;
      if (index === -1 || nextIndex < 0 || nextIndex >= visible.length) return;
      setSelectedId(visible[nextIndex].id);
      setPage(Math.floor(nextIndex / pageSize) + 1);
    },
    [visible, pageSize],
  );

  const ready = state === 'ready';
  const firstRow = visible.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, visible.length);

  return (
    <div data-testid="loop-page" className="absolute inset-0 overflow-y-auto bg-bg">
      <div className="flex min-h-full flex-col gap-4 p-5 xl:h-full">
        <header>
          <h1 className="text-2xl font-bold leading-tight text-text">תחקור אירועים</h1>
          <p className="mt-1 text-sm text-text-dim">חיפוש, סינון וניתוח אירועי יירוט היסטוריים</p>
        </header>

        <LoopFilterBar
          filters={draft}
          invalid={!draftValid}
          resultCount={visible.length}
          loadState={state}
          onChange={setDraft}
          onApply={apply}
          onClear={clear}
        />

        {/* Side by side from xl. The map takes up to 34% (the design's share) but
            yields width until the log has the 900px its columns need. */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:min-h-[480px] xl:grid-cols-[minmax(0,1fr)_min(34%,max(320px,calc(100%_-_916px)))] xl:grid-rows-[minmax(0,1fr)]">
          <section
            data-testid="loop-events"
            aria-label="יומן אירועים"
            className="flex h-[640px] min-h-0 flex-col rounded-md border border-line bg-panel xl:h-auto"
          >
            <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
              <h2 className="text-base font-semibold text-text">יומן אירועים</h2>
              <button
                type="button"
                onClick={() => downloadInterceptionCsv(visible, applied)}
                disabled={!ready || visible.length === 0}
                title="ייצוא כל האירועים התואמים לסינון"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line-hot px-3.5 text-sm text-text transition-colors hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ייצוא CSV
                <DownloadIcon />
              </button>
            </div>

            <LoopEventsTable
              rows={rows}
              state={state}
              skeletonRows={pageSize}
              selectedId={selected?.id ?? null}
              sortDirection={sortDirection}
              scrollRef={scrollRef}
              onSelect={setSelectedId}
              onStep={step}
              onToggleSort={toggleSort}
              onRetry={retry}
            />

            <footer className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-line px-4 text-sm text-text-dim">
              <span className="justify-self-start">
                {ready && visible.length > 0 && (
                  <>
                    <span dir="ltr" className="font-mono">
                      {firstRow}–{lastRow}
                    </span>{' '}
                    מתוך <span className="font-mono">{visible.length.toLocaleString('he-IL')}</span>
                  </>
                )}
              </span>
              <LoopPagination page={currentPage} pageCount={pageCount} onPage={setPage} />
              <span className="justify-self-end text-xs text-team-alerts">
                {ready && truncated && 'מוצגים 5,000 האירועים האחרונים — צמצמו את טווח הזמן'}
              </span>
            </footer>
          </section>

          <section
            data-testid="loop-map"
            aria-label="מיקום האירוע"
            className="flex h-[520px] min-h-0 flex-col rounded-md border border-line bg-panel xl:h-auto"
          >
            <LoopEventMap event={selected} />
          </section>
        </div>
      </div>
    </div>
  );
}
