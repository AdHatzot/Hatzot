/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * The tracked-drone feed. Every POLL_MS: fetch the external API, push the pull
 * to every screen over ws, then store it — each drone once, plus one position
 * row per drone per pull for route calculation. The map never waits on the DB.
 */
import axios from "axios";
import { broadcast } from "../ws";
import type { Team, RemoteApiDrone } from "../types";
import { Drone } from "../db/entities/red/drone.entity";
import { DronePosition } from "../db/entities/red/drone-position.entity";
import type { DroneType } from "../db/entities/red/drone-type.entity";
import {
  appendPositions,
  findDroneIds,
  getAllDrones,
  getOrCreateDroneType,
  insertDrones,
} from "../repositories/red/drone.repository";

const API_URL = "https://hatzotapi.vercel.app/api/drones/tracked";

/**
 * The feed advances its simulation one step per fetch (60 steps, then a new
 * wave of drones), and its steps are meant to be 2s apart.
 */
const POLL_MS = 2000;
const FETCH_TIMEOUT_MS = 5000;

/**
 * One external-API pull, flattened for the wire. Deliberately not the Drone
 * entity: the map needs a position and a label, not the DB row and its
 * relations (which also risk a circular JSON once TypeORM links them back).
 */
export type RedDroneTick = {
  id: number;
  droneId: string;
  type: string;
  heading: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
};

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "red", status: "empty" };
}

export async function getDrones(): Promise<Drone[]> {
  return await getAllDrones();
}

// drone_id -> DB id for drones this process has already stored, so a pull only
// goes to the DB for drones it has never seen (a new wave every 60 steps).
const knownDroneIds = new Map<string, number>();
const droneTypes = new Map<string, DroneType>();

async function droneTypeFor(name: string): Promise<DroneType> {
  let type = droneTypes.get(name);
  if (!type) {
    type = await getOrCreateDroneType(name);
    droneTypes.set(name, type);
  }
  return type;
}

function toTick(apiDrone: RemoteApiDrone): RedDroneTick {
  return {
    id: knownDroneIds.get(apiDrone.id) ?? 0,
    droneId: apiDrone.id,
    type: apiDrone.type,
    heading: apiDrone.heading,
    latitude: apiDrone.launch_point.latitude,
    longitude: apiDrone.launch_point.longitude,
    timestamp: apiDrone.timestamp,
  };
}

/** Store one pull: drones it has not seen yet, then a position row per drone. */
async function persistPull(apiDrones: RemoteApiDrone[]): Promise<void> {
  const unseen = [...new Set(apiDrones.map((d) => d.id))].filter((id) => !knownDroneIds.has(id));

  if (unseen.length > 0) {
    // Rows may already exist from an earlier run of this backend (or another).
    for (const [droneId, id] of await findDroneIds(unseen)) knownDroneIds.set(droneId, id);

    const queued = new Set<string>();
    const toInsert: Drone[] = [];
    for (const apiDrone of apiDrones) {
      if (knownDroneIds.has(apiDrone.id) || queued.has(apiDrone.id)) continue;
      const drone = new Drone();
      drone.droneId = apiDrone.id;
      drone.heading = String(apiDrone.heading);
      drone.velocity = "0"; // Velocity not provided by API
      drone.droneType = await droneTypeFor(apiDrone.type);
      toInsert.push(drone);
      queued.add(apiDrone.id);
    }

    if (toInsert.length > 0) {
      await insertDrones(toInsert);
      for (const [droneId, id] of await findDroneIds([...queued])) knownDroneIds.set(droneId, id);
    }
  }

  const positions: DronePosition[] = [];
  for (const apiDrone of apiDrones) {
    const id = knownDroneIds.get(apiDrone.id);
    if (id === undefined) continue;

    const owner = new Drone();
    owner.id = id;
    const position = new DronePosition();
    position.drone = owner;
    position.longitude = String(apiDrone.launch_point.longitude);
    position.latitude = String(apiDrone.launch_point.latitude);
    position.asl = "0"; // ASL not provided by API
    position.agl = "0"; // AGL not provided by API
    position.recordedAt = apiDrone.timestamp;
    positions.push(position);
  }
  await appendPositions(positions);
}

export function startRedFetchDronesJob(): void {
  // One fetch at a time and one store at a time, tracked separately: a slow
  // store skips storing a pull rather than delaying the next map update, and a
  // slow fetch never stacks a second one on top of it.
  let fetching = false;
  let storing = false;

  setInterval(async () => {
    if (fetching) return;
    fetching = true;

    try {
      const response = await axios.get<{ drones: RemoteApiDrone[] }>(API_URL, {
        timeout: FETCH_TIMEOUT_MS,
      });
      const apiDrones = response.data.drones;

      // A tick is the whole current picture: the client mirrors it exactly,
      // dropping any marker whose drone this pull did not return.
      broadcast("red:drones.updated", apiDrones.map(toTick));

      if (!storing) {
        storing = true;
        persistPull(apiDrones)
          .catch((error: unknown) => console.error("Storing red drone pull failed:", error))
          .finally(() => {
            storing = false;
          });
      }
    } catch (error) {
      console.error("Fetching red drones failed:", error);
    } finally {
      fetching = false;
    }
  }, POLL_MS);
}
