/**
 * @team     blue
 * @owner    blue-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as blueService from "../services/blue.service";

export async function listBatteries(_req: Request, res: Response): Promise<void> {
  res.json(await blueService.listBatteries());
}

export async function getBattery(req: Request<{ id: string }>, res: Response): Promise<void> {
  const battery = await blueService.getBattery(req.params.id);
  if (!battery) {
    res.status(404).json({ error: "battery not found" });
    return;
  }
  res.json(battery);
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  res.json(await blueService.getBlueStats());
}
