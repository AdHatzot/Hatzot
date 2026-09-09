/**
 * @team     blue
 * @owner    blue-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Blue persistence shapes. Plain interfaces until TypeORM lands; then each
 * becomes a decorated class with the same fields —
 *
 *   @Entity("batteries")
 *   export class Battery { @PrimaryColumn() id!: string; @Column() name!: string; … }
 *
 * — and neither the seed nor the service changes. The shape is the contract.
 * Coordinates come from client/src/shared/localities.ts.
 */
import type { Identifiable } from "../repository";

export type MissileKind = "IronHook" | "ShieldNest";
export type LauncherStatus = "ready" | "reloading" | "offline";

export interface Launcher {
  id: string;
  kind: MissileKind;
  rounds: number;
  status: LauncherStatus;
  readyAt?: number;
}

export interface Battery extends Identifiable {
  name: string;
  lat: number;
  lng: number;
  rangeM: number;
  launchers: Launcher[];
}
