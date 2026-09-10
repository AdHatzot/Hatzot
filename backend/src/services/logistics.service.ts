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
import {
  fireIntercept as fireInterceptInRepository,
  type FireInterceptRequest,
} from "../repositories/logistics.repository";
import { dataSource } from "../db/data-source";
import { LiveLauncher } from "../db/entities/liveLauncher.entity";
import {
  logisticsDeploymentRepository,
  logisticsLiveLauncherRepository,
} from "../repositories/logistics.repository";

export async function getStatus(): Promise<{ team: Team; status: string }> {
  return { team: "logistics", status: "empty" };
}

export async function fireIntercept(
  request: FireInterceptRequest,
): Promise<{ launcherId: number; interceptorTypeId: number }> {
  const result = await fireInterceptInRepository(request);

  setTimeout(() => {
    void dataSource
      .getRepository(LiveLauncher)
      .update({ id: String(result.launcherId) }, { active: true })
      .catch((error: unknown) => {
        console.error("Failed to reactivate launcher", error);
      });
  }, result.reloadTimeS * 1000);

  return {
    launcherId: Number(result.launcherId),
    interceptorTypeId: result.interceptorTypeId,
  };
}

export async function getAll() {
  return await logisticsDeploymentRepository.find();
}

export async function getLiveDeployments(deploymentId: number): Promise<
  Array<{
    deployment: unknown;
    launcherId: string;
    location: {
      latitude: number | null;
      longitude: number | null;
      asl: number | null;
      agl: number | null;
    };
    ammunitionAmount: number;
  }>
> {
  const results = await logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .innerJoinAndSelect("launcher.deployment", "deployment")
    .leftJoin("launcher.launcherAmmunitions", "ammunition")
    .where("deployment.id = :deploymentId", { deploymentId })
    .select([
      "deployment.id",
      "deployment.name",
      "deployment.status",
      "launcher.id",
      "launcher.latitude",
      "launcher.longitude",
      "launcher.asl",
      "launcher.agl",
      // Sum the total ammunition quantity for this launcher
      "COALESCE(SUM(ammunition.quantity), 0) AS total_ammunition_quantity",
    ])
    .groupBy("launcher.id")
    .addGroupBy("deployment.id")
    .getRawAndEntities();

  return results.entities.map((entity, index) => ({
    deployment: entity.deployment,
    launcherId: entity.id,
    location: {
      latitude: entity.latitude,
      longitude: entity.longitude,
      asl: entity.asl,
      agl: entity.agl,
    },
    ammunitionAmount: Number(
      results.raw[index]?.total_ammunition_quantity ?? 0,
    ),
  }));
}
