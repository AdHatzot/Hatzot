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

export type Drone = {
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

export type Launcher = {
  id: number;
  location: Location;
  type: LauncherType;
  amount: number;
  active: boolean;
  ammunition: [InterceptorType, number][];
};

export enum LauncherType {
  ShieldNestLite,
  IronHookSR,
  HorizonEyeMX,
  CloudFenceArea,
}

export const ReloadTime: Record<LauncherType, number> = {
  [LauncherType.ShieldNestLite]: 0.7,
  [LauncherType.IronHookSR]: 1,
  [LauncherType.HorizonEyeMX]: 0.6,
  [LauncherType.CloudFenceArea]: 0.3,
};

export enum InterceptorType {
  BuzzStop15,
  NetWing30,
  DartFoxS,
  SpearMini70,
  SkyLanceM,
  FalconClipH,
  SwarmMist5,
  MicroNetR,
}

export const InterceptorRange: Record<InterceptorType, number> = {
  [InterceptorType.BuzzStop15]: 10000,
  [InterceptorType.NetWing30]: 10000,
  [InterceptorType.DartFoxS]: 30000,
  [InterceptorType.SpearMini70]: 30000,
  [InterceptorType.SkyLanceM]: 50000,
  [InterceptorType.FalconClipH]: 70000,
  [InterceptorType.SwarmMist5]: 5000,
  [InterceptorType.MicroNetR]: 7000,
};
