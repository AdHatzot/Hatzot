/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   yes
 * @updated  2026-09-09
 *
 * Intentionally empty — business logic lands here with the feed. Persistence
 * goes through repositories/alerts.repository.ts only; live changes go out
 * via broadcast() from ../ws. No Express types in here.
 */
import type { Location } from "../types";
import {
  getAlertStatus as getAlertStatusFromRepository,
  type AlertStatus,
} from "../repositories/alerts.repository";
import { readFile } from "fs/promises";
import booleanIntersects from "@turf/boolean-intersects";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import destination from "@turf/destination";
import distance from "@turf/distance";
import { lineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import polygonToLine from "@turf/polygon-to-line";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  MultiPolygon,
  Polygon,
} from "geojson";
import path from "path";
import { lineIntersect, pointToPolygonDistance } from "@turf/turf";

const DEFAULT_PREDICTION_WINDOW_SECONDS = 60;

export const getStatus = async (): Promise<{
  team: "alerts";
  status: "empty";
}> => ({
  team: "alerts",
  status: "empty",
});

export const getAlertStatus = async (): Promise<AlertStatus[]> =>
  getAlertStatusFromRepository();

export async function getCityZones(
  geojson: string,
): Promise<FeatureCollection<Geometry, GeoJsonProperties>> {
  const raw = await readFile(geojson, "utf-8");
  return JSON.parse(raw) as FeatureCollection<Geometry, GeoJsonProperties>;
}

export function getIntersectingCityZones(
  polygons: Feature<Polygon | MultiPolygon, GeoJsonProperties>[],
  location: Location,
  azimuth: number,
  velocity: number,
): Feature<Polygon | MultiPolygon, GeoJsonProperties>[] {
  if (azimuth < 0 || azimuth > 360 || !Number.isFinite(azimuth)) {
    throw new RangeError("Azimuth must be a number between 0 and 360 degrees.");
  }

  if (velocity < 0 || !Number.isFinite(velocity)) {
    throw new RangeError("Velocity must be a non-negative number in m/s.");
  }

  const path = lineString([
    [location.longitude, location.latitude],
    destination([location.longitude, location.latitude], 600000, azimuth, {
      units: "meters",
    }).geometry.coordinates,
  ]);

  return polygons.filter((polygon) => booleanIntersects(path, polygon));
}

export function getAlertableCityZones(
  polygons: Feature<Polygon | MultiPolygon, GeoJsonProperties>[],
  location: Location,
  velocity: number,
): Feature<Polygon | MultiPolygon, GeoJsonProperties>[] {
  if (velocity < 0 || !Number.isFinite(velocity)) {
    throw new RangeError("Velocity must be a non-negative number in m/s.");
  }

  const dronePoint = point([location.longitude, location.latitude]);

  return polygons.filter((polygon) => {
    const ttl = polygon.properties?.TTL;
    return (
      pointToPolygonDistance(dronePoint, polygon, { units: "meters" }) <= ttl
    );
  });
}
