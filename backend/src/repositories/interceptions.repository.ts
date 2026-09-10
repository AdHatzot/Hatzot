/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Interception rows, and the stocked launcher lines an interceptor can be
 * fired from.
 */
import { MoreThan } from "typeorm";
import { dataSource } from "../db/data-source";
import { Interception } from "../db/entities/interception.entity";
import type { EstimatedSuccessRate } from "../db/entities/interceptorType.entity";
import { LauncherAmmunition } from "../db/entities/launcherAmmunition.entity";

export const interceptionsRepository = dataSource.getRepository(Interception);

/**
 * Drone type names differ in spelling between the feed ("Falcon-Long X4") and
 * the success-rate table ("Falcon Long X4") — compare letters and digits only.
 */
export function sameDroneType(a: string, b: string): boolean {
  const key = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return key(a) === key(b);
}

/** A launcher line with interceptors left: where it stands and how well it hits. */
export interface StockedLauncher {
  launcherId: number;
  interceptorTypeId: number;
  interceptorName: string;
  latitude: number;
  longitude: number;
  successRates: EstimatedSuccessRate[];
}

/**
 * Every (launcher, interceptor type) pair with stock and a known position.
 * An interception row must reference one of these pairs (its composite FK
 * points into launcher_ammunition), so they are the only places a shot can
 * come from.
 */
export async function findStockedLaunchers(): Promise<StockedLauncher[]> {
  const rows = await dataSource.getRepository(LauncherAmmunition).find({
    where: { quantity: MoreThan(0) },
    relations: { launcher: true, interceptorType: true },
  });

  return rows
    .filter((row) => row.launcher?.latitude != null && row.launcher?.longitude != null)
    .map((row) => ({
      launcherId: Number(row.launcherId),
      interceptorTypeId: row.interceptorTypeId,
      interceptorName: row.interceptorType?.name ?? "",
      latitude: row.launcher.latitude,
      longitude: row.launcher.longitude,
      successRates: row.interceptorType?.estimatedSuccessRate ?? [],
    }));
}

/**
 * Estimated accuracy (%) for a given interception, sourced from
 * interceptor_type.estimated_success_rate (jsonb array of
 * { droneType, successRate } entries), matched against the drone type
 * that was actually targeted in this interception.
 *
 * Relies on the interceptorType / drone / drone.droneType relations
 * declared on the entities.
 *
 * Returns null if there's no rate entry for the targeted drone type.
 * Throws if the interception itself doesn't exist.
 */
export async function getSucessRate(InterceptionId: number): Promise<number | null> {
    const interception = await interceptionsRepository
        .createQueryBuilder("Interception")
        .leftJoinAndSelect("Interception.interceptorType", "interceptorType")
        .leftJoinAndSelect("Interception.drone", "drone")
        .leftJoinAndSelect("drone.droneType", "droneType")
        .where("Interception.id = :id", { id: InterceptionId })
        .getOne();

    if (!interception) {
        throw new Error(`Interception with id ${InterceptionId} not found`);
    }

    const interceptorType = interception.interceptorType;
    const droneType = interception.drone?.droneType;

    if (!interceptorType || !droneType) {
        return null;
    }

    const entry = interceptorType.estimatedSuccessRate?.find(
        (r) => sameDroneType(r.droneType, droneType.name),
    );

    return entry ? entry.successRate * 100 : null;
}
