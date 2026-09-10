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
import { droneIcon } from "./droneIcons";
import { coneLatLngs } from "./threatCone";
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

const droneMarkers = new Map<string, L.Marker>();
const droneCones = new Map<string, L.Polygon>();

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
  // Leaflet writes this into SVG attributes, where var() does not resolve.
  const colour = cssVar("--team-red");
  const currentIds = new Set(drones.map((d) => d.droneId));

  // Anything this pull did not return is no longer tracked — drop it.
  for (const [droneId, marker] of droneMarkers) {
    if (!currentIds.has(droneId)) {
      group.removeLayer(marker);
      droneMarkers.delete(droneId);

      const cone = droneCones.get(droneId);
      if (cone) {
        group.removeLayer(cone);
        droneCones.delete(droneId);
      }
    }
  }

  for (const drone of drones) {
    const { latitude, longitude } = drone;
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) continue;

    // Drawn before the marker so the wedge sits under its drone.
    const ring = coneLatLngs(latitude, longitude, drone.heading);
    const cone = droneCones.get(drone.droneId);
    if (cone) {
      cone.setLatLngs(ring);
    } else {
      const shape = L.polygon(ring, {
        color: colour,
        fillColor: colour,
        fillOpacity: 0.22,
        weight: 1,
        opacity: 0.5,
        interactive: false,
      }).addTo(group);
      droneCones.set(drone.droneId, shape);
    }

    const existing = droneMarkers.get(drone.droneId);
    if (existing) {
      existing.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: droneIcon(drone.type),
      })
        .bindTooltip(`רחפן ${drone.droneId}`, { direction: "top" })
        .addTo(group);
      droneMarkers.set(drone.droneId, marker);
    }
  }
}
