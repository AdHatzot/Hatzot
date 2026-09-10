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
import { Deployment, DeploymentDto, DeploymentStatus } from "../db/entities/deployment.entity";

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

export async function getAllLiveLaunchers(): Promise<Array<LiveLauncher>> {
  return await logisticsLiveLauncherRepository.find();
}

export async function getAllLauncherTypes(): Promise<Array<LauncherType>> {
  return await logisticsLauncherTypeRepository.find();
}

export async function getAllInterceptorTypes(): Promise<Array<InterceptorType>> {
  return await logisticsInterceptorTypeRepository.find();
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

export async function updateDeploymentStatus(
  id: number,
  newStatus: DeploymentStatus
): Promise<Deployment> {
  // 1. Check if target deployment exists
  const targetDeployment = await logisticsDeploymentRepository.findOne({ where: { id } });

  if (!targetDeployment) {
    throw new Error(`NOT_FOUND: Deployment with ID ${id} does not exist`);
  }

  // 2. Demote existing LIVE deployment if target is becoming LIVE
  if (newStatus === DeploymentStatus.REAL) {
    await logisticsDeploymentRepository.update(
      { status: DeploymentStatus.REAL },
      { status: DeploymentStatus.SAVED }
    );
  }

  // 3. Save updated status
  targetDeployment.status = newStatus;
  return await logisticsDeploymentRepository.save(targetDeployment);
}

export async function getRealDeployment(): Promise<Deployment | null> {
  // Using findOne with where condition
  const deployment = await logisticsDeploymentRepository.findOne({
    where: {
      status: DeploymentStatus.REAL, // Or "REAL" / DeploymentStatus.LIVE based on your enum
    },
    relations: {
      liveLaunchers: true, // Optional: includes associated launchers
    },
  });

  return deployment;
}

export async function getLauncherById(launcherId: string | number) {
  let targetLauncherId = launcherId;

  // If no launcherId is provided, resolve the ID from the active real deployment
  if (!targetLauncherId) {
    const realDeployment = await getRealDeployment();

    if (!realDeployment) {
      return null; // Return null early if no real deployment exists
    }

    targetLauncherId = realDeployment.id;
  }

  const result = await logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .innerJoinAndSelect("launcher.deployment", "deployment")
    .leftJoin("launcher.launcherAmmunitions", "ammunition")
    .where("launcher.id = :targetLauncherId", { targetLauncherId })
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