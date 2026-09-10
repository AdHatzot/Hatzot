/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — business logic lands here with the feed. Persistence
 * goes through repositories/logistics.repository.ts only; live changes go out
 * via broadcast() from ../ws. No Express types in here.
 */
import type { Team } from "../types";
import {
  fireIntercept as fireInterceptInRepository,
  type FireInterceptRequest,
} from "../repositories/logistics.repository";
import { dataSource } from "../db/data-source";
import { LiveLauncher } from "../db/entities/liveLauncher.entity";

export async function getStatus(): Promise<{ team: Team; status: string }> {
  return { team: "logistics", status: "empty" };
}

export async function fireIntercept(
  request: FireInterceptRequest
): Promise<{ launcherId: string; interceptorTypeId: number }> {
  const result = await fireInterceptInRepository(request);

  setTimeout(() => {
    void dataSource
      .getRepository(LiveLauncher)
      .update({ id: result.launcherId }, { active: true })
      .catch((error: unknown) => {
        console.error("Failed to reactivate launcher", error);
      });
  }, result.reloadTimeS * 1000);

  return {
    launcherId: result.launcherId,
    interceptorTypeId: result.interceptorTypeId,
  };
}
