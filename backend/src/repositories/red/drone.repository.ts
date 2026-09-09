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

/** Save many drones to the repository (upsert). */
export async function saveDrones(drones: Drone[]): Promise<Drone[]> {
  return await droneRepository.save(drones);
}
