/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * How an interception is named and printed — shared by the table, the map,
 * the search box and the CSV export so all four agree.
 */
import type { GeoPoint, InterceptionLogEntry } from './types';

const pad = (value: number): string => String(value).padStart(2, '0');

/** EVT-2026-0841 */
export function eventCode(event: InterceptionLogEntry): string {
  return `EVT-${new Date(event.launchedAt).getFullYear()}-${event.id.padStart(4, '0')}`;
}

/** רחפן-041 */
export function droneCode(event: InterceptionLogEntry): string {
  return `רחפן-${event.drone.id.padStart(3, '0')}`;
}

/** מיירט-17 — the live launcher that fired. */
export function interceptorCode(event: InterceptionLogEntry): string {
  return `מיירט-${event.launcher.id.padStart(2, '0')}`;
}

/** 14:32:18, local time. */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** 09.09.2026, local time. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** 32.0853, 34.7818 — render inside dir="ltr", or bidi reorders the pair. */
export function formatPoint(point: GeoPoint | null): string {
  return point ? `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}` : '—';
}

const normalise = (value: string): string => value.toLowerCase().replace(/[\s_-]/g, '');

/** Case-, space- and hyphen-insensitive: "0841", "evt 2026 0841" and "רחפן-041" all match. */
export function matchesQuery(event: InterceptionLogEntry, query: string): boolean {
  const needle = normalise(query);
  if (needle === '') return true;

  return [
    eventCode(event),
    droneCode(event),
    interceptorCode(event),
    event.launcher.type ?? '',
    event.interceptor.type ?? '',
    event.drone.type ?? '',
  ].some((value) => normalise(value).includes(needle));
}

/** Oldest first; ties broken by id so the order is stable across refreshes. */
export function compareByLaunch(a: InterceptionLogEntry, b: InterceptionLogEntry): number {
  const byTime = Date.parse(a.launchedAt) - Date.parse(b.launchedAt);
  return byTime !== 0 ? byTime : Number(a.id) - Number(b.id);
}
