/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 */
import type { InterceptionLog, TimeRange } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export async function fetchInterceptionLog(range: TimeRange, signal: AbortSignal): Promise<InterceptionLog> {
  const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
  const response = await fetch(`${API_URL}/api/loop/interceptions?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`GET /api/loop/interceptions failed with ${response.status}`);
  }
  return (await response.json()) as InterceptionLog;
}
