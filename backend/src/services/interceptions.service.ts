/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   yes
 * @updated  2026-09-09
 *
 */

import { getSucessRate, interceptionsRepository } from "../repositories/interceptions.repository";
import { InterceptionStatus } from "../db/entities/interception.entity";

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
  }));
};

export async function createInterception(drones_id: number[]): Promise<any> {
  // TODO: replace mockData(drones_id) with a real API call once the endpoint exists,
  const interceptionData = mockData(drones_id);

  const saves = interceptionData.map((data) => ({
    liveLauncherId: data.liveLauncherId,
    interceptorTypeId: data.interceptorTypeId,
    droneId: data.droneId,
    launchedAt: new Date(),
    interceptorLongitude: data.interceptorLongitude,
    interceptorLatitude: data.interceptorLatitude,
    status: InterceptionStatus.PENDING,
    result: null,
  }));

  const saved = await interceptionsRepository.save(saves);
  return saved;
}

export async function getDidIntercept(InterceptionId: number): Promise<boolean> {
  const successRate = await getSucessRate(InterceptionId);

  if (successRate === null) {
    return false;
  }
  console.log("Success rate: ", successRate);
  return Math.random() * 100 < successRate;
}
