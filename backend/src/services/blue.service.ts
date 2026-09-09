/**
 * @team     blue
 * @owner    blue-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Blue business logic. Reads and writes go through blueBatteryRepository;
 * live changes go out over ws via broadcast(). No Express types in here.
 */
import { broadcast } from "../ws";
import type { Battery, Launcher, LauncherStatus } from "../db/entities/blue.entity";
import { blueBatteryRepository } from "../repositories/blue.repository";

export interface BlueStats {
  batteries: number;
  launchers: { total: number; ready: number; reloading: number; offline: number };
}

export interface SettledReload {
  batteryId: string;
  launcher: Launcher;
}

export async function listBatteries(): Promise<Battery[]> {
  return blueBatteryRepository.findAll();
}

export async function getBattery(id: string): Promise<Battery | null> {
  return blueBatteryRepository.findById(id);
}

export async function getBlueStats(): Promise<BlueStats> {
  const batteries = await blueBatteryRepository.findAll();
  const all = batteries.flatMap((b) => b.launchers);
  const count = (s: LauncherStatus): number => all.filter((l) => l.status === s).length;
  return {
    batteries: batteries.length,
    launchers: { total: all.length, ready: count("ready"), reloading: count("reloading"), offline: count("offline") },
  };
}

export async function settleReloads(now: number = Date.now()): Promise<SettledReload[]> {
  const settled: SettledReload[] = [];
  for (const battery of await blueBatteryRepository.findAll()) {
    let changed = false;
    for (const launcher of battery.launchers) {
      if (launcher.status === "reloading" && launcher.readyAt !== undefined && launcher.readyAt <= now) {
        launcher.status = "ready";
        delete launcher.readyAt;
        settled.push({ batteryId: battery.id, launcher });
        changed = true;
      }
    }
    if (changed) await blueBatteryRepository.save(battery);
  }
  return settled;
}

export function startBlueReloadTicker(): void {
  setInterval(() => {
    settleReloads()
      .then(async (settled) => {
        for (const item of settled) broadcast("blue:launcher.updated", item);
        if (settled.length > 0) broadcast("blue:stats.updated", await getBlueStats());
      })
      .catch((err: unknown) => console.error("blue reload ticker", err));
  }, 1000);
}
