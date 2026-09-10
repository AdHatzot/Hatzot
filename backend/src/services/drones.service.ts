/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Drones service — the only layer that talks to drones.repository.ts.
 * Other services (e.g. alerts) must go through here and never import
 * the repository directly.
 */
import type { CurrentDrone } from "../db/entities/drone.entity";
import { findCurrentDrones } from "../repositories/drones.repository";

export async function getDrones(): Promise<CurrentDrone[]> {
    return findCurrentDrones();
}
