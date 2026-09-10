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
import path from "path";
import type {
    Feature,
    GeoJsonProperties,
    MultiPolygon,
    Polygon,
} from "geojson";
import type { Location } from "../types";

type CityPolygon = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

type IntersectingZonesBody = {
    polygons: CityPolygon[];
    location: Location;
    azimuth: number;
};

type AlertableZonesBody = {
    polygons: CityPolygon[];
    location: Location;
    velocity: number;
};

export async function getStatus(_req: Request, res: Response): Promise<void> {
    res.json(await alertsService.getStatus());
}

export async function getCityZones(
    _req: Request,
    res: Response,
): Promise<void> {
    res.json(
        await alertsService.getCityZones(),
    );
}

/*
export async function getIntersectingCityZones(
    req: Request<Record<string, never>, unknown, IntersectingZonesBody>,
    res: Response,
): Promise<void> {
    const { polygons, location, azimuth } = req.body;
    res.json(
        alertsService.getIntersectingCityZones(polygons, location, azimuth),
    );
}

*/
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
    const location: Location = req.body?.location ?? {
        latitude: Number(req.query?.latitude ?? 0),
        longitude: Number(req.query?.longitude ?? 0),
    };
    const heading: number = Number(req.body?.heading ?? req.body?.azimuth ?? req.query?.heading ?? req.query?.azimuth ?? 0);
    res.json(await alertsService.getIntersecting(location, heading));
}
