/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as interceptionsService from "../services/interceptions.service";

export async function createInterception(
  req: Request,
  res: Response,
): Promise<void> {
  const { drones_id } = req.body;

  res.status(201).json(await interceptionsService.createInterception(drones_id));
}
