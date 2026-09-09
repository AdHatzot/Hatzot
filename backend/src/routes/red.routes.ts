/**
 * @team     red
 * @owner    red-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Mounted at /api/red by src/index.ts. Paths only — handlers live in
 * controllers/red.controller.ts.
 */
import { Router } from "express";
import * as red from "../controllers/red.controller";
import { asyncHandler } from "../shared/asyncHandler";

export const redRoutes: Router = Router();

redRoutes.get("/", asyncHandler(red.getStatus));
