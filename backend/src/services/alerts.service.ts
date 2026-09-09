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
import { readFile } from "fs/promises";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "alerts", status: "empty" };
}

export async function getCityZones(
  geojson: string,
): Promise<FeatureCollection<Geometry, GeoJsonProperties>> {
  const raw = await readFile(geojson, "utf-8");
  return JSON.parse(raw) as FeatureCollection<Geometry, GeoJsonProperties>;
}
