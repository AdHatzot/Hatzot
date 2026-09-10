/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Loop's persistence handle.
 *
 * `interceptionRepository` follows logistics.repository.ts's precedent
 * exactly (`dataSource.getRepository(Entity)`, no in-memory port) — use it
 * for simple single-table interception reads/writes.
 *
 * The denormalized listing needed by the active/closed screens is instead
 * one hand-written, schema-qualified SQL query via dataSource.query(),
 * NOT TypeORM relations/query-builder joins across entities. Reason:
 * drone_position.entity.ts (owned elsewhere) is currently missing the
 * longitude/latitude/asl/agl/recorded_at columns this query needs and has
 * unrelated heading/velocity columns instead — likely copy-pasted from
 * drone.entity.ts. Rather than redeclare a second, competing
 * @Entity("drone_position") class (a real dual-registration risk once
 * TypeORM's entity glob picks up both files) or edit a file this team
 * doesn't own, every table here is addressed by its real, schema-qualified
 * name directly. This also means the query keeps working regardless of
 * what state other teams' entity files are in. Once drone_position.entity.ts
 * is fixed, this can be rewritten as ORM query-builder joins if preferred —
 * functionally equivalent either way.
 */
import { dataSource } from "../db/data-source";
import { Interception, type InterceptionStatus } from "../db/entities/interception.entity";

export const interceptionRepository = dataSource.getRepository(Interception);

/** Raw shape returned by the joined SQL below — one flat row per event. */
export interface InterceptionRow {
  id: string;
  status: string;
  result: string | null;
  launchedAt: Date;
  priority: number;
  interceptorLongitude: number | null;
  interceptorLatitude: number | null;

  droneId: string;
  droneTypeName: string;
  droneHeading: number | null;
  droneVelocity: number | null;
  dronePositionLongitude: number | null;
  dronePositionLatitude: number | null;
  dronePositionAsl: number | null;
  dronePositionAgl: number | null;
  dronePositionRecordedAt: Date | null;

  deploymentId: number | null;
  deploymentName: string | null;

  liveLauncherId: string;
  launcherTypeName: string;
  launcherLongitude: number | null;
  launcherLatitude: number | null;

  interceptorTypeId: number;
  interceptorTypeName: string;
}

// Schema is hardcoded here ("hatzot.") rather than pulled from config.
// DataSource.schema affects entity-metadata-based queries automatically;
// raw dataSource.query() calls bypass that, so table names need to be
// qualified explicitly. If DB_SCHEMA ever changes, this needs updating too.
const SELECT_JOIN_SQL = `
  WITH latest_position AS (
    SELECT DISTINCT ON (drone_id)
      drone_id, longitude, latitude, asl, agl, recorded_at
    FROM hatzot.drone_position
    ORDER BY drone_id, recorded_at DESC
  )
  SELECT
    i.id                    AS "id",
    i.status                AS "status",
    i.result                AS "result",
    i.launched_at           AS "launchedAt",
    i.priority              AS "priority",
    i.interceptor_longitude AS "interceptorLongitude",
    i.interceptor_latitude  AS "interceptorLatitude",
    d.id                    AS "droneId",
    dt.name                 AS "droneTypeName",
    d.heading               AS "droneHeading",
    d.velocity              AS "droneVelocity",
    lp.longitude            AS "dronePositionLongitude",
    lp.latitude             AS "dronePositionLatitude",
    lp.asl                  AS "dronePositionAsl",
    lp.agl                  AS "dronePositionAgl",
    lp.recorded_at          AS "dronePositionRecordedAt",
    dep.id                  AS "deploymentId",
    dep.name                AS "deploymentName",
    ll.id                   AS "liveLauncherId",
    ll.longitude            AS "launcherLongitude",
    ll.latitude             AS "launcherLatitude",
    lt.name                 AS "launcherTypeName",
    it.id                   AS "interceptorTypeId",
    it.name                 AS "interceptorTypeName"
  FROM hatzot.interception i
  LEFT JOIN hatzot.live_launcher   ll  ON ll.id = i.live_launcher_id
  LEFT JOIN hatzot.launcher_type   lt  ON lt.id = ll.launcher_type_id
  LEFT JOIN hatzot.deployment      dep ON dep.id = ll.deployment_id
  LEFT JOIN hatzot.interceptor_type it ON it.id = i.interceptor_type_id
  LEFT JOIN hatzot.drone           d   ON d.id = i.drone_id
  LEFT JOIN hatzot.drone_type      dt  ON dt.id = d.drone_type_id
  LEFT JOIN latest_position        lp  ON lp.drone_id = d.id
`;

/** Not yet SUCCESS, FAILED, or ABORTED. */
export async function findActiveRows(): Promise<InterceptionRow[]> {
  return findRowsByStatuses(["PENDING", "IN_PROGRESS"]);
}

/**
 * SUCCESS, FAILED, or ABORTED. ABORTED has no HIT/MISS result (DB CHECK
 * constraint forbids it) — treated as closed anyway; see loop.service.ts.
 */
export async function findClosedRows(): Promise<InterceptionRow[]> {
  return findRowsByStatuses(["SUCCESS", "FAILED", "ABORTED"]);
}

export async function findRowsByStatuses(statuses: InterceptionStatus[]): Promise<InterceptionRow[]> {
  return dataSource.query(
    `${SELECT_JOIN_SQL} WHERE i.status = ANY($1::hatzot.interception_status[]) ORDER BY i.launched_at DESC`,
    [statuses],
  );
}

export async function findAllRows(): Promise<InterceptionRow[]> {
  return dataSource.query(`${SELECT_JOIN_SQL} ORDER BY i.launched_at DESC`);
}

export async function findRowById(id: string): Promise<InterceptionRow | null> {
  const rows: InterceptionRow[] = await dataSource.query(`${SELECT_JOIN_SQL} WHERE i.id = $1`, [id]);
  return rows[0] ?? null;
}