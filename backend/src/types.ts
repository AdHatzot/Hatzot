/**
 * @team     core
 * @owner    all leads
 * @public   yes
 * @updated  2026-09-09
 *
 * Mirrors client/src/types/events.ts — keep the two identical.
 */
export type Team = "red" | "blue" | "alerts" | "logistics" | "loop";

export type EventName = `${Team}:${string}.${string}`;

export interface RemoteApiDrone {
  type: string;
  id: string;
  timestamp: Date;
  heading: number;
  launch_point: { latitude: number; longitude: number };
}

export type Location = {
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
};

export type DroneDTO = {
  id: number;
  location: Location;
  heading: number;
  velocity: number;
  type: DroneType;
};

export enum DroneType {
  SkyMiteC7,
  LoadBeeM2,
  FalconLongX4,
  NanoSwarmQ9,
}
