/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";
import { ISRAEL_CENTER } from "@/shared/geo";
import { cssVar } from "@/shared/theme";

export function mountRedLayer(group: LayerGroup, _map: LeafletMap): void {
  const colour = cssVar("--team-red");
  L.circleMarker([ISRAEL_CENTER[0] + 0.25, ISRAEL_CENTER[1]], {
    radius: 7,
    color: colour,
    fillColor: colour,
    fillOpacity: 0.85,
    weight: 2,
  })
    .bindTooltip("צד אדום — נקודת בדיקה", { direction: "top" })
    .addTo(group);
}
