/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
import { DroneRow } from "./DroneRow";
import { CrosshairIcon } from "../../../public/icons/CrosshairIcon";
import { useEffect, useState } from "react";
import { subscribeRedDrones, type RedDroneTick } from "@/features/red";
import { Drone } from "@/types/drones";

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
  const [isActiveTab, setIsActiveTab] = useState<boolean>(true);
  const [drones, setDrones] = useState<Drone[]>([]);

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

  return (
    <section data-testid="alerts-panel" className="flex h-full flex-col">
      <div className="mt-4 flex rounded border border-line">
        <button
          className={`flex-1 border-l border-line py-2 text-sm font-medium text-text ${isActiveTab ? "bg-panel-2" : ""}`}
          onClick={() => setIsActiveTab(true)}
        >
          אירועים פעילים {drones.length}
        </button>
        <button
          className={`flex-1 bg-panel py-2 text-sm text-text-dim ${!isActiveTab ? "bg-panel-2" : ""}`}
          onClick={() => setIsActiveTab(false)}
        >
          אירועים שטופלו 0
        </button>
      </div>

      {isActiveTab && (
        <>
          {/* Target all row */}
          <div className="mt-2 flex items-center justify-between rounded border border-red-800 bg-red-950/40 px-3 py-2">
            <span className="text-sm text-text-dim">
              {drones.length} אירועים
            </span>
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-red-400"
              onClick={() => alert("חבל שאין קוד כאן :(")}
            >
              <CrosshairIcon className="h-4 w-4" />
              יירט הכל
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {drones.map((drone) => (
              <DroneRow key={drone.id} drone={drone} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
