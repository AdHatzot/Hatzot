/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as logisticsService from "../services/logistics.service";
import { HttpError } from "../shared/httpError";
import { DeploymentStatus } from "../db/entities/deployment.entity";

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await logisticsService.getStatus());
}

export async function fireIntercept(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as {
    launcher_id?: unknown;
    interceptor_type_id?: unknown;
  };
  const launcherId = body?.launcher_id;
  const interceptorTypeId = body?.interceptor_type_id;

  if (
    typeof launcherId !== "number" ||
    !Number.isSafeInteger(launcherId) ||
    launcherId < 1 ||
    typeof interceptorTypeId !== "number" ||
    !Number.isSafeInteger(interceptorTypeId) ||
    interceptorTypeId < 1
  ) {
    throw new HttpError(
      400,
      "launcher_id and interceptor_type_id must be positive integers",
    );
  }

  res.json(
    await logisticsService.fireIntercept({
      launcherId,
      interceptorTypeId,
    }),
  );
}

export async function getAll(_req: Request, res: Response): Promise<void> {
  res.json(await logisticsService.getAll());
}

export async function getLiveDeployments(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const deploymentId = req.query.id !== undefined ? Number(req.query.id) : 1;

    if (!Number.isInteger(deploymentId) || deploymentId < 1) {
      res.status(400).json({ error: "deployment id must be a positive integer" });
      return;
    }

    const data = await logisticsService.getLiveDeployments(deploymentId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving launcher data", error });
  }
}

export async function getAllLauncherTypes(_req: Request, res: Response): Promise<void> {
  res.json(await logisticsService.getAllLauncherTypes());
}

export async function getAllInterceptorTypes(_req: Request, res: Response): Promise<void> {
  res.json(await logisticsService.getAllInterceptorTypes());
}

export async function getLauncherById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const launcherId = req.query.id !== undefined ? Number(req.query.id) : 1;
  const launcher = await logisticsService.getLauncherById(launcherId);
  if (!launcher) {
    res.status(404).json({ error: "Launcher not found" });
    return;
  }
  res.json(launcher);
}

export async function getAllDeployments(_req: Request, res: Response): Promise<void> {
  res.json(await logisticsService.getAllDeployments());
}

export async function getDeploymentById(req: Request, res: Response): Promise<void> {
  try {
    const rawId = Number(req.params.id);

    if (!Number.isInteger(rawId) || rawId < 1) {
      res.status(400).json({ error: "deployment id must be a positive integer" });
      return;
    }

    const deployment = await logisticsService.getDeploymentById(rawId);

    if (!deployment) {
      res.status(404).json({ error: `Deployment with ID ${rawId} not found` });
      return;
    }

    res.json(deployment);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving deployment details", error });
  }
}

export async function createDeployment(req: Request, res: Response): Promise<void> {
  try {
    const { name, status } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "name is required and must be a non-empty string" });
      return;
    }

    if (!status || !Object.values(DeploymentStatus).includes(status)) {
      res.status(400).json({
        error: `status is required and must be one of: ${Object.values(DeploymentStatus).join(", ")}`,
      });
      return;
    }

    // 2. Insert into DB via service
    const createdDeployment = await logisticsService.createDeployment({
      name: name.trim(),
      status: status as DeploymentStatus,
    });

    // 3. Return 201 Created with the new deployment
    res.status(201).json(createdDeployment);
  } catch (error) {
    res.status(500).json({ message: "Error creating deployment", error });
  }
}