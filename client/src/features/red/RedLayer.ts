/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Drone markers are driven entirely by the ws feed. Every backend pull of the
 * external API (2s) pushes `red:drones.updated` carrying that pull only — the
 * layer mirrors it exactly, so the map shows the drones currently being
 * tracked, never the DB's full history.
 */
import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";
import { cssVar } from "@/shared/theme";
import { subscribeRedEvent } from "./redSocket";

/** Mirror of RedDroneTick in backend/src/services/red.service.ts. */
export type RedDroneTick = {
  id: number;
  droneId: string;
  type: string;
  heading: number;
  latitude: number;
  longitude: number;
  timestamp: string;
};

const droneMarkers = new Map<string, L.CircleMarker>();

let pendingTick: RedDroneTick[] | null = null;
let frame: number | null = null;

export function mountRedLayer(group: LayerGroup, _map: LeafletMap): void {
  subscribeRedEvent("red:drones.updated", (payload) => {
    queueTick(group, payload as RedDroneTick[]);
  });
}

/**
 * Positions never go through React state (hard rule 5) — the newest tick wins
 * and is written straight onto the Leaflet layer inside requestAnimationFrame.
 */
function queueTick(group: LayerGroup, drones: RedDroneTick[]): void {
  pendingTick = drones;
  if (frame !== null) return;

  frame = requestAnimationFrame(() => {
    frame = null;
    const batch = pendingTick;
    pendingTick = null;
    if (batch) renderTick(group, batch);
  });
}

function renderTick(group: LayerGroup, drones: RedDroneTick[]): void {
  const colour = cssVar("--team-red");
  const currentIds = new Set(drones.map((d) => d.droneId));

  // Anything this pull did not return is no longer tracked — drop it.
  for (const [droneId, marker] of droneMarkers) {
    if (!currentIds.has(droneId)) {
      group.removeLayer(marker);
      droneMarkers.delete(droneId);
    }
  }

  for (const drone of drones) {
    const { latitude, longitude } = drone;
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) continue;

    const existing = droneMarkers.get(drone.droneId);
    if (existing) {
      existing.setLatLng([latitude, longitude]);
    } else {
      const marker = L.circleMarker([latitude, longitude], {
        radius: 7,
        color: colour,
        fillColor: colour,
        fillOpacity: 0.85,
        weight: 2,
      })
        .bindTooltip(`רחפן ${drone.droneId}`, { direction: "top" })
        .addTo(group);
      droneMarkers.set(drone.droneId, marker);
    }
  }
}
