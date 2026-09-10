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
  logisticsLauncherTypeRepository,
  logisticsInterceptorTypeRepository
} from "../repositories/logistics.repository";
import { LauncherType } from "../db/entities/launcherType.entity";
import { InterceptorType } from "../db/entities/InterceptorType.entity";
import { Deployment, DeploymentDto } from "../db/entities/deployment.entity";

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

export async function getLiveDeployments(
  deploymentId?: number
): Promise<
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
  const targetDeploymentId = deploymentId ?? 1;

  const results = await logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .innerJoinAndSelect("launcher.deployment", "deployment")
    .leftJoin("launcher.launcherAmmunitions", "ammunition")
    .where("deployment.id = :deploymentId", { deploymentId: targetDeploymentId })
    .select([
      "deployment.id",
      "deployment.name",
      "deployment.status",
      "launcher.id",
      "launcher.latitude",
      "launcher.longitude",
      "launcher.asl",
      "launcher.agl",
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
    ammunitionAmount: Number(results.raw[index].total_ammunition_quantity),
  }));
}

export async function getAllLauncherTypes(): Promise<Array<LauncherType>> {
  return await logisticsLauncherTypeRepository.find();
}

export async function getAllInterceptorTypes(): Promise<Array<InterceptorType>> {
  return await logisticsInterceptorTypeRepository.find();
}

export async function getLauncherById(launcherId: string | number) {
  const targetlauncherId = launcherId ?? 1;

  const result = await logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .innerJoinAndSelect("launcher.deployment", "deployment")
    .leftJoin("launcher.launcherAmmunitions", "ammunition")
    .where("launcher.id = :targetlauncherId", { targetlauncherId })
    .select([
      "deployment.id",
      "deployment.name",
      "deployment.status",
      "launcher.id",
      "launcher.latitude",
      "launcher.longitude",
      "launcher.asl",
      "launcher.agl",
      "COALESCE(SUM(ammunition.quantity), 0) AS total_ammunition_quantity",
    ])
    .groupBy("launcher.id")
    .addGroupBy("deployment.id")
    .getRawAndEntities();

  if (!result.entities.length) {
    return null;
  }

  const entity = result.entities[0];
  const rawData = result.raw[0];

  return {
    launcherId: entity.id,
    deployment: entity.deployment,
    location: {
      latitude: entity.latitude,
      longitude: entity.longitude,
      asl: entity.asl,
      agl: entity.agl,
    },
    ammunitionAmount: Number(rawData.total_ammunition_quantity),
  };
}

export async function getAllDeployments(): Promise<Array<Deployment>> {
  return await logisticsDeploymentRepository.find();
}

export async function getDeploymentById(deploymentId: number) {
  const deployment = await logisticsDeploymentRepository.findOne({
    where: {
      id: deploymentId,
    },
    relations: {
      liveLaunchers: {
        launcherAmmunitions: true,
      },
    },
  });

  if (!deployment) {
    return null;
  }

  return {
    id: deployment.id,
    name: deployment.name,
    status: deployment.status,
    launchers: (deployment.liveLaunchers || []).map((launcher) => {
      const totalAmmunition = (launcher.launcherAmmunitions || []).reduce(
        (sum, ammo) => sum + (ammo.quantity || 0),
        0
      );

      return {
        id: launcher.id,
        active: launcher.active,
        location: {
          latitude: launcher.latitude,
          longitude: launcher.longitude,
          asl: launcher.asl,
          agl: launcher.agl,
        },
        ammunitionAmount: totalAmmunition,
      };
    }),
  };
}

export async function createDeployment(data: DeploymentDto): Promise<Deployment> {
  // Create an entity instance
  const newDeployment = logisticsDeploymentRepository.create({
    name: data.name,
    status: data.status,
  });

  // Save/Insert into database
  return await logisticsDeploymentRepository.save(newDeployment);
}