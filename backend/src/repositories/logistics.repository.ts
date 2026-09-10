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
import { Deployment } from "../db/entities/logistics.entity";
import { dataSource } from "../db/data-source";
import { LiveLauncher } from "../db/entities/liveLauncher.entity";
import { LauncherData } from "../utils/LiveLauncherTypes";

export const logisticsDeploymentRepository =
  dataSource.getRepository(Deployment);
export const logisticsLiveLauncherRepository =
  dataSource.getRepository(LiveLauncher);

const getLunchersFromDb = async (): Promise<LiveLauncher[]> => {
  return logisticsLiveLauncherRepository
    .createQueryBuilder("launcher")
    .leftJoinAndSelect("launcher.launcherType", "launcherType")
    .leftJoinAndSelect("launcher.ammunition", "ammunition")
    .leftJoinAndSelect("ammunition.interceptorType", "interceptorType")
    .where("launcher.active = :active", { active: true })
    .getMany();
};

const getLauncherFromDb = async (id: string): Promise<LiveLauncher | null>  => {
    return logisticsLiveLauncherRepository.createQueryBuilder("launcher")
    .leftJoinAndSelect("launcher.launcherType", "launcherType")
    .leftJoinAndSelect("launcher.ammunition", "ammunition")
    .leftJoinAndSelect(
      "ammunition.interceptorType",
      "interceptorType",
    )
    .where("launcher.id = :id", { id })
    .andWhere("launcher.active = :active", { active: true })
    .getOne();
};

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

const getAllLaunchers = async (): Promise<LauncherData[]> => {
    const launchers = await getLunchersFromDb();

    return launchers.map(mapLauncher);
};

const getLauncherById = async (id: string): Promise<LauncherData | null> => {
    const launcher = await getLauncherFromDb(id);

    if(!launcher) {
        return null;
    }

    return mapLauncher(launcher);
};

export { getAllLaunchers , getLauncherById }
