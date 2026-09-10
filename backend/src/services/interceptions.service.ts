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

  // TODO: medium-check if an active interception exists for the given drone_id and the result isnt final yet (if it is and you have a MISS then lanch again)
  const interceptionData = mockData(drones_id);

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

  // TODO: after the animation remove from the DB connected to the project 1 of the spesific missles we used from the lancher we used
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
  // TODO: delete drone using the red team function that deletes it incase of HIT only - incase of miss just finish the opeation without removing the drone

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
