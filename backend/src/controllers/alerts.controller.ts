/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as alertsService from "../services/alerts.service";
import path from "path";

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await alertsService.getStatus());
}

export async function getCityZones(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await alertsService.getCityZones(
      path.join(__dirname, "../db/assets/cities/CITIES.shp"),
      path.join(__dirname, "../db/assets/cities/CITIES.dbf"),
    ),
  );
}
