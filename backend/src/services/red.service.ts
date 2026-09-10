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
import type { Team, RemoteApiDrone } from "../types";
import { Drone } from "../db/entities/red/drone.entity";
import { DronePosition } from "../db/entities/red/drone-position.entity";
import {
  getAllDrones,
  saveDrones,
  getOrCreateDroneType,
} from "../repositories/red/drone.repository";

const API_URL = "https://hatzotapi.vercel.app/api/drones/tracked";

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

      // Now update drones with new position data
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
      }

      // Save drones again with updated positions via CASCADE
      await saveDrones(Array.from(droneMap.values()));
    } catch (error) {
      console.error("Error fetching drones from API:", error);
    }
  }, 2000);
}
