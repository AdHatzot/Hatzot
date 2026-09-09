export type Location = {
  longitude: number;
  latitude: number;
  asl: number;
  agl: number;
};

export type Drone = {
  id: number;
  location: Location;
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
  interceptor: InterceptorType;
  amount: number;
  active: boolean;
};

export enum LauncherType {
  ShieldNestLite,
  IronHookSR,
  HorizonEyeMX,
  CloudFenceArea,
}

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
