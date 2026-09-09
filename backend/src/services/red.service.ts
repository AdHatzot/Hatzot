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
import type { Team, RemoteApiDrone } from "../types";
import axios from "axios";
import { createRepository } from "../db";
import { saveDrones } from "../repositories/red.repository";
import type { Drone } from "../db/entities/red/drone.entity";
import type { DroneType } from "../db/entities/red/drone-type.entity";

const droneTypeRepository = createRepository<DroneType>("DroneType", []);

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "red", status: "empty" };
}

export function startRedFetchDronesJob(): void {
  setInterval(async () => {
    try {
      const res = await axios.get<RemoteApiDrone[]>(
        "https://hatzotapi.vercel.app/api/drones",
      );
      const payload = res.data;

      const types = await droneTypeRepository.findAll();
      const typeByName = new Map(types.map((type) => [type.name, type]));

      const rows: Drone[] = payload.flatMap((d) => {
        const found = typeByName.get(d.type);
        if (!found) {
          console.warn("red: unknown drone type from API, skipping", d.type);
          return [];
        }

        const drone: Drone = {
          id: String(d.remoteId),
          droneType: found,
          heading: String(d.heading),
          velocity: "0",
        } as unknown as Drone;

        return [drone];
      });

      if (rows.length > 0) await saveDrones(rows);
    } catch (err) {
      console.error("red: error fetching or saving drones", err);
    }
  }, 2000);
}
