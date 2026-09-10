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

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await loopService.getStatus());
}

export async function listActive(_req: Request, res: Response): Promise<void> {
  res.json(await loopService.getActiveInterceptions());
}

export async function listClosed(_req: Request, res: Response): Promise<void> {
  res.json(await loopService.getClosedInterceptions());
}

export async function listAll(_req: Request, res: Response): Promise<void> {
  res.json(await loopService.getAllInterceptions());
}

export async function getById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const event = await loopService.getInterceptionById(req.params.id);
  if (!event) {
    res.status(404).json({ error: "interception not found" });
    return;
  }
  res.json(event);
}