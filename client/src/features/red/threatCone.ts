/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-10
 *
 * The wedge of ground a drone threatens, opening along its heading. Range is a
 * real distance rather than a pixel size, so the wedge grows and shrinks with
 * the zoom the way the rest of the map does.
 */
import type { LatLngTuple } from "leaflet";

const EARTH_RADIUS_KM = 6371;

const RANGE_KM = 15;
const SPREAD_DEG = 60;
const ARC_STEPS = 8;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Great-circle offset — bearing is compass degrees, 0 = north, clockwise. */
function destination(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number,
): LatLngTuple {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [toDeg(lat2), ((toDeg(lng2) + 540) % 360) - 180];
}

/** Apex at the drone, then the far arc — a closed sector for L.polygon. */
export function coneLatLngs(
  lat: number,
  lng: number,
  headingDeg: number,
): LatLngTuple[] {
  const from = headingDeg - SPREAD_DEG / 2;
  const ring: LatLngTuple[] = [[lat, lng]];

  for (let step = 0; step <= ARC_STEPS; step += 1) {
    const bearing = from + (SPREAD_DEG * step) / ARC_STEPS;
    ring.push(destination(lat, lng, bearing, RANGE_KM));
  }

  return ring;
}
