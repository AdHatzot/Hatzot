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

import { ISRAEL_CENTER } from "@/shared/geo";
import { animateInterception } from "./animateInterception";

export function mountInterceptionLayer(
  group: LayerGroup,
  _map: LeafletMap,
): void {

  const start = {
    lat: ISRAEL_CENTER[0] - 0.25,
    lng: ISRAEL_CENTER[1],
  };

  const target = {
    lat: ISRAEL_CENTER[0] + 0.25,
    lng: ISRAEL_CENTER[1],
  };

  animateInterception({
    group,

    start,

    target,

    result: "hit",

    durationMs: 1800,
  });
}