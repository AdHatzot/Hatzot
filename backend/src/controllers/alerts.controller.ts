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
<<<<<<< HEAD
    polygons: CityPolygon[];
    location: Location;
    azimuth: number;
=======
  polygons: CityPolygon[];
  location: Location;
  azimuth: number;
  velocity: number;
  predictionWindowSeconds?: number;
>>>>>>> 0a9665933dc5e23e1ce622dcd32cbcb8d0ab1980
};

type AlertableZonesBody = {
  polygons: CityPolygon[];
  location: Location;
  velocity: number;
};


export async function getStatus(_req: Request, res: Response): Promise<void> {
  res.json(await alertsService.getStatus());
}

export async function getAlertStatus(
    _req: Request,
    res: Response,
): Promise<void> {
<<<<<<< HEAD
    res.json(
        await alertsService.getCityZones(),
    );
=======
    res.json(await alertsService.getAlertStatus());
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
>>>>>>> 0a9665933dc5e23e1ce622dcd32cbcb8d0ab1980
}

/*
export async function getIntersectingCityZones(
  req: Request<Record<string, never>, unknown, IntersectingZonesBody>,
  res: Response,
): Promise<void> {
<<<<<<< HEAD
    const { polygons, location, azimuth } = req.body;
    res.json(
        alertsService.getIntersectingCityZones(polygons, location, azimuth),
    );
=======
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
>>>>>>> 0a9665933dc5e23e1ce622dcd32cbcb8d0ab1980
}

*/
export async function getAlertableCityZones(
<<<<<<< HEAD
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
=======
  req: Request<Record<string, never>, unknown, AlertableZonesBody>,
  res: Response,
): Promise<void> {
  const { polygons, location, velocity } = req.body;
  res.json(alertsService.getAlertableCityZones(polygons, location, velocity));
>>>>>>> 0a9665933dc5e23e1ce622dcd32cbcb8d0ab1980
}
