/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
import { DroneRow } from "./DroneRow";
import { CrosshairIcon } from "../../../public/icons/CrosshairIcon";
import { useState } from "react";
import { Drone } from "@/types/drones";

const DEMO_DRONES: Drone[] = [
  {
    type: "quadcopter",
    id: "drone-alpha-01",
    timestamp: "2026-09-10T08:30:00.000Z",
    heading: 45.5,
    launch_point: {
      latitude: 32.0853,
      longitude: 34.7818,
    },
  },
  {
    type: "fixed-wing",
    id: "drone-bravo-02",
    timestamp: "2026-09-10T08:31:15.000Z",
    heading: 180.0,
    launch_point: {
      latitude: 32.0912,
      longitude: 34.7754,
    },
  },
  {
    type: "hexacopter",
    id: "drone-charlie-03",
    timestamp: "2026-09-10T08:32:45.000Z",
    heading: 270.2,
    launch_point: {
      latitude: 32.0741,
      longitude: 34.7921,
    },
  },
  {
    type: "quadcopter",
    id: "drone-delta-04",
    timestamp: "2026-09-10T08:33:10.000Z",
    heading: 12.8,
    launch_point: {
      latitude: 32.0628,
      longitude: 34.7689,
    },
  },
  {
    type: "vtol",
    id: "drone-echo-05",
    timestamp: "2026-09-10T08:35:00.000Z",
    heading: 315.0,
    launch_point: {
      latitude: 32.1005,
      longitude: 34.8012,
    },
  },
];

export function AlertsPanel(): JSX.Element {
  const [isActiveTab, setIsActiveTab] = useState<boolean>(true);

  return (
    <section data-testid="alerts-panel" className="flex h-full flex-col">
      <div className="mt-4 flex overflow-hidden rounded border border-line">
        <button
          className={`flex-1 border-l border-line py-2 text-sm font-medium text-text ${isActiveTab ? "bg-panel-2" : ""}`}
          onClick={() => setIsActiveTab(true)}
        >
          אירועים פעילים {DEMO_DRONES.length}
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
              {DEMO_DRONES.length} אירועים
            </span>
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-red-400"
              onClick={() => alert("shoot all :)")}
            >
              <CrosshairIcon className="h-4 w-4" />
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
