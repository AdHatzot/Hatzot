/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Wire shape of GET /api/loop/interceptions. Mirrors
 * backend/src/services/loop.service.ts — keep the two identical.
 */
export type InterceptionStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ABORTED';
export type InterceptionResult = 'HIT' | 'MISS';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface InterceptionLogEntry {
  id: string;
  /** ISO 8601. */
  launchedAt: string;
  status: InterceptionStatus;
  result: InterceptionResult | null;
  priority: number;
  /** Where the interceptor met the threat. */
  interceptPoint: GeoPoint | null;
  launcher: { id: string; type: string | null; position: GeoPoint | null; rangeM: number | null };
  interceptor: { typeId: number; type: string | null; rangeM: number | null };
  drone: { id: string; type: string | null; position: GeoPoint | null };
}

export interface InterceptionLog {
  events: InterceptionLogEntry[];
  /** The range held more events than the server returns in one response. */
  truncated: boolean;
}

export interface TimeRange {
  from: Date;
  to: Date;
}

export type SortDirection = 'asc' | 'desc';
