/**
 * @team     core
 * @owner    all leads
 * @public   yes
 * @updated  2026-09-08
 *
 * FROZEN. Changing this file needs every team lead — it is the only vocabulary
 * shared across teams. Event names follow `<team>:<entity>.<action>`.
 */

export type Team = "red" | "blue" | "alerts" | "logistics" | "loop" | "polygon";

export type Owner = Team | "core";

export type EventName = `${Team}:${string}.${string}`;

export const TEAM_LABELS: Readonly<Record<Team, string>> = {
  red: "צד אדום",
  blue: "צד כחול",
  alerts: "התראות",
  logistics: "יצירת פריסה",
  loop: "סגירת מעגל",
  polygon: "אזורים"
};
