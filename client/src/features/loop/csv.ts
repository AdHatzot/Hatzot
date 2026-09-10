/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * "ייצוא CSV" — every row matching the current filters, not just the page on
 * screen. UTF-8 with a BOM so Excel opens the Hebrew correctly.
 */
import { droneCode, eventCode, formatClock, formatDay, interceptorCode } from './format';
import type { LoopFilters } from './filters';
import { resultLabel, statusLabel } from './status';
import type { GeoPoint, InterceptionLogEntry } from './types';

type Cell = string | number | null;

const HEADERS: readonly Cell[] = [
  'מזהה אירוע',
  'תאריך שיגור',
  'שעת שיגור',
  'מערכת יירוט',
  'מיירט',
  'סוג מיירט',
  'מזהה רחפן',
  'סוג רחפן',
  'קו רוחב יירוט',
  'קו אורך יירוט',
  'סטטוס יירוט',
  'תוצאת היירוט',
  'עדיפות',
];

function coordinate(point: GeoPoint | null, axis: keyof GeoPoint): number | null {
  return point ? Number(point[axis].toFixed(6)) : null;
}

function toCells(event: InterceptionLogEntry): Cell[] {
  return [
    eventCode(event),
    formatDay(event.launchedAt),
    formatClock(event.launchedAt),
    event.launcher.type,
    interceptorCode(event),
    event.interceptor.type,
    droneCode(event),
    event.drone.type,
    coordinate(event.interceptPoint, 'latitude'),
    coordinate(event.interceptPoint, 'longitude'),
    statusLabel(event).text,
    resultLabel(event).text,
    event.priority,
  ];
}

function encode(value: Cell): string {
  if (value === null) return '';
  // Text that opens with = + - @ would run as a formula in a spreadsheet.
  const text = typeof value === 'number' ? String(value) : value.replace(/^[=+\-@\t\r]/, "'$&");
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadInterceptionCsv(events: readonly InterceptionLogEntry[], filters: LoopFilters): void {
  const lines = [HEADERS, ...events.map(toCells)].map((cells) => cells.map(encode).join(','));
  const byteOrderMark = String.fromCharCode(0xfeff);
  const blob = new Blob([byteOrderMark, lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `interception-log_${filters.fromDate}_${filters.toDate}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
