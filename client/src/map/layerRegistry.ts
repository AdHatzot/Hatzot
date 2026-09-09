/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-09
 */

import type { TeamMapLayer } from "@/shared/contracts";
import { redLayer } from "@/features/red";
import { blueLayer } from "@/features/blue";
import { polygonLayer } from "@/features/poligon";

export const TEAM_LAYERS: readonly TeamMapLayer[] = [
  redLayer,
  blueLayer,
  polygonLayer,
];
