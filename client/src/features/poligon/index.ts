/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-09
 */

import type { TeamMapLayer } from "@/shared/contracts";
import { mountPolygonLayer } from "./PoligonLayer";

export const polygonLayer: TeamMapLayer = {
  id: "polygon",
  label: "יישובים",
  colour: "#a8a8a8",
  defaultVisible: true,
  mount: mountPolygonLayer,
};
