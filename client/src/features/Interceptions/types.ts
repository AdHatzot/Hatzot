/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Wire shape of one launched interceptor — POST /api/interceptions returns
 * these, and `loop:interceptions.launched` broadcasts them to every screen.
 * Mirrors InterceptionLaunch in backend/src/services/interceptions.service.ts.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface InterceptionLaunch {
  interceptionId: number;
  /** The tracked drone's feed id (the same `droneId` the red ticks carry). */
  droneId: string;
  /** Decided at launch; the drone leaves the feed on HIT once the flight ends. */
  result: "HIT" | "MISS";
  interceptor: string;
  /** The launcher that fired. */
  from: GeoPoint;
  /** Where the drone was when the interceptor launched. */
  to: GeoPoint;
  durationMs: number;
}
