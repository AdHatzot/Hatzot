/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — business logic lands here with the feed. Persistence
 * goes through repositories/red.repository.ts only; live changes go out
 * via broadcast() from ../ws. No Express types in here.
 */
import axios from "axios";
import { broadcast } from "../ws";
import type { Team, RemoteApiDrone } from "../types";
import { Drone } from "../db/entities/red/drone.entity";
import { DronePosition } from "../db/entities/red/drone-position.entity";
import {
  getAllDrones,
  saveDrones,
  getOrCreateDroneType,
} from "../repositories/red/drone.repository";

const API_URL = "https://hatzotapi.vercel.app/api/drones/tracked";

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

export function startRedFetchDronesJob(): void {
  setInterval(async () => {
    try {
      const response = await axios.get<{ drones: RemoteApiDrone[] }>(API_URL);
      console.log(response.data.drones.length);

      // Build drone objects without positions
      const dronesToSave = await Promise.all(
        response.data.drones.map(async (apiDrone) => {
          const drone = new Drone();
          drone.droneId = apiDrone.id;
          drone.heading = String(apiDrone.heading);
          drone.velocity = "0"; // Velocity not provided by API
          drone.droneType = await getOrCreateDroneType(apiDrone.type);
          return drone;
        }),
      );

      // Save drones first
      await saveDrones(dronesToSave);

      // Fetch saved drones to get their IDs and existing positions
      const savedDrones = await getAllDrones();
      const droneMap = new Map(savedDrones.map((d) => [d.droneId, d]));

      // Now update drones with new position data. The DB keeps every drone it
      // has ever seen; the map shows this pull only, so both the rows to save
      // and the tick payload are built from the API response, never from the
      // full table read above.
      const touched: Drone[] = [];
      const tick: RedDroneTick[] = [];

      for (const apiDrone of response.data.drones) {
        const drone = droneMap.get(apiDrone.id);
        if (!drone) {
          console.warn(`Drone ${apiDrone.id} not found in database`);
          continue;
        }

        // Create or update position
        if (!drone.position) {
          drone.position = new DronePosition();
        }

        drone.position.longitude = String(apiDrone.launch_point.longitude);
        drone.position.latitude = String(apiDrone.launch_point.latitude);
        drone.position.asl = "0"; // ASL not provided by API
        drone.position.agl = "0"; // AGL not provided by API
        drone.position.recordedAt = apiDrone.timestamp;

        touched.push(drone);
        tick.push({
          id: drone.id,
          droneId: drone.droneId,
          type: apiDrone.type,
          heading: apiDrone.heading,
          latitude: apiDrone.launch_point.latitude,
          longitude: apiDrone.launch_point.longitude,
          timestamp: apiDrone.timestamp,
        });
      }

      // Save the rows this pull touched, with positions via CASCADE
      if (touched.length > 0) await saveDrones(touched);

      // A tick is the whole current picture: the client mirrors it exactly,
      // dropping any marker whose drone this pull did not return.
      broadcast("red:drones.updated", tick);
    } catch (error) {
      console.error("Error fetching drones from API:", error);
    }
  }, 1000);
}
