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
  const interceptionData = mockData(drones_id);

  const saves: Partial<Interception>[] = interceptionData.map((data) => ({
    liveLauncherId: data.liveLauncherId,
    interceptorTypeId: data.interceptorTypeId,
    droneId: data.droneId,
    launchedAt: new Date(),
    interceptorLongitude: data.interceptorLongitude,
    interceptorLatitude: data.interceptorLatitude,
    status: InterceptionStatus.PENDING,
    priority: data.priority,
    result: null,
  }));

  const saved = await interceptionsRepository.save(saves);

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
