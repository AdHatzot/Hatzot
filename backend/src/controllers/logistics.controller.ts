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

export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await logisticsService.getStatus());
}

export async function fireIntercept(req: Request, res: Response): Promise<void> {
  const { launcher_id: launcherId, interceptor_type_id: interceptorTypeId } =
    req.body as {
      launcher_id?: unknown;
      interceptor_type_id?: unknown;
    };

  if (
    (typeof launcherId !== "string" && typeof launcherId !== "number") ||
    (typeof launcherId === "number" && !Number.isInteger(launcherId)) ||
    (typeof interceptorTypeId !== "number" &&
      typeof interceptorTypeId !== "string") ||
    (typeof interceptorTypeId === "string" &&
      !Number.isInteger(Number(interceptorTypeId))) ||
    (typeof interceptorTypeId === "number" &&
      !Number.isInteger(interceptorTypeId)) ||
    (typeof interceptorTypeId === "string" && interceptorTypeId.trim() === "") ||
    (typeof launcherId === "string" && launcherId.trim() === "") ||
    Number(interceptorTypeId) < 1 ||
    Number.isNaN(Number(interceptorTypeId))
  ) {
    res.status(400).json({
      error: "launcher_id and interceptor_type_id are required",
    });
    return;
  }

  res.json(
    await logisticsService.fireIntercept({
      launcherId: String(launcherId),
      interceptorTypeId: Number(interceptorTypeId),
    })
  );
}
