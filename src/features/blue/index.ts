/**
 * @team     blue
 * @owner    blue-lead
 * @public   yes
 * @updated  2026-09-08
 *
 */
import type { TeamMapLayer } from "@/shared/contracts";
import { mountBlueLayer } from "./BlueLayer";

export const blueLayer: TeamMapLayer = {
  id: "blue",
  label: "צד כחול — מיירטים וכלים",
  colour: "var(--team-blue)",
  defaultVisible: true,
  mount: mountBlueLayer,
};
