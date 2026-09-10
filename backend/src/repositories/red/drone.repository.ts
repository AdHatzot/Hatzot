import { In, Repository } from "typeorm";
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
  // Type only — positions are a growing track history, not something to
  // attach to every drone ever seen.
  return await droneRepository.find({
    relations: { droneType: true },
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

/**
 * DB ids for these drone_ids only. Where older duplicate rows exist for one
 * drone_id, the oldest row wins, so every pull maps a drone to the same row.
 */
export async function findDroneIds(droneIds: string[]): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  if (droneIds.length === 0) return ids;

  const rows = await droneRepository.find({
    select: { id: true, droneId: true },
    where: { droneId: In(droneIds) },
    order: { id: "ASC" },
  });
  for (const row of rows) {
    if (!ids.has(row.droneId)) ids.set(row.droneId, row.id);
  }
  return ids;
}

/** Insert drones that are not in the DB yet, in one statement. */
export async function insertDrones(drones: Drone[]): Promise<void> {
  if (drones.length === 0) return;
  await droneRepository.insert(drones);
}

/** Append one track point per drone — history for route calculation. */
export async function appendPositions(positions: DronePosition[]): Promise<void> {
  if (positions.length === 0) return;
  await dronePositionRepository.insert(positions);
}
