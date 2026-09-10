import { Repository } from "typeorm";
import { dataSource } from "../../db/data-source";
import { Drone } from "../../db/entities/red/drone.entity";

export const droneRepository: Repository<Drone> =
  dataSource.getRepository<Drone>("Drone");

export async function getAllDrones(): Promise<Drone[]> {
  return await droneRepository.find({
    relations: { droneType: true, position: true },
  });
}

/** Save many drones to the repository (batch upsert based on droneId). */
export async function saveDrones(drones: Drone[]): Promise<void> {
  await droneRepository.upsert(drones, ["droneId"]);
}
