/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — the interceptions shape arrives with the feed. When it does:
 *
 *   1. describe the entity in src/db/entities/interceptions.entity.ts (extends Identifiable)
 *   2. optional seed rows in src/db/seed/interceptions.seed.ts
 *   3. export const interceptionsRepository: Repository<YourEntity> =
 *        createRepository<YourEntity>("YourEntity", SEED);
 *
 * See repositories/blue.repository.ts for the worked example.
 */

// import { createRepository, type Repository } from "../db";
import { Interception } from "../db/entities/interception.entity";
import { dataSource } from "../db/data-source";

export const interceptionsRepository = dataSource.getRepository(Interception);
