import { createRepository, Repository } from "../db";
import { Drone } from "../db/entities/red/drone.entity";

/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — the red shape arrives with the feed. When it does:
 *
 *   1. describe the entity in src/db/entities/red.entity.ts (extends Identifiable)
 *   2. optional seed rows in src/db/seed/red.seed.ts
 *   3. export const redRepository: Repository<YourEntity> =
 *        createRepository<YourEntity>("YourEntity", SEED);
 *
 * See repositories/blue.repository.ts for the worked example.
 */
export const droneRepository: Repository<Drone> = createRepository<Drone>(
  "Drone",
  [],
);

/** Save many drones to the repository (upsert). */
export async function saveDrones(drones: Drone[]): Promise<Drone[]> {
  return await droneRepository.saveMany(drones);
}
