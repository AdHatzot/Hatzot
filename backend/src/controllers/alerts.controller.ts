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
    velocity: number;
    predictionWindowSeconds?: number;
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
        await alertsService.getCityZones(
            path.join(__dirname, "../db/assets/cities/CITIES.geojson"),
        ),
    );
}

export async function getIntersectingCityZones(
    req: Request<Record<string, never>, unknown, IntersectingZonesBody>,
    res: Response,
): Promise<void> {
    const { polygons, location, azimuth, velocity, predictionWindowSeconds } =
        req.body;
    res.json(
        alertsService.getIntersectingCityZones(
            polygons,
            location,
            azimuth,
            velocity,
            predictionWindowSeconds,
        ),
    );
}

export async function getAlertableCityZones(
    req: Request<Record<string, never>, unknown, AlertableZonesBody>,
    res: Response,
): Promise<void> {
    const { polygons, location, velocity } = req.body;
    res.json(alertsService.getAlertableCityZones(polygons, location, velocity));
}
