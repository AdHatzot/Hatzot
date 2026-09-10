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
import type { Team } from "../types";
import type { Location } from "../types";
import { createClient, type RedisClientType } from "redis";
import { getDrones } from "./drones.service";
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

const CITIES_GEOJSON_PATH =
    process.env.CITIES_GEOJSON ??
    path.join(process.cwd(), "src", "db", "assets", "cities", "CITIES.geojson");

const INFINITE_LINE_DISTANCE_KILOMETERS = 20_040;
const REDIS_ALERT_KEY_PREFIX = "siren";

let citiesPromise: Promise<
  FeatureCollection<Geometry, GeoJsonProperties>
> | null = null;
let redisClient: RedisClientType | null = null;
let redisConnection: Promise<RedisClientType> | null = null;

async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient?.isReady) return redisClient;

  if (!redisConnection) {
    const client = createClient({
      url: process.env.REDIS_URL ?? "redis://localhost:6379",
    });
    client.on("error", (error: unknown) => {
      console.error("Redis client error", error);
    });
    redisConnection = client.connect().then(() => {
      redisClient = client;
      return client;
    });
  }

  return redisConnection;
}

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "alerts", status: "empty" };
}

export async function getCityZones(
    geojson: string = CITIES_GEOJSON_PATH,
): Promise<FeatureCollection<Geometry, GeoJsonProperties>> {
  citiesPromise ??= readFile(geojson, "utf-8").then(
    (raw) => JSON.parse(raw) as FeatureCollection<Geometry, GeoJsonProperties>,
  );
  return citiesPromise;
}

export async function getDrones(): Promise<CurrentDrone[]> {
  return findCurrentDrones();
}

export async function cacheDroneAlerts(geojson: string): Promise<void> {
  const [cityZones, drones] = await Promise.all([
    getCityZones(geojson),
    getDrones(),
  ]);
  const polygons = cityZones.features as Feature<Polygon, GeoJsonProperties>[];
  const alerts = new Map<string, number>();

  for (const drone of drones) {
    const intersecting = getIntersectingCityZones(
      polygons,
      drone.location,
      drone.heading,
    );
    const alertable = getAlertableCityZones(
      intersecting,
      drone.location,
      drone.velocity,
    );

    for (const polygon of alertable) {
      const cityId = polygon.properties?.CITY_ID;
      const ttl = polygon.properties?.TTL;
      if (typeof cityId !== "number" && typeof cityId !== "string") {
        throw new Error("Every polygon must have a CITY_ID.");
      }
      if (typeof ttl !== "number" || !Number.isFinite(ttl) || ttl < 0) {
        throw new RangeError(
          "Every polygon must have a non-negative TTL in seconds.",
        );
      }

      const key = String(cityId);
      const existing = alerts.get(key);
      if (existing === undefined || ttl > existing) alerts.set(key, ttl);
    }
  }

  const redis = await getRedisClient();
  await Promise.all(
    [...alerts.entries()]
      .filter(([, ttl]) => ttl > 0)
      .map(([cityId, ttl]) =>
        redis.set(`${REDIS_ALERT_KEY_PREFIX}${cityId}`, cityId, {
          EX: Math.ceil(ttl),
        }),
      ),
  );

export async function cacheDroneAlerts(): Promise<void> {
    const [cityZones, drones] = await Promise.all([
        getCityZones(),
        getDrones(),
    ]);
    const polygons = cityZones.features as Feature<
        Polygon,
        GeoJsonProperties
    >[];

    for (const drone of drones) {
        const intersecting = getIntersectingCityZones(
            polygons,
            drone.location,
            drone.heading,
        );
        const alertable = getAlertableCityZones(
            intersecting,
            drone.location,
            drone.velocity,
        );

        for (const polygon of alertable) {
            const cityId = polygon.properties?.CITY_ID;
            const ttl = polygon.properties?.TTL;
            if (typeof cityId !== "number" && typeof cityId !== "string") {
                throw new Error("Every polygon must have a CITY_ID.");
            }
            if (typeof ttl !== "number" || !Number.isFinite(ttl) || ttl < 0) {
                throw new RangeError(
                    "Every polygon must have a non-negative TTL in seconds.",
                );
            }

            const redis = await getRedisClient();

            redis.set(`${REDIS_ALERT_KEY_PREFIX}:${cityId}`, cityId, {
                EX: ttl,
                NX: true,
            });
        }
    }
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
    destination(
      [location.longitude, location.latitude],
      INFINITE_LINE_DISTANCE_KILOMETERS,
      (azimuth + 180) % 360,
      { units: "kilometers" },
    ).geometry.coordinates,
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

    if (typeof ttl !== "number" || ttl < 0 || !Number.isFinite(ttl)) {
      throw new RangeError(
        "Every polygon must have a non-negative TTL in seconds.",
      );
    }

    if (booleanPointInPolygon(dronePoint, polygon)) {
      return 0 <= ttl;
    }

    const boundary = polygonToLine(polygon);
    const boundaryLines =
      boundary.type === "FeatureCollection" ? boundary.features : [boundary];
    const distanceToIntersection = Math.min(
      ...boundaryLines.map((boundaryLine) =>
        distance(dronePoint, nearestPointOnLine(boundaryLine, dronePoint), {
          units: "meters",
        }),
      ),
    );
    const secondsUntilIntersection =
      velocity === 0
        ? Number.POSITIVE_INFINITY
        : distanceToIntersection / velocity;

    return secondsUntilIntersection <= ttl;
  });
}

const DRONE_ALERTS_INTERVAL_MS = 2_000;

export function startDroneAlertsTicker(): void {
    setInterval(() => {
        cacheDroneAlerts().catch((err: unknown) =>
            console.error("drone alerts ticker", err),
        );
    }, DRONE_ALERTS_INTERVAL_MS);
}
