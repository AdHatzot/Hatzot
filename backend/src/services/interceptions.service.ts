/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   yes
 * @updated  2026-09-09
 *
 */

export enum InterceptionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  ABORTED = "ABORTED",
}

export enum InterceptionResult {
  HIT = "HIT",
  MISS = "MISS",
}

// priority: smallint enum, values 1-5 — numeric, so a plain enum works well here
export enum InterceptionPriority {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export interface Interception {
  id: number; // bigint
  liveLauncherId: number; // FK -> bigint
  interceptorTypeId: number; // FK -> smallint
  droneId: number; // FK -> bigint
  launchedAt: Date; // timestamptz
  interceptorLongitude: number; // double
  interceptorLatitude: number; // double
  priority: InterceptionPriority; // smallint enum, 1-5
  status: InterceptionStatus; // enum
  result: InterceptionResult; // enum
}

export async function createInterception(drones_id: number[]) {
  return drones_id;
}
