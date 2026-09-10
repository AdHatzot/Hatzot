/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * The interception log behind the /logs debrief page. Reads joined rows from
 * repositories/loop.repository.ts and shapes them for the client —
 * client/src/features/loop/types.ts mirrors the types below. Read-only.
 */
import type { Team } from "../types";
import { HttpError } from "../shared/httpError";
import {
  findInterceptionLog,
  type InterceptionLogRow,
  type InterceptionResult,
  type InterceptionStatus,
} from "../repositories/loop.repository";

export type { InterceptionResult, InterceptionStatus } from "../repositories/loop.repository";

/** Hard cap per request. Past it the client asks the operator to narrow the range. */
const LOG_LIMIT = 5000;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface InterceptionLogEntry {
  id: string;
  launchedAt: string;
  status: InterceptionStatus;
  result: InterceptionResult | null;
  priority: number;
  /** interception.interceptor_latitude/longitude — where the interceptor met the threat. */
  interceptPoint: GeoPoint | null;
  launcher: { id: string; type: string | null; position: GeoPoint | null; rangeM: number | null };
  interceptor: { typeId: number; type: string | null; rangeM: number | null };
  drone: { id: string; type: string | null; position: GeoPoint | null };
}

export interface InterceptionLog {
  events: InterceptionLogEntry[];
  /** True when the range held more than LOG_LIMIT events and only the newest came back. */
  truncated: boolean;
}

function point(latitude: number | null, longitude: number | null): GeoPoint | null {
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
}

function toEntry(row: InterceptionLogRow): InterceptionLogEntry {
  return {
    id: row.id,
    launchedAt: row.launchedAt.toISOString(),
    status: row.status,
    result: row.result,
    priority: row.priority,
    interceptPoint: point(row.interceptLatitude, row.interceptLongitude),
    launcher: {
      id: row.launcherId,
      type: row.launcherType,
      position: point(row.launcherLatitude, row.launcherLongitude),
      rangeM: row.launcherRangeM,
    },
    interceptor: {
      typeId: row.interceptorTypeId,
      type: row.interceptorType,
      rangeM: row.interceptorRangeM,
    },
    drone: {
      id: row.droneId,
      type: row.droneType,
      position: point(row.droneLatitude, row.droneLongitude),
    },
  };
}

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "loop", status: "empty" };
}

/** Interceptions launched within [from, to], newest first. Null bounds are open. */
export async function getInterceptionLog(from: Date | null, to: Date | null): Promise<InterceptionLog> {
  if (from !== null && to !== null && from > to) {
    throw new HttpError(400, "from must not be later than to");
  }

  const rows = await findInterceptionLog(from, to, LOG_LIMIT + 1);
  return {
    events: rows.slice(0, LOG_LIMIT).map(toEntry),
    truncated: rows.length > LOG_LIMIT,
  };
}
