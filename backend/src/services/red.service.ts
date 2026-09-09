/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — business logic lands here with the feed. Persistence
 * goes through repositories/red.repository.ts only; live changes go out
 * via broadcast() from ../ws. No Express types in here.
 */
import type { Team } from "../types";
import type { Drone } from "../db/entities/red/drone.entity";
import { getAllDrones } from "../repositories/red/drone.repository";

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "red", status: "empty" };
}

export async function getDrones(): Promise<Drone[]> {
  return await getAllDrones();
}

export function startRedFetchDronesJob(): void {
  setInterval(async () => {}, 2000);
}
