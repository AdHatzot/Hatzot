import { Crosshair } from "lucide-react";

/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
import { Drone, DroneRow } from "./DroneRow";
import { useState } from "react";

const DEMO_DRONES: Drone[] = [
  { id: "d1", name: "רחפן-01", active: true },
  { id: "d2", name: "רחפן-02", active: true },
  { id: "d3", name: "רחפן-03", active: true },
  { id: "d4", name: "רחפן-04", active: true },
  { id: "d5", name: "רחפן-05", active: true },
];

export function AlertsPanel(): JSX.Element {
  const [isActiveTab, setIsActiveTab] = useState<boolean>(true);

  return (
    <section data-testid="alerts-panel" className="flex h-full flex-col">
      <div className="mt-4 flex overflow-hidden rounded border border-line">
        <button
          className="flex-1 border-l border-line bg-panel-2 py-2 text-sm font-medium text-text"
          onClick={() => setIsActiveTab(true)}
        >
          אירועים פעילים {DEMO_DRONES.length}
        </button>
        <button
          className="flex-1 bg-panel py-2 text-sm text-text-dim"
          onClick={() => setIsActiveTab(false)}
        >
          אירועים שופלו 0
        </button>
      </div>

      {isActiveTab && (
        <>
          {/* Target all row */}
          <div className="mt-2 flex items-center justify-between rounded border border-red-800 bg-red-950/40 px-3 py-2">
            <span className="text-sm text-text-dim">
              {DEMO_DRONES.length} אירועים
            </span>
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-red-400"
              onClick={() => alert("shoot all :)")}
            >
              <Crosshair className="h-4 w-4" />
              יירט הכל
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {DEMO_DRONES.map((drone) => (
              <DroneRow key={drone.id} drone={drone} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
