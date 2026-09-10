/**
 * @team     interceptions
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-10
 */

import type {
  LayerGroup,
  Map as LeafletMap,
} from "leaflet";

import { ISRAEL_CENTER } from "@/shared/geo";
import { animateInterception } from "./animateInterception";
import { Interception } from "@/types/interceptions";

// MOCK DB
const mockInterceptions: Interception[] = [
  {
    id: "interception-1",
    interceptorId: "blue-1",
    targetId: "red-1",

    start: {
      lat: 30.15,
      lng: 35.0,
    },

    target: {
      lat: 29.65,
      lng: 35.0,
    },

    result: "hit",
    durationMs: 1800,
  },

  {
    id: "interception-2",
    interceptorId: "blue-2",
    targetId: "red-2",

    start: {
      lat: 31.2,
      lng: 34.9,
    },

    target: {
      lat: 29.7,
      lng: 34.1,
    },

    result: "miss",
    durationMs: 2500,
  },

  {
    id: "interception-3",
    interceptorId: "blue-3",
    targetId: "red-3",

    start: {
      lat: 32.1,
      lng: 35.2,
    },

    target: {
      lat: 31.8,
      lng: 34.0,
    },

    result: "hit",
    durationMs: 3000,
  },
];

// FAKE API REQUEST
async function loadInterceptions(): Promise<Interception[]> {
  return mockInterceptions;
}

export function mountInterceptionLayer(
  group: LayerGroup,
  _map: LeafletMap,
): void {
  loadInterceptions()
    .then((interceptions) => {
      for (const interception of interceptions) {
        animateInterception({
          group,
          start: interception.start,
          target: interception.target,
          result: interception.result,
          durationMs: interception.durationMs,
        });
      }
    })
    .catch((error) => {
      console.error("Failed to load interceptions:", error);
    });
}