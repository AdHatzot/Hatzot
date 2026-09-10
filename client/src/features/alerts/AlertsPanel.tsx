/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-10
 *
 */
import { DroneRow } from "./DroneRow";
import { CrosshairIcon } from "../../../public/icons/CrosshairIcon";
import { useCallback, useEffect, useState } from "react";
import { subscribeRedDrones, type RedDroneTick } from "@/features/red";
import { interceptDrones } from "@/features/Interceptions";
import { Drone } from "@/types/drones";

/** Extra wait after the flight before a drone's button comes back (the result lands). */
const SETTLE_MARGIN_MS = 400;

function toDrone(tick: RedDroneTick): Drone {
  return {
    type: tick.type,
    id: tick.droneId,
    timestamp: tick.timestamp,
    heading: tick.heading,
    launch_point: { latitude: tick.latitude, longitude: tick.longitude },
  };
}

export function AlertsPanel(): JSX.Element {
  const [drones, setDrones] = useState<Drone[]>([]);
  // Drones with an interceptor on the way — their buttons wait for the result.
  const [engaged, setEngaged] = useState<ReadonlySet<string>>(() => new Set());

  // 2s ticks drive a list, not map positions — React state is the right home
  // here (hard rule 5 is about per-frame coordinates). Sorted so rows keep
  // their place as drones enter and leave the feed.
  useEffect(
    () =>
      subscribeRedDrones((ticks) => {
        setDrones(ticks.map(toDrone).sort((a, b) => a.id.localeCompare(b.id)));
      }),
    [],
  );

  const release = useCallback((ids: readonly string[]): void => {
    setEngaged((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  // The backend fires, every screen animates the flight, and a drone that is
  // hit leaves the feed when its flight ends. A miss leaves it to fire again.
  const intercept = (ids: string[]): void => {
    const targets = ids.filter((id) => !engaged.has(id));
    if (targets.length === 0) return;
    setEngaged((current) => new Set([...current, ...targets]));

    interceptDrones(targets)
      .then((launches) => {
        const launched = new Set(launches.map((launch) => launch.droneId));
        release(targets.filter((id) => !launched.has(id)));

        const flightMs = Math.max(0, ...launches.map((launch) => launch.durationMs));
        window.setTimeout(() => release([...launched]), flightMs + SETTLE_MARGIN_MS);
      })
      .catch((error: unknown) => {
        console.error("Interception request failed", error);
        release(targets);
      });
  };

  const allEngaged = drones.length > 0 && drones.every((drone) => engaged.has(drone.id));

  return (
    <section data-testid="alerts-panel" className="flex h-full flex-col">
      <div className="mt-4 rounded border border-line bg-panel-2 py-2 text-center text-sm font-medium text-text">
        אירועים פעילים {drones.length}
      </div>

      {/* Target all row */}
      <div className="mt-2 flex items-center justify-between rounded border border-red-800 bg-red-950/40 px-3 py-2">
        <span className="text-sm text-text-dim">
          {drones.length} אירועים
        </span>
        <button
          type="button"
          data-testid="alerts-intercept-all"
          disabled={drones.length === 0 || allEngaged}
          className="flex items-center gap-1.5 text-sm font-medium text-red-400 disabled:cursor-default disabled:opacity-50"
          onClick={() => intercept(drones.map((drone) => drone.id))}
        >
          <CrosshairIcon className="h-4 w-4" />
          יירט הכל
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {drones.map((drone) => (
          <DroneRow
            key={drone.id}
            drone={drone}
            engaged={engaged.has(drone.id)}
            onIntercept={() => intercept([drone.id])}
          />
        ))}
      </div>
    </section>
  );
}
