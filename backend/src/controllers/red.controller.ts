/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as redService from "../services/red.service";

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await redService.getStatus());
}
