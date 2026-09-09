/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — business logic lands here with the feed. Persistence
 * goes through repositories/logistics.repository.ts only; live changes go out
 * via broadcast() from ../ws. No Express types in here.
 */
import type { Team } from "../types";
import { logisticsDeploymentRepository } from "../repositories/logistics.repository";

export async function getStatus(): Promise<{ team: Team; status: string }> {
  return { team: "logistics", status: "empty" };
}


export async function getAll() {
  return await logisticsDeploymentRepository.find();
}