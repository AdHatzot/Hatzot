/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — business logic lands here with the feed. Persistence
 * goes through repositories/loop.repository.ts only; live changes go out
 * via broadcast() from ../ws. No Express types in here.
 */
import type { Team } from "../types";

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "loop", status: "empty" };
}
