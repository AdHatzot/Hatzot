/**
 * @team     core
 * @owner    all leads
 * @public   yes
 * @updated  2026-09-09
 *
 * Mirrors client/src/types/events.ts — keep the two identical.
 */
export type Team = "red" | "blue" | "alerts" | "logistics" | "loop";

export type EventName = `${Team}:${string}.${string}`;
