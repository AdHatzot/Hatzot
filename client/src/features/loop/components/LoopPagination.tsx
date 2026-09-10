/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * RTL pager: page 1 sits on the right, "previous" points right, "next" left.
 */
import { ChevronIcon } from './LoopIcons';

interface LoopPaginationProps {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}

type PageItem = number | 'gap-start' | 'gap-end';

/** At most seven slots: every page, or the first, the last and a window around the current one. */
function pageItems(page: number, pageCount: number): PageItem[] {
  const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (pageCount <= 7) return range(1, pageCount);
  if (page <= 4) return [...range(1, 5), 'gap-end', pageCount];
  if (page >= pageCount - 3) return [1, 'gap-start', ...range(pageCount - 4, pageCount)];
  return [1, 'gap-start', page - 1, page, page + 1, 'gap-end', pageCount];
}

const ARROW = 'flex h-8 w-8 items-center justify-center rounded-md text-text-dim transition-colors hover:bg-panel-2 hover:text-text disabled:pointer-events-none disabled:opacity-30';

export function LoopPagination({ page, pageCount, onPage }: LoopPaginationProps): JSX.Element {
  return (
    <nav aria-label="דפדוף בין דפים" className="flex items-center gap-1">
      <button type="button" className={ARROW} aria-label="הדף הקודם" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronIcon pointing="right" />
      </button>
      {pageItems(page, pageCount).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPage(item)}
            className={`h-8 min-w-[2rem] rounded-md border px-2 font-mono text-sm transition-colors ${
              item === page ? 'border-line-hot bg-panel-2 text-text' : 'border-transparent text-text-dim hover:bg-panel-2 hover:text-text'
            }`}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="w-6 text-center text-text-dim" aria-hidden="true">
            …
          </span>
        ),
      )}
      <button type="button" className={ARROW} aria-label="הדף הבא" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        <ChevronIcon pointing="left" />
      </button>
    </nav>
  );
}
