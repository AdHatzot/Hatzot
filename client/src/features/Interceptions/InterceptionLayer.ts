/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Plays every interceptor launch, whichever screen fired it: the backend
 * broadcasts `loop:interceptions.launched`, and each launch flies from its
 * launcher to the drone and ends in a hit explosion or a miss.
 */
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { animateInterception, INTERCEPTIONS_PANE } from "./animateInterception";
import { subscribeInterceptionEvent } from "./interceptionSocket";
import type { InterceptionLaunch } from "./types";

export function mountInterceptionLayer(group: LayerGroup, map: LeafletMap): void {
  // Flights draw above the drone markers (markerPane 600) and below tooltips (650).
  if (!map.getPane(INTERCEPTIONS_PANE)) {
    const pane = map.createPane(INTERCEPTIONS_PANE);
    pane.style.zIndex = "640";
    pane.style.pointerEvents = "none";
  }

  subscribeInterceptionEvent("loop:interceptions.launched", (payload) => {
    for (const launch of payload as InterceptionLaunch[]) {
      animateInterception({
        group,
        map,
        start: { lat: launch.from.latitude, lng: launch.from.longitude },
        target: { lat: launch.to.latitude, lng: launch.to.longitude },
        result: launch.result === "HIT" ? "hit" : "miss",
        durationMs: launch.durationMs,
      });
    }
  });
}
