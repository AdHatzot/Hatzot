/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as loopService from "../services/loop.service";

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await loopService.getStatus());
}
