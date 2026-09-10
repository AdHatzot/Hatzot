/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Loads the initial snapshot for a scope (active/closed) and keeps it
 * live via the shared WebSocket — no manual refresh, and an event that
 * closes moves itself out of "active" and into "closed" automatically.
 */
import { useEffect, useState, useCallback } from 'react';
import { fetchActiveInterceptions, fetchClosedInterceptions, fetchAllInterceptions } from './api';
import { subscribeToInterceptionUpdates } from './socket';
import { isClosed, type InterceptionEvent } from './types';

export type EventsScope = 'all' | 'active' | 'closed';

interface UseInterceptionEventsResult {
  events: InterceptionEvent[];
  isLoading: boolean;
  error: Error | null;
}

function belongsToScope(event: InterceptionEvent, scope: EventsScope): boolean {
  if (scope === 'all') return true;
  return scope === 'closed' ? isClosed(event) : !isClosed(event);
}

function upsert(list: InterceptionEvent[], updated: InterceptionEvent): InterceptionEvent[] {
  const index = list.findIndex((event) => event.id === updated.id);
  if (index === -1) {
    return [updated, ...list];
  }
  const next = [...list];
  next[index] = updated;
  return next;
}

function remove(list: InterceptionEvent[], id: string): InterceptionEvent[] {
  return list.filter((event) => event.id !== id);
}

export function useInterceptionEvents(scope: EventsScope): UseInterceptionEventsResult {
  const [events, setEvents] = useState<InterceptionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: InterceptionEvent[];
      if (scope === 'active') {
        data = await fetchActiveInterceptions();
      } else if (scope === 'closed') {
        data = await fetchClosedInterceptions();
      } else {
        data = await fetchAllInterceptions();
      }
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load interception events'));
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeToInterceptionUpdates((message) => {
      const event = message.payload;
      setEvents((current) =>
        belongsToScope(event, scope) ? upsert(current, event) : remove(current, event.id),
      );
    });
  }, [scope]);

  return { events, isLoading, error };
}