/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-08
 *
 * Israel's map envelope. Read-only for every team — the map and any feature
 * that needs a default position import from here instead of hardcoding.
 */
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

export const ISRAEL_CENTER: LatLngTuple = [31.4, 35.0];

export const ISRAEL_ZOOM = 8;

export const ISRAEL_BOUNDS: LatLngBoundsExpression = [
  [29.3, 33.9],
  [33.4, 36.0],
];
