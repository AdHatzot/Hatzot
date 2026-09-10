/**
 * @team     loop
 * @owner    loop-lead
 * @public   yes
 * @updated  2026-09-10
 *
 * Maps flat rows (from loop.repository.ts's raw join) into the nested shape
 * the frontend expects, and polls for changes to push over the shared
 * websocket. See loop.repository.ts's header for why the join is raw SQL,
 * and the ABORTED note below for the active/closed split's one judgment call.
 *
 * No updated_at column exists on hatzot.interception, so change detection
 * uses a content hash of the mutable fields, not a timestamp diff — the
 * DTO's `updatedAt` is therefore a server-process-memory observation, not
 * a persisted fact (resets on restart). Real fix, if ever needed, is a
 * migration adding updated_at + a BEFORE UPDATE trigger to set it — not
 * applied here since it touches DDL this task didn't ask for:
 *
 *   ALTER TABLE hatzot.interception ADD COLUMN updated_at timestamptz
 *     NOT NULL DEFAULT now();
 *   CREATE OR REPLACE FUNCTION hatzot.set_updated_at() RETURNS trigger AS
 *   $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
 *   CREATE TRIGGER trg_interception_updated_at BEFORE UPDATE ON
 *     hatzot.interception FOR EACH ROW EXECUTE FUNCTION hatzot.set_updated_at();
 *
 * OPEN DECISION re: ABORTED — hatzot.interception's CHECK constraint
 * forces result=NULL whenever status='ABORTED', so an aborted engagement
 * can never show HIT/MISS. assignment.txt only defines "closed" as
 * "ended in HIT or MISS" and never mentions ABORTED. Implemented here:
 * ABORTED counts as closed (closed=true, result=null, frontend renders
 * "בוטל"). Alternative: leave ABORTED in "active" forever per a literal
 * reading of the spec — seems like a worse UX bug (an operator would see
 * a permanently-stuck event), but this is a product call, not a technical
 * one. To flip it, move "ABORTED" between the arrays in
 * loop.repository.ts's findActiveRows/findClosedRows and update
 * CLOSED_STATUSES below to match.
 */
import { createHash } from "crypto";
import { broadcast } from "../ws";
import type { Team } from "../types";
import {
  findActiveRows,
  findClosedRows,
  findAllRows,
  findRowById,
  type InterceptionRow,
} from "../repositories/loop.repository";

const CLOSED_STATUSES = new Set(["SUCCESS", "FAILED", "ABORTED"]);

export interface InterceptionEventDto {
  id: string;
  status: string;
  result: string | null;
  closed: boolean;
  launchedAt: string;
  updatedAt: string;
  priority: number;
  threat: {
    droneId: string;
    droneTypeName: string;
    heading: number | null;
    velocity: number | null;
    lastPosition: {
      longitude: number;
      latitude: number;
      asl: number | null;
      agl: number | null;
      recordedAt: string;
    } | null;
  };
  defenseSystem: {
    deploymentId: number | null;
    deploymentName: string | null;
  };
  launcher: {
    liveLauncherId: string;
    launcherTypeName: string;
  };
  interceptor: {
    interceptorTypeId: number;
    interceptorTypeName: string;
  };
  interceptorLaunchPosition: { longitude: number; latitude: number } | null;
}

function toDto(row: InterceptionRow, observedUpdatedAt: string): InterceptionEventDto {
  return {
    id: row.id,
    status: row.status,
    result: row.result,
    closed: CLOSED_STATUSES.has(row.status),
    launchedAt: row.launchedAt.toISOString(),
    updatedAt: observedUpdatedAt,
    priority: row.priority,
    threat: {
      droneId: row.droneId,
      droneTypeName: row.droneTypeName,
      heading: row.droneHeading,
      velocity: row.droneVelocity,
      lastPosition:
        row.dronePositionLongitude !== null && row.dronePositionRecordedAt !== null
          ? {
              longitude: row.dronePositionLongitude,
              latitude: row.dronePositionLatitude as number,
              asl: row.dronePositionAsl,
              agl: row.dronePositionAgl,
              recordedAt: row.dronePositionRecordedAt.toISOString(),
            }
          : null,
    },
    defenseSystem: {
      deploymentId: row.deploymentId,
      deploymentName: row.deploymentName,
    },
    launcher: {
      liveLauncherId: row.liveLauncherId,
      launcherTypeName: row.launcherTypeName,
    },
    interceptor: {
      interceptorTypeId: row.interceptorTypeId,
      interceptorTypeName: row.interceptorTypeName,
    },
    interceptorLaunchPosition:
      row.interceptorLongitude !== null && row.interceptorLatitude !== null
        ? { longitude: row.interceptorLongitude, latitude: row.interceptorLatitude }
        : null,
  };
}

export async function getStatus(): Promise<{ team: Team; status: "empty" }> {
  return { team: "loop", status: "empty" };
}

export async function getActiveInterceptions(): Promise<InterceptionEventDto[]> {
  const rows = await findActiveRows();
  return rows.map((row) => toDto(row, lastSeenUpdatedAt.get(row.id) ?? row.launchedAt.toISOString()));
}

export async function getClosedInterceptions(): Promise<InterceptionEventDto[]> {
  const rows = await findClosedRows();
  return rows.map((row) => toDto(row, lastSeenUpdatedAt.get(row.id) ?? row.launchedAt.toISOString()));
}

export async function getAllInterceptions(): Promise<InterceptionEventDto[]> {
  const rows = await findAllRows();
  return rows.map((row) => toDto(row, lastSeenUpdatedAt.get(row.id) ?? row.launchedAt.toISOString()));
}

export async function getInterceptionById(id: string): Promise<InterceptionEventDto | null> {
  const row = await findRowById(id);
  if (!row) return null;
  return toDto(row, lastSeenUpdatedAt.get(row.id) ?? row.launchedAt.toISOString());
}

// --- live updates: content-hash polling (see file header re: no updated_at) -

function rowHash(row: InterceptionRow): string {
  const mutableFields = [row.status, row.result, row.priority, row.interceptorLongitude, row.interceptorLatitude];
  return createHash("sha1").update(JSON.stringify(mutableFields)).digest("hex");
}

const lastSeenHash = new Map<string, string>();
const lastSeenUpdatedAt = new Map<string, string>();

async function pollForChanges(): Promise<void> {
  const rows = await findAllRows();
  const seenIds = new Set<string>();

  for (const row of rows) {
    seenIds.add(row.id);
    const hash = rowHash(row);
    const previousHash = lastSeenHash.get(row.id);

    if (previousHash === undefined) {
      lastSeenHash.set(row.id, hash);
      lastSeenUpdatedAt.set(row.id, row.launchedAt.toISOString());
      broadcast("loop:interception.created", toDto(row, row.launchedAt.toISOString()));
    } else if (previousHash !== hash) {
      const observedAt = new Date().toISOString();
      lastSeenHash.set(row.id, hash);
      lastSeenUpdatedAt.set(row.id, observedAt);
      broadcast("loop:interception.updated", toDto(row, observedAt));
    }
  }

  for (const id of lastSeenHash.keys()) {
    if (!seenIds.has(id)) {
      lastSeenHash.delete(id);
      lastSeenUpdatedAt.delete(id);
    }
  }
}

export function startLoopStatusTicker(intervalMs = 1000): void {
  setInterval(() => {
    pollForChanges().catch((err: unknown) => console.error("loop status ticker", err));
  }, intervalMs);
}