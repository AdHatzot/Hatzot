/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as interceptionsService from "../services/interceptions.service";
import { HttpError } from "../shared/httpError";

const MAX_TARGETS = 500;

/** POST /api/interceptions { droneIds: string[] } → the launches fired. */
export async function createInterception(
  req: Request,
  res: Response,
): Promise<void> {
  const droneIds = (req.body as { droneIds?: unknown } | undefined)?.droneIds;

  if (
    !Array.isArray(droneIds) ||
    droneIds.length === 0 ||
    droneIds.length > MAX_TARGETS ||
    !droneIds.every((id): id is string => typeof id === "string" && id.length > 0)
  ) {
    throw new HttpError(400, `droneIds must be a list of 1-${MAX_TARGETS} drone ids`);
  }

  res.status(201).json(await interceptionsService.interceptDrones(droneIds));
}
