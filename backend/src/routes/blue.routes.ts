/**
 * @team     blue
 * @owner    blue-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Mounted at /api/blue by src/index.ts. Paths only — handlers live in
 * controllers/blue.controller.ts.
 */
import { Router } from "express";
import * as blue from "../controllers/blue.controller";
import { asyncHandler } from "../shared/asyncHandler";

export const blueRoutes: Router = Router();

blueRoutes.get("/batteries", asyncHandler(blue.listBatteries));
blueRoutes.get("/batteries/:id", asyncHandler(blue.getBattery));
blueRoutes.get("/stats", asyncHandler(blue.getStats));
