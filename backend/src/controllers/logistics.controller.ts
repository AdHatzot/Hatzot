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

export const getAllLaunchers = async (req: Request<{ id: string }>, res: Response) => {
  const deploymentId = Number(req.query.id);
  const launchers = await logisticsService.getAllLaunchers(deploymentId);

  res.status(200).json(launchers);
};

export const getLauncherById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const launcher = await logisticsService.getLauncherById(
    req.params.id,
  );

  if (!launcher) {
    res.status(404).json({
      message: "Launcher not found",
    });
    return;
  }

  res.status(200).json(launcher);
};

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

  const result = await logisticsService.fireIntercept({
    launcherId,
    interceptorTypeId,
  });

  res
    .type("text/plain")
    .send(
      `Interceptor ${result.interceptorTypeId} in launcher ${result.launcherId} was fired successfully.`,
    );
}

export async function getAllLiveLaunchers(req: Request, res: Response): Promise<void> {
  const deploymentId = Number(req.query.id);
  res.json(await logisticsService.getLiveLaunchersByDeploymentId(deploymentId));
}

export async function getAllLauncherTypes(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await logisticsService.getAllLauncherTypes());
}

export async function getAllInterceptorTypes(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await logisticsService.getAllInterceptorTypes());
}

export async function getLiveLauncherByDeploymentId(req: Request<{ id: string }>, res: Response): Promise<void> {
  const deploymentId = Number(req.query.id);
  const launchers = await logisticsService.getLiveLaunchersByDeploymentId(deploymentId);
  if (!launchers) {
    res.status(404).json({ error: "Launcher not found" });
    return;
  }
  res.json(launchers);
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

export async function updateDeploymentStatusController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id, status } = req.body;
    const deploymentId = Number(id);

    // Validate ID
    if (!Number.isInteger(deploymentId) || deploymentId < 1) {
      res.status(400).json({ error: "deployment id must be a positive integer" });
      return;
    }

    // Validate Status
    if (!status || !Object.values(DeploymentStatus).includes(status)) {
      res.status(400).json({
        error: `status is required and must be one of: ${Object.values(DeploymentStatus).join(", ")}`,
      });
      return;
    }

    const updatedDeployment = await logisticsService.updateDeploymentStatus(deploymentId, status as DeploymentStatus);
    res.json(updatedDeployment);

  } catch (error: any) {
    if (error.message?.startsWith("NOT_FOUND")) {
      res.status(404).json({ error: error.message.replace("NOT_FOUND: ", "") });
      return;
    }
    res.status(500).json({ message: "Error updating deployment status", error: error.message });
  }
}

export async function getRealDeployment(_req: Request, res: Response): Promise<void> {
  try {
    const deployment = await logisticsService.getRealDeployment();

    if (!deployment) {
      res.status(404).json({ error: "No active real deployment found" });
      return;
    }

    res.json(deployment);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching real deployment", error: error.message });
  }
}

export async function createDeployment(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as {
    name?: unknown;
    rows?: unknown;
  };

  if (typeof body?.name !== "string" || body.name.trim().length === 0) {
    throw new HttpError(400, "name must be a non-empty string");
  }

  if (!Array.isArray(body?.rows) || body.rows.length === 0) {
    throw new HttpError(400, "rows must be a non-empty array");
  }

  const parsedRows = body.rows.map((row: Record<string, unknown>, index: number) => {
    const launcherTypeName = row?.launcher_type_name;
    const longitude = Number(row?.longitude);
    const latitude = Number(row?.latitude);
    const asl = Number(row?.asl);
    const agl = Number(row?.agl);
    const amount = Number(row?.amount);

    if (typeof launcherTypeName !== "string" || launcherTypeName.trim().length === 0) {
      throw new HttpError(400, `Row ${index + 1}: launcher_type_name is required`);
    }
    if (!Number.isFinite(longitude)) {
      throw new HttpError(400, `Row ${index + 1}: longitude must be a valid number`);
    }
    if (!Number.isFinite(latitude)) {
      throw new HttpError(400, `Row ${index + 1}: latitude must be a valid number`);
    }
    if (!Number.isFinite(asl)) {
      throw new HttpError(400, `Row ${index + 1}: asl must be a valid number`);
    }
    if (!Number.isFinite(agl)) {
      throw new HttpError(400, `Row ${index + 1}: agl must be a valid number`);
    }
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
      throw new HttpError(400, `Row ${index + 1}: amount must be a non-negative integer`);
    }

    return {
      launcher_type_name: launcherTypeName.trim(),
      longitude,
      latitude,
      asl,
      agl,
      amount,
    };
  });

  const result = await logisticsService.createDeployment({
    name: body.name.trim(),
    rows: parsedRows,
  });

  res.status(201).json(result);
}

export const deployment = createDeployment;
