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
import { logisticsDeploymentRepository, logisticsLiveLauncherRepository } from "../repositories/logistics.repository";

export async function getStatus(): Promise<{ team: Team; status: string }> {
  return { team: "logistics", status: "empty" };
}


export async function getAll() {
  return await logisticsDeploymentRepository.find();
}

export async function getLiveDeployments(deploymentId: number) {
  const results = await logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    // Join and load the full Deployment entity
    .innerJoinAndSelect("launcher.deployment", "deployment")
    // Left join ammunition table to sum the quantity
    .leftJoin("launcher.launcherAmmunitions", "ammunition")
    .where("deployment.id = :deploymentId", { deploymentId })
    .select([
      // Deployment entity fields
      "deployment.id",
      "deployment.name",
      "deployment.status",
      // LiveLauncher location & identifier fields
      "launcher.id",
      "launcher.latitude",
      "launcher.longitude",
      "launcher.asl",
      "launcher.agl",
      // Sum the total ammunition quantity for this launcher
      "COALESCE(SUM(ammunition.quantity), 0) AS total_ammunition_quantity"
    ])
    .groupBy("launcher.id")
    .addGroupBy("deployment.id")
    .getRawAndEntities();

  // Custom mapping if you want clean structured objects:
  return results.entities.map((entity, index) => ({
    deployment: entity.deployment,
    launcherId: entity.id,
    location: {
      latitude: entity.latitude,
      longitude: entity.longitude,
      asl: entity.asl,
      agl: entity.agl,
    },
    ammunitionAmount: Number(results.raw[index].total_ammunition_quantity),
  }));
}