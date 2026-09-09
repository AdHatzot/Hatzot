/**
 * @team     blue
 * @owner    blue-lead
 * @public   no
 * @updated  2026-09-09
 *
 * Seed rows for the in-memory adapter. Replaced by the real feed when it
 * arrives; with TypeORM this becomes a migration or a seed script.
 */
import type { Battery, Launcher, MissileKind } from "../entities/blue.entity";

const startedAt = Date.now();
const ready = (id: string, kind: MissileKind, rounds: number): Launcher => ({ id, kind, rounds, status: "ready" });
const offline = (id: string, kind: MissileKind): Launcher => ({ id, kind, rounds: 0, status: "offline" });
const reloading = (id: string, kind: MissileKind, rounds: number, seconds: number): Launcher => ({
  id, kind, rounds, status: "reloading", readyAt: startedAt + seconds * 1000,
});

export const BATTERIES: Battery[] = [
  { id: "btry-kiryat-shmona", name: "סוללת קריית שמונה", lat: 33.2072, lng: 35.5695, rangeM: 40_000,
    launchers: [ready("L1", "IronHook", 12), ready("L2", "IronHook", 8), reloading("L3", "ShieldNest", 6, 90), ready("L4", "ShieldNest", 6)] },
  { id: "btry-haifa", name: "סוללת חיפה", lat: 32.794, lng: 34.9896, rangeM: 45_000,
    launchers: [ready("L1", "IronHook", 10), ready("L2", "IronHook", 10), ready("L3", "ShieldNest", 4), offline("L4", "ShieldNest")] },
  { id: "btry-netanya", name: "סוללת נתניה", lat: 32.3215, lng: 34.8532, rangeM: 35_000,
    launchers: [ready("L1", "IronHook", 12), reloading("L2", "ShieldNest", 6, 45)] },
  { id: "btry-tel-aviv", name: "סוללת גוש דן", lat: 32.0853, lng: 34.7818, rangeM: 50_000,
    launchers: [ready("L1", "IronHook", 12), ready("L2", "IronHook", 12), ready("L3", "ShieldNest", 8), ready("L4", "ShieldNest", 8)] },
  { id: "btry-ashdod", name: "סוללת אשדוד", lat: 31.8014, lng: 34.6435, rangeM: 40_000,
    launchers: [ready("L1", "IronHook", 6), reloading("L2", "IronHook", 0, 120), ready("L3", "ShieldNest", 5)] },
  { id: "btry-beer-sheva", name: "סוללת באר שבע", lat: 31.253, lng: 34.7915, rangeM: 45_000,
    launchers: [ready("L1", "IronHook", 12), ready("L2", "ShieldNest", 8), ready("L3", "ShieldNest", 8)] },
  { id: "btry-dimona", name: "סוללת דימונה", lat: 31.0686, lng: 35.0333, rangeM: 30_000,
    launchers: [offline("L1", "IronHook"), offline("L2", "ShieldNest")] },
  { id: "btry-eilat", name: "סוללת אילת", lat: 29.5581, lng: 34.9482, rangeM: 35_000,
    launchers: [ready("L1", "IronHook", 9), ready("L2", "ShieldNest", 7)] },
];
