/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Single shared WebSocket connection for interception-event updates,
 * so the active and closed screens don't each open their own socket.
 * Reconnects with backoff; consumers just subscribe/unsubscribe.
 *
 * NOT YET VERIFIED against the real backend ../ws module (client-side
 * counterpart was never supplied in this conversation) — assumes a
 * single shared socket at /ws carrying {event, payload} envelopes,
 * matching the broadcast(event, payload) calls used in loop.service.ts
 * and blue.service.ts on the backend. Confirm this against the actual
 * ../ws implementation before relying on it; it may need reshaping to
 * match e.g. a Socket.IO-style API or a per-team socket instead.
 */
import type { InterceptionEvent } from './types';

export interface InterceptionSocketMessage {
  event: 'loop:interception.created' | 'loop:interception.updated';
  payload: InterceptionEvent;
}

type Listener = (message: InterceptionSocketMessage) => void;

const WS_URL = `${window.location.origin.replace(/^http/, 'ws')}/ws`;
const RECONNECT_DELAY_MS = 2000;

let socket: WebSocket | null = null;
const listeners = new Set<Listener>();

function connect(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      const message = JSON.parse(event.data) as { event: string; payload: unknown };
      if (!message.event.startsWith('loop:')) return; // other teams share this socket
      listeners.forEach((listener) => listener(message as InterceptionSocketMessage));
    } catch {
      // Malformed frame — ignore rather than crash the ops screen.
    }
  };

  socket.onclose = () => {
    socket = null;
    if (listeners.size > 0) {
      setTimeout(connect, RECONNECT_DELAY_MS);
    }
  };

  socket.onerror = () => {
    socket?.close();
  };
}

/** Subscribe to live interception updates. Returns an unsubscribe function. */
export function subscribeToInterceptionUpdates(listener: Listener): () => void {
  listeners.add(listener);
  connect();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      socket?.close();
      socket = null;
    }
  };
}