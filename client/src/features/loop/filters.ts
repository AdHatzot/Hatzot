/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * The filter bar's state. Dates and times are kept as native
 * <input type="date|time"> value strings and read in the operator's local
 * time zone.
 */
import type { TimeRange } from './types';

export interface LoopFilters {
  /** yyyy-mm-dd */
  fromDate: string;
  /** HH:MM:SS */
  fromTime: string;
  toDate: string;
  toTime: string;
  query: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Yesterday 00:00:00 to today 23:59:59. */
export function defaultFilters(now: Date = new Date()): LoopFilters {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return { fromDate: isoDate(yesterday), fromTime: '00:00:00', toDate: isoDate(now), toTime: '23:59:59', query: '' };
}

function toLocalDate(date: string, time: string): Date | null {
  const [year, month, day] = date.split('-').map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number);
  if (!year || !month || !day || [hours, minutes, seconds].some(Number.isNaN)) return null;

  const result = new Date(year, month - 1, day, hours, minutes, seconds);
  return Number.isNaN(result.getTime()) ? null : result;
}

/**
 * The range the filters describe, or null when a field is unreadable or the
 * range runs backwards. The end is inclusive: 23:59:59 covers 23:59:59.999.
 */
export function filtersRange(filters: LoopFilters): TimeRange | null {
  const from = toLocalDate(filters.fromDate, filters.fromTime);
  const toSecond = toLocalDate(filters.toDate, filters.toTime);
  if (!from || !toSecond) return null;

  const to = new Date(toSecond.getTime() + 999);
  return from <= to ? { from, to } : null;
}

/** yyyy-mm-dd → dd.mm.yyyy */
export function displayDate(value: string): string {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}.${month}.${year}` : '—';
}

/** HH:MM or HH:MM:SS → HH:MM:SS */
export function displayTime(value: string): string {
  const [hours = '', minutes = '', seconds = ''] = value.split(':');
  return [hours, minutes, seconds].map((part) => part.padStart(2, '0')).join(':');
}
