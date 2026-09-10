/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — the logistics shape arrives with the feed. When it does:
 *
 *   1. describe the entity in src/db/entities/logistics.entity.ts (extends Identifiable)
 *   2. optional seed rows in src/db/seed/logistics.seed.ts
 *   3. export const logisticsRepository: Repository<YourEntity> =
 *        createRepository<YourEntity>("YourEntity", SEED);
 *
 * See repositories/blue.repository.ts for the worked example.
 */

// import { createRepository, type Repository } from "../db";
import { Deployment } from "../db/entities/deployment.entity";
import { LiveLauncher } from "../db/entities/liveLauncher.entity";
import { dataSource } from "../db/data-source";

export const logisticsDeploymentRepository = dataSource.getRepository(Deployment);
export const logisticsLiveLauncherRepository = dataSource.getRepository(LiveLauncher);