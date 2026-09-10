/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 */
import type { TeamMapLayer } from "@/shared/contracts";
import { requestInterception } from "./api";
import { mountInterceptionLayer } from "./InterceptionLayer";
import type { InterceptionLaunch } from "./types";

export type { InterceptionLaunch } from "./types";

export const interceptionLayer: TeamMapLayer = {
  id: "loop",
  label: "יירוטים",
  colour: "#ffffff",
  defaultVisible: true,
  mount: mountInterceptionLayer,
};

/**
 * Fire at these tracked drones (their feed `droneId`s). Every screen plays the
 * launches; a drone that is hit leaves the red feed when its flight ends.
 */
export function interceptDrones(droneIds: string[]): Promise<InterceptionLaunch[]> {
  return requestInterception(droneIds);
}
