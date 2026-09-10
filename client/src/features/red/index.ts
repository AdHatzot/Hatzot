/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 *
 */
import type { TeamMapLayer } from "@/shared/contracts";
import { mountRedLayer, type RedDroneTick } from "./RedLayer";
import { subscribeRedEvent } from "./redSocket";

export type { RedDroneTick } from "./RedLayer";

export const redLayer: TeamMapLayer = {
  id: "red",
  label: "צד אדום — מטרות אויב",
  colour: "var(--team-red)",
  defaultVisible: true,
  mount: mountRedLayer,
};

/**
 * The tracked-drone feed for other teams' panels — one pull of the external
 * API, so a tick is the whole current picture and not a delta. Returns an
 * unsubscribe.
 */
export function subscribeRedDrones(
  listener: (drones: RedDroneTick[]) => void,
): () => void {
  return subscribeRedEvent("red:drones.updated", (payload) => {
    listener(payload as RedDroneTick[]);
  });
}
