/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Read-only access to the interception log. One raw SQL query rather than
 * TypeORM relations: the join spans tables other teams own (launchers,
 * interceptor types, drones), and there is no loop entity registered in
 * db/data-source.ts — so this file stays independent of their entity files.
 */
import config from "../config";
import { dataSource } from "../db/data-source";

/** Mirrors hatzot.interception_status / hatzot.interception_result in the DDL. */
export type InterceptionStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "ABORTED";
export type InterceptionResult = "HIT" | "MISS";

/** One flat row per interception, as selected below. */
export interface InterceptionLogRow {
  id: string;
  launchedAt: Date;
  status: InterceptionStatus;
  result: InterceptionResult | null;
  priority: number;
  interceptLatitude: number | null;
  interceptLongitude: number | null;
  launcherId: string;
  launcherType: string | null;
  launcherLatitude: number | null;
  launcherLongitude: number | null;
  launcherRangeM: number | null;
  interceptorTypeId: number;
  interceptorType: string | null;
  interceptorRangeM: number | null;
  droneId: string;
  droneType: string | null;
  droneLatitude: number | null;
  droneLongitude: number | null;
}

// Raw queries bypass the DataSource's `schema` option, so every table is
// qualified by hand. DB_SCHEMA comes from env — quoted as an identifier.
const SCHEMA = `"${config.DB_SCHEMA.replace(/"/g, '""')}"`;

// The drone's position is the fix recorded closest to the launch time — where
// the threat was when the interceptor went out, not where it ended up.
const SELECT_INTERCEPTION_LOG = `
  SELECT
    i.id::text                AS "id",
    i.launched_at             AS "launchedAt",
    i.status::text            AS "status",
    i.result::text            AS "result",
    i.priority                AS "priority",
    i.interceptor_latitude    AS "interceptLatitude",
    i.interceptor_longitude   AS "interceptLongitude",
    i.live_launcher_id::text  AS "launcherId",
    lt.name                   AS "launcherType",
    ll.latitude               AS "launcherLatitude",
    ll.longitude              AS "launcherLongitude",
    lt.range_m                AS "launcherRangeM",
    i.interceptor_type_id     AS "interceptorTypeId",
    it.name                   AS "interceptorType",
    it.range_m                AS "interceptorRangeM",
    i.drone_id::text          AS "droneId",
    dt.name                   AS "droneType",
    dp.latitude               AS "droneLatitude",
    dp.longitude              AS "droneLongitude"
  FROM ${SCHEMA}.interception i
  LEFT JOIN ${SCHEMA}.live_launcher    ll ON ll.id = i.live_launcher_id
  LEFT JOIN ${SCHEMA}.launcher_type    lt ON lt.id = ll.launcher_type_id
  LEFT JOIN ${SCHEMA}.interceptor_type it ON it.id = i.interceptor_type_id
  LEFT JOIN ${SCHEMA}.drone            d  ON d.id = i.drone_id
  LEFT JOIN ${SCHEMA}.drone_type       dt ON dt.id = d.drone_type_id
  LEFT JOIN LATERAL (
    SELECT p.latitude, p.longitude
    FROM ${SCHEMA}.drone_position p
    WHERE p.drone_id = i.drone_id
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
    ORDER BY abs(extract(epoch FROM p.recorded_at - i.launched_at))
    LIMIT 1
  ) dp ON true
  WHERE ($1::timestamptz IS NULL OR i.launched_at >= $1)
    AND ($2::timestamptz IS NULL OR i.launched_at <= $2)
  ORDER BY i.launched_at DESC, i.id DESC
  LIMIT $3
`;

/** Newest first. A null bound leaves that side of the range open. */
export async function findInterceptionLog(
  from: Date | null,
  to: Date | null,
  limit: number,
): Promise<InterceptionLogRow[]> {
  return dataSource.query<InterceptionLogRow[]>(SELECT_INTERCEPTION_LOG, [from, to, limit]);
}
