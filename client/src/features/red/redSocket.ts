/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-10
 *
 * The team's handle on the core ws hub (backend/src/ws.ts). One socket for the
 * red feature, reconnecting on its own, handing decoded `red:*` payloads to a
 * listener. No Leaflet and no React in here.
 */
import type { EventName } from "@/types/events";

type HubMessage = { name: EventName; payload: unknown; ts: number };

const RECONNECT_DELAY = 2 * 1000;

function wsUrl(): string {
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  return `${api.replace(/^http/, "ws")}/ws`;
}

/**
 * Subscribe to one event name. Returns an unsubscribe that closes the socket
 * and stops the reconnect loop.
 */
export function subscribeRedEvent(
  name: EventName,
  onPayload: (payload: unknown) => void,
): () => void {
  let socket: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect(): void {
    if (closed) return;

    socket = new WebSocket(wsUrl());

    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const message = JSON.parse(event.data) as HubMessage;
        if (message.name === name) onPayload(message.payload);
      } catch (err) {
        console.error("Bad ws message", err);
      }
    };

    socket.onclose = () => {
      if (closed) return;
      retry = setTimeout(connect, RECONNECT_DELAY);
    };

    // onclose always follows onerror — let the one path above do the retry.
    socket.onerror = () => socket?.close();
  }

  connect();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    socket?.close();
  };
}
