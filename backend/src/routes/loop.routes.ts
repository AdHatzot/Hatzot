/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Mounted at /api/loop by src/index.ts. Paths only — handlers live in
 * controllers/loop.controller.ts.
 */
import { Router } from "express";
import * as loop from "../controllers/loop.controller";
import { asyncHandler } from "../shared/asyncHandler";

export const loopRoutes: Router = Router();

loopRoutes.get("/", asyncHandler(loop.getStatus));
loopRoutes.get("/active", asyncHandler(loop.listActive));
loopRoutes.get("/closed", asyncHandler(loop.listClosed));
loopRoutes.get("/all", asyncHandler(loop.listAll));
loopRoutes.get("/:id", asyncHandler(loop.getById));