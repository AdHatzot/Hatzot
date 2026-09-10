/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — the loop shape arrives with the feed. When it does:
 *
 *   1. describe the entity in src/db/entities/loop.entity.ts (extends Identifiable)
 *   2. optional seed rows in src/db/seed/loop.seed.ts
 *   3. export const loopRepository: Repository<YourEntity> =
 *        createRepository<YourEntity>("YourEntity", SEED);
 *
 * See repositories/blue.repository.ts for the worked example.
 */
import { dataSource } from "../db/data-source";
import { Interception } from "../db/entities/interception.entity";

export const interceptionsRepository = dataSource.getRepository(Interception);

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
        (r) => r.droneType.toLowerCase() === droneType.name.toLowerCase(),
    );

    return entry ? entry.successRate * 100 : null;
}