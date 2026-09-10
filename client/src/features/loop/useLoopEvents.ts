/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Loads the interception log for a time range and refreshes it quietly while
 * the tab is visible, so new interceptions appear without a reload. A failed
 * background refresh keeps the rows already on screen.
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchInterceptionLog } from './api';
import type { InterceptionLogEntry, TimeRange } from './types';

const REFRESH_MS = 15_000;

export type LoopLoadState = 'loading' | 'ready' | 'error';

interface LoopEventsSnapshot {
  events: InterceptionLogEntry[];
  truncated: boolean;
  state: LoopLoadState;
}

export interface LoopEvents extends LoopEventsSnapshot {
  retry: () => void;
}

export function useLoopEvents(range: TimeRange | null): LoopEvents {
  const [snapshot, setSnapshot] = useState<LoopEventsSnapshot>({ events: [], truncated: false, state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // Primitive deps: a new Date object for the same instant must not refetch.
  const fromMs = range?.from.getTime() ?? null;
  const toMs = range?.to.getTime() ?? null;

  useEffect(() => {
    if (fromMs === null || toMs === null) {
      setSnapshot({ events: [], truncated: false, state: 'ready' });
      return;
    }

    let controller: AbortController | null = null;
    let disposed = false;

    const load = async (initial: boolean): Promise<void> => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      if (initial) setSnapshot((previous) => ({ ...previous, state: 'loading' }));

      try {
        const log = await fetchInterceptionLog({ from: new Date(fromMs), to: new Date(toMs) }, current.signal);
        if (!disposed) setSnapshot({ events: log.events, truncated: log.truncated, state: 'ready' });
      } catch (error) {
        if (disposed || current.signal.aborted) return;
        console.error('loop: failed to load the interception log', error);
        if (initial) setSnapshot({ events: [], truncated: false, state: 'error' });
      }
    };

    void load(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(false);
    }, REFRESH_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, [fromMs, toMs, attempt]);

  const retry = useCallback((): void => setAttempt((value) => value + 1), []);

  return { ...snapshot, retry };
}
