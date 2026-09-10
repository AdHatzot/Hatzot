/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-09
 *
 */
import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";
import axios from "axios";
import { type Drone } from "@/types";
import { cssVar } from "@/shared/theme";

const droneMarkers = new Map<number, L.CircleMarker>();

export function mountRedLayer(group: LayerGroup, _map: LeafletMap): void {
  const DRONES_FETCH_TIMER = 2 * 1000; // 2 seconds converted to millies

  fetchAndUpdateDrones(group);

  setInterval(() => {
    fetchAndUpdateDrones(group);
  }, DRONES_FETCH_TIMER);
}

async function fetchAndUpdateDrones(group: LayerGroup): Promise<void> {
  try {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL;
    const response = await axios.get<Drone[]>(`${SERVER_URL}/api/red/drones`);

    console.log(response);

    const drones = response.data;
    const colour = cssVar("--team-red");

    // Track which IDs we saw in this fetch
    const currentIds = new Set(drones.map((d) => d.id));

    for (const [id, marker] of droneMarkers) {
      if (!currentIds.has(id)) {
        group.removeLayer(marker);
        droneMarkers.delete(id);
      }
    }

    for (const drone of drones) {
      const { latitude, longitude } = drone.position;

      if (droneMarkers.has(drone.id)) {
        droneMarkers.get(drone.id)!.setLatLng([latitude, longitude]);
      } else {
        const marker = L.circleMarker([latitude, longitude], {
          radius: 7,
          color: colour,
          fillColor: colour,
          fillOpacity: 0.85,
          weight: 2,
        })
          .bindTooltip(`רחפן #${drone.id}`, { direction: "top" })
          .addTo(group);
        droneMarkers.set(drone.id, marker);
      }
    }
  } catch (err) {
    console.error("Failed to fetch drones", err);
  }
}
