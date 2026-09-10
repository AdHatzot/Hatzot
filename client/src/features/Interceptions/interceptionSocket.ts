/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * The interceptions feature's handle on the core ws hub (backend/src/ws.ts):
 * one socket, reconnecting on its own, handing decoded payloads of a single
 * event name to a listener. No Leaflet and no React in here.
 */
import type { EventName } from "@/types/events";

type HubMessage = { name: EventName; payload: unknown; ts: number };

const RECONNECT_DELAY_MS = 2000;

function wsUrl(): string {
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  return `${api.replace(/\/+$/, "").replace(/^http/, "ws")}/ws`;
}

/** Subscribe to one event name. Returns an unsubscribe. */
export function subscribeInterceptionEvent(
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
      } catch (error) {
        console.error("Bad ws message", error);
      }
    };

    socket.onclose = () => {
      if (closed) return;
      retry = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    // onclose always follows onerror — the retry lives in one place, above.
    socket.onerror = () => socket?.close();
  }

  connect();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    socket?.close();
  };
}
