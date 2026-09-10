/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Time range, free-text search, apply / clear, and the result count. Edits
 * stay a draft until "החל סינון" (or Enter in the search box).
 */
import type { ReactNode } from 'react';
import type { LoopFilters } from '../filters';
import type { LoopLoadState } from '../useLoopEvents';
import { LoopPickerField } from './LoopPickerField';
import { SearchIcon } from './LoopIcons';

interface LoopFilterBarProps {
  filters: LoopFilters;
  /** The draft range is unreadable or runs backwards — apply is blocked. */
  invalid: boolean;
  /** Rows matching the applied filters. */
  resultCount: number;
  loadState: LoopLoadState;
  onChange: (next: LoopFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

function RangeGroup({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-xs leading-5 text-text-dim">{label}</span>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function ResultCount({ invalid, loadState, count }: { invalid: boolean; loadState: LoopLoadState; count: number }): JSX.Element {
  if (invalid) return <span className="text-team-red">טווח הזמן אינו תקין</span>;
  if (loadState === 'loading') return <span>טוען…</span>;
  if (loadState === 'error') return <span className="text-team-red">הטעינה נכשלה</span>;
  if (count === 1) return <span>אירוע אחד נמצא</span>;
  return (
    <span>
      <span className="font-mono">{count.toLocaleString('he-IL')}</span> אירועים נמצאו
    </span>
  );
}

export function LoopFilterBar({ filters, invalid, resultCount, loadState, onChange, onApply, onClear }: LoopFilterBarProps): JSX.Element {
  const update = (patch: Partial<LoopFilters>): void => onChange({ ...filters, ...patch });

  return (
    <section
      data-testid="loop-filters"
      aria-label="סינון אירועים"
      className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-md border border-line bg-panel px-5 py-4"
    >
      <span className="self-start text-sm font-semibold leading-5 text-text">טווח זמן</span>

      <RangeGroup label="מתאריך ושעה">
        <LoopPickerField
          kind="date"
          label="מתאריך"
          value={filters.fromDate}
          max={filters.toDate}
          invalid={invalid}
          onChange={(fromDate) => update({ fromDate })}
        />
        <LoopPickerField kind="time" label="משעה" value={filters.fromTime} invalid={invalid} onChange={(fromTime) => update({ fromTime })} />
      </RangeGroup>

      <span className="flex h-9 items-center text-text-dim" aria-hidden="true">
        —
      </span>

      <RangeGroup label="עד תאריך ושעה">
        <LoopPickerField
          kind="date"
          label="עד תאריך"
          value={filters.toDate}
          min={filters.fromDate}
          invalid={invalid}
          onChange={(toDate) => update({ toDate })}
        />
        <LoopPickerField kind="time" label="עד שעה" value={filters.toTime} invalid={invalid} onChange={(toTime) => update({ toTime })} />
      </RangeGroup>

      <form
        role="search"
        className="flex items-center gap-3 lg:ms-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) onApply();
        }}
      >
        <label className="relative flex h-9 w-[280px] items-center rounded-md border border-line-hot bg-panel-2 transition-colors focus-within:border-accent">
          <input
            type="text"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="חיפוש לפי מזהה אירוע או רחפן"
            aria-label="חיפוש לפי מזהה אירוע או רחפן"
            className="h-full w-full bg-transparent pe-9 ps-3 text-sm text-text placeholder:text-text-dim focus:outline-none"
          />
          <SearchIcon className="pointer-events-none absolute end-3 text-text-dim" />
        </label>
        <button
          type="submit"
          disabled={invalid}
          className="h-9 rounded-md bg-text px-6 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          החל סינון
        </button>
        <button type="button" onClick={onClear} className="h-9 rounded-md px-2 text-sm text-text-dim transition-colors hover:text-text">
          נקה סינון
        </button>
      </form>

      <p className="ms-auto flex h-9 items-center text-sm text-text-dim" aria-live="polite">
        <ResultCount invalid={invalid} loadState={loadState} count={resultCount} />
      </p>
    </section>
  );
}
