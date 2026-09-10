/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Firing interceptors at tracked drones. Each shot comes from the stocked
 * launcher line with the best success rate against the drone's type (the
 * nearest one breaks ties). It is saved IN_PROGRESS and broadcast so every
 * screen plays the flight, and it settles when the flight ends: the result is
 * saved and, on a HIT, the drone is removed from the red feed.
 */
import { broadcast } from "../ws";
import { HttpError } from "../shared/httpError";
import {
  InterceptionResult,
  InterceptionStatus,
  type Interception,
} from "../db/entities/interception.entity";
import {
  findStockedLaunchers,
  getSucessRate,
  interceptionsRepository,
  sameDroneType,
  type StockedLauncher,
} from "../repositories/interceptions.repository";
import { destroyDrone, getTrackedDrones, resolveDroneDbIds } from "./red.service";

/** How long an interceptor flies. The client animation plays for the same time. */
const FLIGHT_MS = 1800;
/** Chance to hit when an interceptor has no estimate against the drone's type. */
const DEFAULT_SUCCESS_RATE = 0.5;
const PRIORITY = 3;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** One launched interceptor — returned to the caller and broadcast to every screen. */
export interface InterceptionLaunch {
  interceptionId: number;
  /** The tracked drone's feed id. */
  droneId: string;
  /** Decided at launch; applied (saved, drone removed on HIT) when the flight ends. */
  result: "HIT" | "MISS";
  interceptor: string;
  from: GeoPoint;
  to: GeoPoint;
  durationMs: number;
}

// Drones with an interceptor in the air, so a second click does not fire twice.
const inFlight = new Set<string>();

function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function successRate(launcher: StockedLauncher, droneType: string): number {
  const entry = launcher.successRates.find((rate) => sameDroneType(rate.droneType, droneType));
  return entry?.successRate ?? DEFAULT_SUCCESS_RATE;
}

/** Best chance against this drone type first; the nearest launcher breaks ties. */
function pickLauncher(
  stock: StockedLauncher[],
  droneType: string,
  target: GeoPoint,
): { launcher: StockedLauncher; rate: number } {
  let launcher = stock[0];
  let rate = successRate(launcher, droneType);
  let distance = distanceKm(launcher, target);

  for (const candidate of stock.slice(1)) {
    const candidateRate = successRate(candidate, droneType);
    const candidateDistance = distanceKm(candidate, target);
    if (candidateRate > rate || (candidateRate === rate && candidateDistance < distance)) {
      launcher = candidate;
      rate = candidateRate;
      distance = candidateDistance;
    }
  }
  return { launcher, rate };
}

/**
 * Fire at these tracked drones (feed ids). Drones already under fire, no
 * longer in the feed, or not stored yet are skipped — the returned launches
 * are the shots actually fired.
 */
export async function interceptDrones(droneIds: string[]): Promise<InterceptionLaunch[]> {
  const targets = getTrackedDrones(droneIds.filter((id) => !inFlight.has(id)));
  if (targets.length === 0) return [];

  const stock = await findStockedLaunchers();
  if (stock.length === 0) {
    throw new HttpError(409, "No launcher has interceptors left");
  }
  const dbIds = await resolveDroneDbIds(targets.map((target) => target.id));

  // Synchronous from here to the save: the in-flight check and claim cannot
  // interleave with another request for the same drone.
  const shots = targets.flatMap((target) => {
    const droneDbId = dbIds.get(target.id);
    if (droneDbId === undefined || inFlight.has(target.id)) return [];

    const to = { latitude: target.launch_point.latitude, longitude: target.launch_point.longitude };
    const { launcher, rate } = pickLauncher(stock, target.type, to);
    inFlight.add(target.id);
    return [{ droneId: target.id, droneDbId, to, launcher, hit: Math.random() < rate }];
  });
  if (shots.length === 0) return [];

  let rows: Interception[];
  try {
    rows = await interceptionsRepository.save(
      shots.map((shot) =>
        interceptionsRepository.create({
          liveLauncherId: shot.launcher.launcherId,
          interceptorTypeId: shot.launcher.interceptorTypeId,
          droneId: shot.droneDbId,
          launchedAt: new Date(),
          interceptorLatitude: shot.to.latitude,
          interceptorLongitude: shot.to.longitude,
          priority: PRIORITY,
          status: InterceptionStatus.IN_PROGRESS,
          result: null,
        }),
      ),
    );
  } catch (error) {
    for (const shot of shots) inFlight.delete(shot.droneId);
    throw error;
  }

  const launches: InterceptionLaunch[] = shots.map((shot, index) => ({
    interceptionId: Number(rows[index].id),
    droneId: shot.droneId,
    result: shot.hit ? "HIT" : "MISS",
    interceptor: shot.launcher.interceptorName,
    from: { latitude: shot.launcher.latitude, longitude: shot.launcher.longitude },
    to: shot.to,
    durationMs: FLIGHT_MS,
  }));

  // Every screen plays the flight, not only the one that fired.
  broadcast("loop:interceptions.launched", launches);
  setTimeout(() => settle(rows, launches), FLIGHT_MS);

  return launches;
}

/** The interceptors reach their targets: drop what was hit, record every outcome. */
function settle(rows: Interception[], launches: InterceptionLaunch[]): void {
  launches.forEach((launch, index) => {
    const hit = launch.result === "HIT";
    rows[index].status = hit ? InterceptionStatus.SUCCESS : InterceptionStatus.FAILED;
    rows[index].result = hit ? InterceptionResult.HIT : InterceptionResult.MISS;
    if (hit) destroyDrone(launch.droneId);
    inFlight.delete(launch.droneId);
  });

  interceptionsRepository
    .save(rows)
    .catch((error: unknown) => console.error("Saving interception results failed:", error));
}

export async function getDidIntercept(
  InterceptionId: number,
): Promise<boolean> {
  const successRate = await getSucessRate(InterceptionId);

  if (successRate === null) {
    return false;
  }
  console.log("Success rate: ", successRate);
  return Math.random() * 100 < successRate;
}
