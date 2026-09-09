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
import * as shapefile from "shapefile";
import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from "geojson";

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "alerts", status: "empty" };
}

export async function getCityZones(
  shpPath: string,
  dbfPath: string,
): Promise<FeatureCollection<Geometry, GeoJsonProperties>> {
  const source = await shapefile.open(shpPath, dbfPath);

  const features: Feature<Geometry, GeoJsonProperties>[] = [];
  let result = await source.read();

  while (!result.done) {
    features.push(result.value as Feature<Geometry, GeoJsonProperties>);
    result = await source.read();
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
