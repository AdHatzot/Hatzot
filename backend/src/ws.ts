/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-09
 */
import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { EventName } from "./types";

let wss: WebSocketServer | null = null;

export function attachHub(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });
}

export function broadcast(name: EventName, payload: unknown): void {
  if (!wss) return;
  const data = JSON.stringify({ name, payload, ts: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  }
}
