import { Repository } from "typeorm";
import { dataSource } from "../../db/data-source";
import { Drone } from "../../db/entities/red/drone.entity";
import { DroneType } from "../../db/entities/red/drone-type.entity";
import { DronePosition } from "../../db/entities/red/drone-position.entity";

export const droneRepository: Repository<Drone> =
  dataSource.getRepository<Drone>("Drone");

export const droneTypeRepository: Repository<DroneType> =
  dataSource.getRepository<DroneType>("DroneType");

export const dronePositionRepository: Repository<DronePosition> =
  dataSource.getRepository<DronePosition>("DronePosition");

export async function getAllDrones(): Promise<Drone[]> {
  return await droneRepository.find({
    relations: { droneType: true, position: true },
  });
}

/** Get or create a DroneType by name. */
export async function getOrCreateDroneType(
  typeName: string,
): Promise<DroneType> {
  let droneType = await droneTypeRepository.findOne({
    where: { name: typeName },
  });

  if (!droneType) {
    droneType = new DroneType();
    droneType.name = typeName;
    await droneTypeRepository.save(droneType);
  }

  return droneType;
}

/** Save many drones to the repository (batch upsert based on droneId). */
export async function saveDrones(drones: Drone[]): Promise<void> {
  const droneIds = drones.map((d) => d.droneId);

  // Find existing drones by droneId
  const existing = await droneRepository.find({
    where: droneIds.map((id) => ({ droneId: id })),
    relations: { position: true },
  });

  const existingMap = new Map(existing.map((d) => [d.droneId, d.id]));

  // Set the id for drones that exist, so save() will update instead of insert
  for (const drone of drones) {
    if (existingMap.has(drone.droneId)) {
      drone.id = existingMap.get(drone.droneId)!;
    }
  }

  await droneRepository.save(drones);
}
