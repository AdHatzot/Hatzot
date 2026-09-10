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
  createDeployment as createDeploymentInRepository,
  type FireInterceptRequest,
  type CreateDeploymentRequest,
} from "../repositories/logistics.repository";
import { dataSource } from "../db/data-source";
import { LiveLauncher } from "../db/entities/liveLauncher.entity";
import {
  logisticsDeploymentRepository,
  logisticsLiveLauncherRepository,
  logisticsLauncherTypeRepository,
  logisticsInterceptorTypeRepository,
} from "../repositories/logistics.repository";
import { LauncherType } from "../db/entities/launcherType.entity";
import { Deployment, DeploymentStatus } from "../db/entities/deployment.entity";
import { InterceptorType } from "../db/entities/interceptorType.entity";
import { LauncherData } from "../utils/LiveLauncherTypes";
import * as logisticsRepository from "../repositories/logistics.repository";

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

export async function getLiveLaunchersByDeploymentId(deploymentId: number) {
  let targetDeploymentId = deploymentId;

  // If no launcherId is provided, resolve the ID from the active real deployment
  if (!targetDeploymentId) {
    const realDeployment = await getRealDeployment();

    if (!realDeployment) {
      return null; // Return null early if no real deployment exists
    }

    targetDeploymentId = realDeployment.id;
  }

  const launchers = await logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .innerJoinAndSelect("launcher.deployment", "deployment")
    .leftJoinAndSelect("launcher.launcherType", "launcherType")
    .leftJoinAndSelect("launcher.launcherAmmunitions", "ammunition")
    .leftJoinAndSelect("ammunition.interceptorType", "interceptorType")
    .where("deployment.id = :targetDeploymentId", { targetDeploymentId })
    .getMany();

  if (!launchers.length) {
    return [];
  }

  return launchers.map(mapLiveLauncher);
}

const mapLiveLauncher = (launcher: LiveLauncher) => {
  return {
    id: launcher.id,
    name: launcher.launcherType?.name ?? "",
    deployment: {
      id: launcher.deployment?.id,
      name: launcher.deployment?.name,
      status: launcher.deployment?.status,
    },
    location: {
      lat: launcher.latitude,
      long: launcher.longitude,
    },
    range: launcher.launcherType?.rangeM ?? 0,
    interceptors: (launcher.launcherAmmunitions || []).map((ammunition) => ({
      name: ammunition.interceptorType?.name ?? "",
      amount: ammunition.quantity,
    })),
  };
}
export async function createDeployment(request: CreateDeploymentRequest) {
  return await createDeploymentInRepository(request);
}

const mapLauncher = (launcher: LiveLauncher): LauncherData => {
  return {
    id: launcher.id,
    name: launcher.launcherType.name,
    location: {
      lat: launcher.latitude,
      long: launcher.longitude,
    },
    range: launcher.launcherType.rangeM,
    interceptors: launcher.launcherAmmunitions.map((ammunition) => ({
      name: ammunition.interceptorType.name,
      amount: ammunition.quantity,
    })),
  };
};

export const getAllLaunchers = async (deploymentId: number): Promise<LauncherData[] | null> => {
  let targetDeploymentId = deploymentId;

  // If no launcherId is provided, resolve the ID from the active real deployment
  if (!targetDeploymentId) {
    const realDeployment = await getRealDeployment();

    if (!realDeployment) {
      return null; // Return null early if no real deployment exists
    }

    targetDeploymentId = realDeployment.id;
  }

  const launchers = await logisticsRepository.getLaunchersFromDb(targetDeploymentId);

  return launchers.map(mapLauncher);
};

export const getLauncherById = async (id: string): Promise<LauncherData | null> => {
  const launcher = await logisticsRepository.getLauncherFromDb(id);

  if (!launcher) {
    return null;
  }

  return mapLauncher(launcher);
};
