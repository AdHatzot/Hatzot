/**
 * @team     interceptions
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-10
 */

import type {
  LayerGroup,
  Map as LeafletMap,
} from "leaflet";

import { animateInterception } from "./animateInterception";
import type { Interception } from "@/types/interceptions";

// Derive WS URL from the existing VITE_API_URL env var (declared in vite-env.d.ts).
// e.g. "http://localhost:3000" → "ws://localhost:3000/ws"
const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, "ws") + "/ws"
  : `ws://${window.location.hostname}:3000/ws`;

export function mountInterceptionLayer(
  group: LayerGroup,
  _map: LeafletMap,
): void {
  const socket = new WebSocket(WS_URL);

  socket.addEventListener("message", (event: MessageEvent<string>) => {
    try {
      const msg = JSON.parse(event.data) as { name: string; payload: unknown };

      if (msg.name !== "loop:interception.fired") return;

      const interception = msg.payload as Interception;

      animateInterception({
        group,
        start: interception.start,
        target: interception.target,
        result: interception.result,
        durationMs: interception.durationMs,
      });
    } catch {
      // ignore malformed messages
    }
  });
}