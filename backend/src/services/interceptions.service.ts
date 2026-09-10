/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   yes
 * @updated  2026-09-09
 *
 */

import {
  getSucessRate,
  interceptionsRepository,
} from "../repositories/interceptions.repository";
import {
  Interception,
  InterceptionResult,
  InterceptionStatus,
} from "../db/entities/interception.entity";
import { fireIntercept } from "../services/logistics.service";
import { droneRepository } from "../repositories/red/drone.repository";
import { logisticsLiveLauncherRepository } from "../repositories/logistics.repository";
import { broadcast } from "../ws";

// TODO: Un-comment once external API endpoint is available
// async function fetchInterceptionData(drones_id: number[]) {
//   const response = await fetch("", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ drones_id }),
//   });
//   return response.json();
// }

const mockData = (drones_id: number[]) => {
  return drones_id.map((droneId) => ({
    droneId,
    liveLauncherId: 1,
    interceptorTypeId: 1,
    interceptorLongitude: 0,
    interceptorLatitude: 0,
    priority: 3,
    timeOfImpact: "2026-09-10T13:30:00Z",
  }));
};

export async function createInterception(
  drones_id: number[],
): Promise<Interception[]> {
  // TODO: replace mockData(drones_id) with a real API call once the endpoint exists,

  // Filter out drones that already have an active IN_PROGRESS interception.
  // Exception: if the last interception for a drone resulted in MISS, we re-launch.
  const eligibleDroneIds = await Promise.all(
    drones_id.map(async (droneId) => {
      const latest = await interceptionsRepository.findOne({
        where: { droneId },
        order: { launchedAt: "DESC" },
      });

      if (!latest) return droneId; // no prior interception — always eligible
      if (latest.status === InterceptionStatus.IN_PROGRESS) return null; // skip — already being intercepted
      return null; // HIT, MISS, or ABORTED — skip
    }),
  );

  const filteredDroneIds = eligibleDroneIds.filter((id): id is number => id !== null);
  if (filteredDroneIds.length === 0) return [];

  const interceptionData = mockData(filteredDroneIds);

  const saves: Partial<Interception>[] = interceptionData.map((data) => ({
    liveLauncherId: data.liveLauncherId,
    interceptorTypeId: data.interceptorTypeId,
    droneId: data.droneId,
    launchedAt: new Date(),
    interceptorLongitude: data.interceptorLongitude,
    interceptorLatitude: data.interceptorLatitude,
    status: InterceptionStatus.IN_PROGRESS,
    priority: data.priority,
    result: null,
  }));

  const saved = await interceptionsRepository.save(saves);
  /**
   *  TODO: Used this frontend function with a default darution of 2000ms and the start point which is the lancher and the end point which is the drone it self to animate it wait 2 secs and end opertion.
   * animateInterception({
    group,

    start,

    target,

    result: "hit",

    durationMs: 1800,
  });*/

  // Decrement 1 missile from the launcher that fired each interceptor.
  await Promise.all(
    saved.map(async (interception) => {
      try {
        await fireIntercept({
          launcherId: interception.liveLauncherId,
          interceptorTypeId: interception.interceptorTypeId,
        });
      } catch (err) {
        console.warn(
          `Could not decrement ammo for launcher ${interception.liveLauncherId}:`,
          err,
        );
      }
    }),
  );

  const updated = await Promise.all(
    saved.map(async (interception) => {
      const didIntercept = await getDidIntercept(interception.id);
      interception.status = didIntercept
        ? InterceptionStatus.SUCCESS
        : InterceptionStatus.FAILED;
      interception.result = didIntercept
        ? InterceptionResult.HIT
        : InterceptionResult.MISS;
      return interception;
    }),
  );

  // Delete the drone from the red-team DB on HIT; leave it in place on MISS.
  // Also broadcast a WS event so the frontend can run the animation.
  await Promise.all(
    updated.map(async (interception) => {
      if (interception.result === InterceptionResult.HIT) {
        try {
          await droneRepository.delete({ droneId: String(interception.droneId) });
        } catch (err) {
          console.warn(`Could not delete drone ${interception.droneId} after HIT:`, err);
        }
      }

      // Fetch launcher coords for the animation start point.
      try {
        const launcher = await logisticsLiveLauncherRepository.findOne({
          where: { id: String(interception.liveLauncherId) },
        });

        const drone = await droneRepository.findOne({
          where: { droneId: String(interception.droneId) },
          relations: { position: true },
        });

        broadcast("loop:interception.fired", {
          id: interception.id,
          start: {
            lat: launcher?.latitude ?? interception.interceptorLatitude ?? 0,
            lng: launcher?.longitude ?? interception.interceptorLongitude ?? 0,
          },
          target: {
            lat: drone?.position ? Number(drone.position.latitude) : 0,
            lng: drone?.position ? Number(drone.position.longitude) : 0,
          },
          result: interception.result === InterceptionResult.HIT ? "hit" : "miss",
          durationMs: 2000,
        });
      } catch (err) {
        console.warn(`Could not broadcast interception ${interception.id}:`, err);
      }
    }),
  );

  return await interceptionsRepository.save(updated);
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
