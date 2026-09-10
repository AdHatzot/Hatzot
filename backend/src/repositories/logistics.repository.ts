/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — the logistics shape arrives with the feed. When it does:
 *
 *   1. describe the entity in src/db/entities/logistics.entity.ts (extends Identifiable)
 *   2. optional seed rows in src/db/seed/logistics.seed.ts
 *   3. export const logisticsRepository: Repository<YourEntity> =
 *        createRepository<YourEntity>("YourEntity", SEED);
 *
 * See repositories/blue.repository.ts for the worked example.
 */

// import { createRepository, type Repository } from "../db";
import { Deployment, DeploymentStatus } from "../db/entities/deployment.entity";
import { dataSource } from "../db/data-source";
import { LauncherAmmunition } from "../db/entities/launcherAmmunition.entity";
import { LiveLauncher } from "../db/entities/liveLauncher.entity";
import { HttpError } from "../shared/httpError";
import { LauncherType } from "../db/entities/launcherType.entity";
import { InterceptorType } from "../db/entities/InterceptorType.entity";

export interface FireInterceptRequest {
  launcherId: number;
  interceptorTypeId: number;
}

export interface FireInterceptResult {
  launcherId: string;
  interceptorTypeId: number;
  reloadTimeS: number;
}

export interface CreateDeploymentRow {
  launcher_type_name: string;
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
  amount: number;
}

export interface CreateDeploymentRequest {
  name: string;
  rows: CreateDeploymentRow[];
}

export interface CreateDeploymentResult {
  deploymentId: number;
  deploymentName: string;
  deployment: Deployment;
  launchersCreated: number;
  launchers: LiveLauncher[];
}

export const logisticsDeploymentRepository =
  dataSource.getRepository(Deployment);

export const logisticsLiveLauncherRepository =
  dataSource.getRepository(LiveLauncher);

export const logisticsLauncherTypeRepository =
  dataSource.getRepository(LauncherType);

export const logisticsInterceptorTypeRepository =
  dataSource.getRepository(InterceptorType);

export const getLaunchersFromDb = async (deploymentId: number): Promise<LiveLauncher[]> => {
  return logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .leftJoinAndSelect("launcher.launcherType", "launcherType")
    .leftJoinAndSelect("launcher.launcherAmmunitions", "ammunition")
    .leftJoinAndSelect("ammunition.interceptorType", "interceptorType")
    .where("launcher.deployment_id = :deploymentId", { deploymentId })
    .getMany();
};

export const getLauncherFromDb = async (id: string): Promise<LiveLauncher | null> => {
  return logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .leftJoinAndSelect("launcher.launcherType", "launcherType")
    .leftJoinAndSelect("launcher.launcherAmmunitions", "ammunition")
    .leftJoinAndSelect("ammunition.interceptorType", "interceptorType")
    .where("launcher.id = :id", { id })
    .andWhere("launcher.active = :active", { active: true })
    .getOne();
};

export async function createDeployment(
  request: CreateDeploymentRequest,
): Promise<CreateDeploymentResult> {
  return dataSource.transaction(async (manager) => {
    // 1. Create the deployment record
    const deploymentRepo = manager.getRepository(Deployment);
    const deployment = deploymentRepo.create({
      name: request.name,
      status: DeploymentStatus.SAVED,
    });
    const savedDeployment = await deploymentRepo.save(deployment);

    // 2. Resolve launcher type names to IDs
    const launcherTypeRepo = manager.getRepository(LauncherType);
    const allLauncherTypes = await launcherTypeRepo.find();
    const typeNameToId = new Map(
      allLauncherTypes.map((lt) => [lt.name.toLowerCase(), lt.id]),
    );

    // 3. Validate all launcher type names exist
    const invalidTypeNames: string[] = [];
    for (const row of request.rows) {
      if (!typeNameToId.has(row.launcher_type_name.toLowerCase())) {
        invalidTypeNames.push(row.launcher_type_name);
      }
    }

    if (invalidTypeNames.length > 0) {
      const unique = [...new Set(invalidTypeNames)];
      throw new HttpError(
        400,
        `Unknown launcher type(s): ${unique.join(", ")}. Available: ${allLauncherTypes.map((lt) => lt.name).join(", ")}`,
      );
    }

    // 4. Create live launcher records
    const liveLauncherRepo = manager.getRepository(LiveLauncher);
    const launchers = request.rows.map((row) => {
      return liveLauncherRepo.create({
        launcherTypeId: typeNameToId.get(row.launcher_type_name.toLowerCase())!,
        deploymentId: savedDeployment.id,
        longitude: row.longitude,
        latitude: row.latitude,
        asl: row.asl,
        agl: row.agl,
        amount: row.amount,
        active: true,
      });
    });

    await liveLauncherRepo.save(launchers);

    const savedLaunchers = await liveLauncherRepo.find({
      where: { deploymentId: savedDeployment.id },
      relations: { launcherType: true },
      order: { id: "ASC" },
    });

    return {
      deploymentId: savedDeployment.id,
      deploymentName: savedDeployment.name,
      deployment: savedDeployment,
      launchersCreated: savedLaunchers.length,
      launchers: savedLaunchers,
    };
  });
}

export async function fireIntercept(
  request: FireInterceptRequest,
): Promise<FireInterceptResult> {
  return dataSource.transaction(async (manager) => {
    const ammunition = await manager
      .getRepository(LauncherAmmunition)
      .createQueryBuilder("ammunition")
      .innerJoinAndSelect("ammunition.launcher", "launcher")
      .innerJoinAndSelect("launcher.launcherType", "launcherType")
      .where("ammunition.launcher_id = :launcherId", {
        launcherId: request.launcherId,
      })
      .andWhere("ammunition.interceptor_type_id = :interceptorTypeId", {
        interceptorTypeId: request.interceptorTypeId,
      })
      .setLock("pessimistic_write")
      .getOne();

    if (ammunition === null) {
      throw new HttpError(404, "No launcher with this interceptor was found");
    }

    const launcher = ammunition.launcher;
    if (launcher === undefined) {
      throw new HttpError(404, "Launcher was not found");
    }

    if (launcher.launcherType === undefined) {
      throw new HttpError(404, "Launcher type was not found");
    }

    if (!launcher.active) {
      throw new HttpError(409, "Launcher is reloading");
    }

    if ((ammunition.quantity ?? 0) < 1) {
      throw new HttpError(409, "Interceptor has no ammunition");
    }

    ammunition.quantity -= 1;
    launcher.active = false;
    await manager.getRepository(LauncherAmmunition).save(ammunition);
    await manager.getRepository(LiveLauncher).save(launcher);

    return {
      launcherId: launcher.id,
      interceptorTypeId: ammunition.interceptorTypeId,
      reloadTimeS: Number(launcher.launcherType.reloadTimeS ?? 0),
    };
  });
}
