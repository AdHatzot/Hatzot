/**
 * @team     interceptions
 * @owner    interceptions-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Mounted at /api/interceptions by src/index.ts. Paths only — handlers live in
 * controllers/interceptions.controller.ts.
 */
import { Router } from "express";
import * as interceptions from "../controllers/interceptions.controller";
import { asyncHandler } from "../shared/asyncHandler";

export const interceptionsRoutes: Router = Router();

interceptionsRoutes.post("/", asyncHandler(interceptions.createInterception));
