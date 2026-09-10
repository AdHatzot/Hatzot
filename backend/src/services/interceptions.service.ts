/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   yes
 * @updated  2026-09-09
 *
 */

import { interceptionsRepository } from "../repositories/interceptions.repository";
import { InterceptionStatus } from "../db/entities/interception.entity";

const mockData = (drones_id: number[]) => {
  return drones_id.map((droneId) => ({
    droneId,
    liveLauncherId: 1,
    interceptorTypeId: 1,
    interceptorLongitude: 0,
    interceptorLatitude: 0,
    priority: 3,
  }));
};

export async function createInterception(drones_id: number[]): Promise<void> {
  // TODO: replace mockData(drones_id) with a real API call once the endpoint exists,
  // e.g. const interceptionData = await interceptionApiClient.fetch(drones_id);
  const interceptionData = mockData(drones_id);

  const saves = interceptionData.map((data) =>
    interceptionsRepository.save({
      liveLauncherId: data.liveLauncherId,
      interceptorTypeId: data.interceptorTypeId,
      droneId: data.droneId,
      launchedAt: new Date(),
      interceptorLongitude: data.interceptorLongitude,
      interceptorLatitude: data.interceptorLatitude,
      priority: data.priority,
      status: InterceptionStatus.PENDING,
      result: null,
    }),
  );

  await Promise.all(saves);
}
