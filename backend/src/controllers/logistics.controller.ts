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

export const getAllLaunchers = async (
  _req: Request,
  res: Response,
) => {
  const launchers = await logisticsService.getAllLaunchers();

  res.status(200).json(launchers);
}

export const getLauncherById = async (
  req: Request,
  res: Response,
) => {
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
}

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
      res
        .status(400)
        .json({ error: "deployment id must be a positive integer" });
      return;
    }

    const data = await logisticsService.getLiveDeployments(deploymentId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving launcher data", error });
  }
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
