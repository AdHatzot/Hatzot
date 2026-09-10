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
import * as loopService from "../services/loop.service";
import { HttpError } from "../shared/httpError";

function parseTimestamp(value: unknown, name: string): Date | null {
  if (value === undefined) return null;

  const date = typeof value === "string" && value.trim() !== "" ? new Date(value) : null;
  if (date === null || Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${name} must be an ISO 8601 timestamp`);
  }
  return date;
}

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await loopService.getStatus());
}

/** GET /api/loop/interceptions?from=<ISO>&to=<ISO> — both optional. */
export async function getInterceptionLog(req: Request, res: Response): Promise<void> {
  const from = parseTimestamp(req.query.from, "from");
  const to = parseTimestamp(req.query.to, "to");
  res.json(await loopService.getInterceptionLog(from, to));
}
