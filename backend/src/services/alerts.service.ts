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
import booleanIntersects from "@turf/boolean-intersects";
import destination from "@turf/destination";
import { lineString, point } from "@turf/helpers";
import { pointToPolygonDistance } from "@turf/turf";
import { readFile } from "fs/promises";
import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
    MultiPolygon,
    Polygon,
} from "geojson";
import path from "path";
import { redis } from "../redis/redis.client";
import {
    getAlertStatus as getAlertStatusFromRepository,
    type AlertStatus,
} from "../repositories/alerts.repository";
import type { Location } from "../types";
import { getDrones } from "./drones.service";

const CITIES_GEOJSON_PATH =
  process.env.CITIES_GEOJSON ??
  path.join(process.cwd(), "src", "db", "assets", "cities", "CITIES.geojson");

const INFINITE_LINE_DISTANCE_KILOMETERS = 20_040;
const REDIS_ALERT_KEY_PREFIX = "siren:";
const REDIS_THREATENED_KEY_PREFIX = "threatened:";

let citiesSingleton: FeatureCollection<Geometry, GeoJsonProperties> | null =
  null;

export async function getCityZones(): Promise<
  FeatureCollection<Geometry, GeoJsonProperties>
> {
  if (!citiesSingleton) {
    const raw = await readFile(CITIES_GEOJSON_PATH, "utf-8");
    citiesSingleton = JSON.parse(raw) as FeatureCollection<
      Geometry,
      GeoJsonProperties
    >;
  }
  return citiesSingleton;
}

const getRedisClient = async () => {
  if (!redis.isReady) {
    throw new Error("Redis client is not connected");
  }

  return redis;
};

export const getStatus = async (): Promise<{
  team: "alerts";
  status: "empty";
}> => ({
  team: "alerts",
  status: "empty",
});

export const getAlertStatus = async (): Promise<AlertStatus[]> =>
  getAlertStatusFromRepository();

export async function getAlertables(): Promise<
  Feature<Polygon | MultiPolygon, GeoJsonProperties>[]
> {
  const [cityZones, drones] = await Promise.all([getCityZones(), getDrones()]);

  const polygons = cityZones.features.filter(
    (feature): feature is Feature<Polygon | MultiPolygon, GeoJsonProperties> =>
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon",
  );

  return drones.flatMap((drone) =>
    getAlertableCityZones(
      getIntersectingCityZones(polygons, drone.location, drone.heading),
      drone.location,
      drone.velocity,
    ),
  );
}
export async function cacheDroneAlerts(): Promise<void> {
  const redis = await getRedisClient();
  const alertable = await getAlertables();
  const now = Math.floor(Date.now() / 1000);
  const alertsByCity = new Map<
    number,
    Feature<Polygon | MultiPolygon, GeoJsonProperties>
  >();

  for (const polygon of alertable) {
    const cityId = polygon.properties?.CITY_ID;
    if (typeof cityId !== "number" || !Number.isInteger(cityId)) {
      continue;
    }

    alertsByCity.set(cityId, polygon);
  }

  for (const [cityId, polygon] of alertsByCity) {
    const ttlSeconds = polygon.properties?.TTL;
    const cityName = polygon.properties?.CITY_NAME;
    if (
      typeof ttlSeconds !== "number" ||
      !Number.isInteger(ttlSeconds) ||
      ttlSeconds <= 0 ||
      typeof cityName !== "string" ||
      cityName.length === 0
    ) {
      continue;
    }

    const key = `${REDIS_ALERT_KEY_PREFIX}${cityId}`;
    const threatenedKey = `${REDIS_THREATENED_KEY_PREFIX}${cityId}`;
    if ((await redis.exists(key)) === 1) {
      await redis.del(threatenedKey);
      continue;
    }

    if ((await redis.exists(threatenedKey)) === 1) {
      continue;
    }

    const result = await redis.sendCommand([
      "JSON.SET",
      key,
      "$",
      JSON.stringify({ cityId, cityName, timestamp: now }),
      "NX",
    ]);

    if (String(result) === "OK") {
      await redis.expire(key, ttlSeconds);
    }
  }
}

export async function getIntersecting(
  location: Location,
  azimuth: number,
): Promise<Feature<Polygon | MultiPolygon, GeoJsonProperties>[]> {
  const cityZones = await getCityZones();
  const polygons = cityZones.features as Feature<
    Polygon | MultiPolygon,
    GeoJsonProperties
  >[];
  return getIntersectingCityZones(polygons, location, azimuth);
}

export function getIntersectingCityZones(
  polygons: Feature<Polygon | MultiPolygon, GeoJsonProperties>[],
  location: Location,
  azimuth: number,
): Feature<Polygon | MultiPolygon, GeoJsonProperties>[] {
  if (azimuth < 0 || azimuth > 360 || !Number.isFinite(azimuth)) {
    throw new RangeError("Azimuth must be a number between 0 and 360 degrees.");
  }

  const path = lineString([
    point([location.longitude, location.latitude]).geometry.coordinates,
    destination(
      [location.longitude, location.latitude],
      INFINITE_LINE_DISTANCE_KILOMETERS,
      azimuth,
      { units: "kilometers" },
    ).geometry.coordinates,
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
      pointToPolygonDistance(dronePoint, polygon, { units: "meters" }) /
        velocity <=
      ttl
    );
  });
}

const DRONE_ALERTS_INTERVAL_MS = 2_000;

export const startDroneAlertsTicker = (): void => {
  void cacheDroneAlerts().catch((err: unknown) =>
    console.error("initial drone alerts cache", err),
  );

  setInterval(() => {
    cacheDroneAlerts().catch((err: unknown) =>
      console.error("drone alerts ticker", err),
    );
  }, DRONE_ALERTS_INTERVAL_MS);
};
