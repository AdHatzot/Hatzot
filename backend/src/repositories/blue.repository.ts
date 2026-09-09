/**
 * @team     blue
 * @owner    blue-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Blue's persistence handle. Services talk to this, never to db/ directly.
 * "Battery" is the TypeORM entity name the table will register under.
 */
import { createRepository, type Repository } from "../db";
import type { Battery } from "../db/entities/blue.entity";
import { BATTERIES } from "../db/seed/blue.seed";

export const blueBatteryRepository: Repository<Battery> = createRepository<Battery>("Battery", BATTERIES);
