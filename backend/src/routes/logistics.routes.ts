/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Mounted at /api/logistics by src/index.ts. Paths only — handlers live in
 * controllers/logistics.controller.ts.
 */
import { Router } from "express";
import * as logistics from "../controllers/logistics.controller";
import { asyncHandler } from "../shared/asyncHandler";

export const logisticsRoutes: Router = Router();

logisticsRoutes.get("/", asyncHandler(logistics.getStatus));
logisticsRoutes.get("/all", asyncHandler(logistics.getAll));
logisticsRoutes.get("/launchers/:id", asyncHandler(logistics.getLiveDeployments));
logisticsRoutes.post("/fireIntercept", asyncHandler(logistics.fireIntercept));
