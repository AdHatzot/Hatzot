/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * REST access to interception events. Real-time updates come from
 * socket.ts — this file only covers the initial snapshot.
 * Routes mounted at /api/loop by src/index.ts (see loop.routes.ts on
 * the backend) — NOT /api/interceptions, which was an earlier, wrong
 * guess before the real routing convention was confirmed.
 */
import type { InterceptionEvent } from './types';

const BASE_URL = '/api/loop';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Events that have not reached SUCCESS/FAILED/ABORTED yet. */
export function fetchActiveInterceptions(): Promise<InterceptionEvent[]> {
  return getJson<InterceptionEvent[]>(`${BASE_URL}/active`);
}

/** Events that are SUCCESS, FAILED, or ABORTED (see types.ts re: closed). */
export function fetchClosedInterceptions(): Promise<InterceptionEvent[]> {
  return getJson<InterceptionEvent[]>(`${BASE_URL}/closed`);
}

/** All events (active and closed). */
export function fetchAllInterceptions(): Promise<InterceptionEvent[]> {
  return getJson<InterceptionEvent[]>(`${BASE_URL}/all`);
}

export function fetchInterceptionById(id: string): Promise<InterceptionEvent> {
  return getJson<InterceptionEvent>(`${BASE_URL}/${id}`);
}