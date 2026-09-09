/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-08
 */
import type { TeamMapLayer } from "@/shared/contracts";
import { redLayer } from "@/features/red";
import { blueLayer } from "@/features/blue";

export const TEAM_LAYERS: readonly TeamMapLayer[] = [redLayer, blueLayer];
