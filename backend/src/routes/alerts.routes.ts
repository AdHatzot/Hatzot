/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Mounted at /api/alerts by src/index.ts. Paths only — handlers live in
 * controllers/alerts.controller.ts.
 */
import { Router } from "express";
import * as alerts from "../controllers/alerts.controller";
import { asyncHandler } from "../shared/asyncHandler";

export const alertsRoutes: Router = Router();

alertsRoutes.get("/", asyncHandler(alerts.getStatus));
alertsRoutes.get("/status", asyncHandler(alerts.getAlertStatus));
alertsRoutes.get("/cities", asyncHandler(alerts.getCityZones));
alertsRoutes.post(
    "/cities/intersections",
    asyncHandler(alerts.getIntersectingCityZones),
);
alertsRoutes.post(
    "/cities/alertable",
    asyncHandler(alerts.getAlertableCityZones),
);
