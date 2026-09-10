import { Drone } from "@/types/drones";
import { CrosshairIcon } from "../../../public/icons/CrosshairIcon";

// const THREAT_LABELS: Record<ThreatLevel, string> = {
//   high: "High",
//   medium: "Medium",
//   low: "Low",
// };
//add note

export function DroneRow({ drone }: { drone: Drone }): JSX.Element {
  return (
    <div
      data-testid={`drone-row-${drone.id}`}
      className="flex items-center justify-between rounded border border-line bg-panel-2 px-3 py-2"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="truncate font-mono text-sm tabular-nums text-text"
          title={drone.id}
        >
          {drone.id.slice(0, 8)}
        </span>
        <span className="truncate text-xs text-text-dim">{drone.type}</span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      </div>

      {/* <span
          className={`rounded border px-2 py-0.5 text-[11px] font-medium ${THREAT_STYLES[threatLevel]}`}
        >
          {THREAT_LABELS[threatLevel]}
        </span> */}

      <button
        className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text"
        onClick={() => alert("shot one")}
      >
        <CrosshairIcon className="h-3.5 w-3.5" />
        יירט
      </button>
    </div>
  );
}
