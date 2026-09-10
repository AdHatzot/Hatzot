import { Repository } from "typeorm";
import { DroneType } from "../../db/entities/red/drone-type.entity";
import { dataSource } from "../../db/data-source";

export const droneTypeRepository: Repository<DroneType> =
  dataSource.getRepository<DroneType>("DroneType");

export async function getAllTypes(): Promise<DroneType[]> {
  return await droneTypeRepository.find();
}
