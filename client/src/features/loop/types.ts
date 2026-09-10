/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Shared types for the interception "closing the loop" feature.
 * Mirrors the hatzot.interception table (+ joined lookups) exposed by
 * the API. ids are strings, not numbers — Postgres bigint/smallint
 * identity PKs come back as strings through pg/TypeORM.
 */
export type InterceptionStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "ABORTED";
export type InterceptionResult = "HIT" | "MISS";

export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export interface DronePosition extends GeoPoint {
  asl: number | null;
  agl: number | null;
  recordedAt: string; // ISO 8601
}

export interface ThreatInfo {
  droneId: string;
  droneTypeName: string;
  heading: number | null;
  velocity: number | null;
  lastPosition: DronePosition | null;
}

export interface DefenseSystemInfo {
  deploymentId: number | null;
  deploymentName: string | null;
}

export interface LauncherInfo {
  liveLauncherId: string;
  launcherTypeName: string;
}

export interface InterceptorInfo {
  interceptorTypeId: number;
  interceptorTypeName: string;
}

/**
 * A single row as shown in the active/closed events tables.
 * Denormalized on the backend so the client never has to join tables itself.
 */
export interface InterceptionEvent {
  id: string;
  status: InterceptionStatus;
  result: InterceptionResult | null;
  /** Server-computed. True for SUCCESS/FAILED/ABORTED. See handoff doc
   *  decision #2 re: why ABORTED counts as closed despite having no result. */
  closed: boolean;
  launchedAt: string; // ISO 8601
  /** Best-effort only — see loop.service.ts on the backend for caveats. */
  updatedAt: string; // ISO 8601
  priority: number;

  threat: ThreatInfo;
  defenseSystem: DefenseSystemInfo;
  launcher: LauncherInfo;
  interceptor: InterceptorInfo;
  interceptorLaunchPosition: GeoPoint | null;
}

// Trust the backend's classification rather than re-deriving it from
// `result` alone — that's exactly the field ABORTED makes ambiguous.
export function isClosed(event: InterceptionEvent): boolean {
  return event.closed;
}