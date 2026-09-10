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
import { getAllDrones, saveDrones } from "../repositories/red/drone.repository";

const API_URL = "https://hatzotapi.vercel.app/api/drones";

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "red", status: "empty" };
}

export async function getDrones(): Promise<Drone[]> {
  return await getAllDrones();
}

export function startRedFetchDronesJob(): void {
  setInterval(async () => {
    try {
      const response = await axios.get<RemoteApiDrone[]>(API_URL);

      // Build all drone objects with positions in memory
      const dronesToSave = response.data.map((apiDrone) => {
        const drone = new Drone();
        drone.droneId = apiDrone.remoteId;
        drone.heading = String(apiDrone.heading);
        drone.velocity = "0"; // Velocity not provided by API

        // Attach position with CASCADE will handle insert/update
        const position = new DronePosition();
        position.droneId = apiDrone.remoteId;
        position.longitude = String(apiDrone.launch_point.longitude);
        position.latitude = String(apiDrone.launch_point.latitude);
        position.asl = "0"; // ASL not provided by API
        position.agl = "0"; // AGL not provided by API
        position.recordedAt = apiDrone.timestamp;
        drone.position = position;

        return drone;
      });

      // Batch save all drones and positions via CASCADE
      await saveDrones(dronesToSave);
    } catch (error) {
      console.error("Error fetching drones from API:", error);
    }
  }, 2000);
}
