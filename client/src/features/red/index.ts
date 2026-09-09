/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-08
 *
 */
import type { TeamMapLayer } from "@/shared/contracts";
import { mountRedLayer } from "./RedLayer";

export const redLayer: TeamMapLayer = {
  id: "red",
  label: "צד אדום — מטרות אויב",
  colour: "var(--team-red)",
  defaultVisible: true,
  mount: mountRedLayer,
};
