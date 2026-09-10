/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 */
import type { InterceptionLaunch } from "./types";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/**
 * Fire at these drones. Resolves with one launch per drone that could be
 * engaged; drones already under fire or no longer tracked are skipped.
 */
export async function requestInterception(droneIds: string[]): Promise<InterceptionLaunch[]> {
  const response = await fetch(`${API_URL}/api/interceptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ droneIds }),
  });
  if (!response.ok) {
    throw new Error(`POST /api/interceptions failed with ${response.status}`);
  }
  return (await response.json()) as InterceptionLaunch[];
}
