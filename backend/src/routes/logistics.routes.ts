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
logisticsRoutes.post("/fire-intercept", asyncHandler(logistics.fireIntercept));
logisticsRoutes.get(
  "/launchers",
  asyncHandler(logistics.getAllLiveLaunchers),
);
logisticsRoutes.get(
  "/launcher-types",
  asyncHandler(logistics.getAllLauncherTypes),
);
logisticsRoutes.get(
  "/interceptor-types",
  asyncHandler(logistics.getAllInterceptorTypes),
);
logisticsRoutes.get(
    "/launcher",
    asyncHandler(logistics.getLauncherById),
);
logisticsRoutes.get(
  "/deployments",
  asyncHandler(logistics.getAllDeployments),
);
logisticsRoutes.get(
  "/deployments/live",
  asyncHandler(logistics.getRealDeployment),
);
logisticsRoutes.get(
  "/deployments/:id",
  asyncHandler(logistics.getDeploymentById),
);
logisticsRoutes.post(
  "/deployments",
  asyncHandler(logistics.createDeployment),
);
logisticsRoutes.patch(
  "/deployments",
  asyncHandler(logistics.updateDeploymentStatusController),
);