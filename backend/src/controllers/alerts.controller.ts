/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-09
 *
 * HTTP in, JSON out. Parse the request, call the service, shape the response.
 * No business logic, no persistence.
 */
import type { Request, Response } from "express";
import * as alertsService from "../services/alerts.service";
import type { Location } from "../types";

export async function getStatus(_req: Request, res: Response): Promise<void> {
    res.json(await alertsService.getStatus());
}

export async function getAlertStatus(
    _req: Request,
    res: Response,
): Promise<void> {
    res.json(await alertsService.getAlertStatus());
}

export async function getCityZones(
    _req: Request,
    res: Response,
): Promise<void> {
    res.json(
        await alertsService.getCityZones(),
    );
}

export async function getAlertableCityZones(
    _req: Request,
    res: Response,
): Promise<void> {
    res.json(await alertsService.getAlertables());
}
export async function getAbleCityZones(
    req: Request,
    res: Response,
): Promise<void> {
    const requestedLocation = req.body?.location;
    const latitude = req.query?.latitude;
    const longitude = req.query?.longitude;
    const requestedHeading = req.body?.heading ?? req.query?.heading;

    if (
        requestedLocation === undefined &&
        (latitude === undefined || longitude === undefined) &&
        requestedHeading === undefined
    ) {
        res.json(await alertsService.getAlertables());
        return;
    }

    const location: Location = requestedLocation ?? {
        latitude: Number(latitude),
        longitude: Number(longitude),
    };
    const heading = Number(requestedHeading);

    res.json(await alertsService.getIntersecting(location, heading));
}
