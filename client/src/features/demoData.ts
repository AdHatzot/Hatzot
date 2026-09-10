import { Drone, DroneType } from "@/types";

export const DEMO_DRONES: Drone[] = [
  {
    id: 1,
    location: {
      longitude: 4.8952,
      latitude: 52.3702,
      asl: 18,
      agl: 120,
    },
    heading: 45,
    velocity: 18,
    type: DroneType.SkyMiteC7,
  },
  {
    id: 2,
    location: {
      longitude: 4.9156,
      latitude: 52.3584,
      asl: 12,
      agl: 85,
    },
    heading: 270,
    velocity: 12,
    type: DroneType.LoadBeeM2,
  },
  {
    id: 3,
    location: {
      longitude: 4.8721,
      latitude: 52.3827,
      asl: 22,
      agl: 210,
    },
    heading: 135,
    velocity: 31,
    type: DroneType.FalconLongX4,
  },
  {
    id: 4,
    location: {
      longitude: 4.9368,
      latitude: 52.3651,
      asl: 8,
      agl: 60,
    },
    heading: 180,
    velocity: 9,
    type: DroneType.NanoSwarmQ9,
  },
  {
    id: 5,
    location: {
      longitude: 4.8514,
      latitude: 52.3548,
      asl: 15,
      agl: 145,
    },
    heading: 315,
    velocity: 22,
    type: DroneType.SkyMiteC7,
  },
  {
    id: 6,
    location: {
      longitude: 4.9047,
      latitude: 52.3915,
      asl: 19,
      agl: 95,
    },
    heading: 90,
    velocity: 16,
    type: DroneType.LoadBeeM2,
  },
  {
    id: 7,
    location: {
      longitude: 4.8235,
      latitude: 52.3782,
      asl: 24,
      agl: 280,
    },
    heading: 225,
    velocity: 38,
    type: DroneType.FalconLongX4,
  },
  {
    id: 8,
    location: {
      longitude: 4.9462,
      latitude: 52.3817,
      asl: 10,
      agl: 45,
    },
    heading: 30,
    velocity: 7,
    type: DroneType.NanoSwarmQ9,
  },
];

export type Launcher = 
{
    id: number,
    name: string,
    location: {
      lat: number,
      long: number
    },
    range: number,
    interceptors: Interceptor[]
  }


export const demoLaunchers: Launcher[] = 
 [
  {
    "id": 1,
    "name": "ShieldNest-Lite",
    "location": {
      "lat": 33.0512,
      "long": 35.2845
    },
    "range": 40000,
    "interceptors": [
      {
        "name": "BuzzStop-15",
        "amount": 6
      },
      {
        "name": "NetWing-30",
        "amount": 2
      }
    ]
  },
  {
    "id": 2,
    "name": "ShieldNest-Lite",
    "location": {
      "lat": 32.8341,
      "long": 35.195
    },
    "range": 40000,
    "interceptors": [
      {
        "name": "SwarmMist-5",
        "amount": 500
      }
    ]
  },
  {
    "id": 3,
    "name": "IronHook-SR",
    "location": {
      "lat": 33.185,
      "long": 35.572
    },
    "range": 60000,
    "interceptors": [
      {
        "name": "BuzzStop-15",
        "amount": 8
      },
      {
        "name": "DartFox-S",
        "amount": 4
      },
      {
        "name": "SpearMini-70",
        "amount": 2
      }
    ]
  },
  {
    "id": 4,
    "name": "HorizonEye-MX",
    "location": {
      "lat": 32.981,
      "long": 35.421
    },
    "range": 25000,
    "interceptors": [
      {
        "name": "MicroNet-R",
        "amount": 10
      },
      {
        "name": "NetWing-30",
        "amount": 5
      }
    ]
  }
]


type Interceptor = {
  name: string;
  amount: number;
};

export const launcherInterceptors: Record<number, Interceptor[]> = {
  1: [
    {
      name: "BuzzStop-15",
      amount: 6,
    },
    {
      name: "NetWing-30",
      amount: 2,
    },
  ],

  2: [
    {
      name: "SwarmMist-5",
      amount: 500,
    },
  ],

  3: [
    {
      name: "BuzzStop-15",
      amount: 8,
    },
    {
      name: "DartFox-S",
      amount: 4,
    },
    {
      name: "SpearMini-70",
      amount: 2,
    },
  ],

  4: [
    {
      name: "MicroNet-R",
      amount: 10,
    },
    {
      name: "NetWing-30",
      amount: 5,
    },
  ],
};
