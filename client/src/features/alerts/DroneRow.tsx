import { Crosshair } from "lucide-react";

type ThreatLevel = "high" | "medium" | "low";

export interface Drone {
  id: string;
  name: string;
  active: boolean;
}

// this comment is for drone danger level
// const THREAT_LABELS: Record<ThreatLevel, string> = {
//   high: "סכנה גבוהה",
//   medium: "סכנה בינונית",
//   low: "סכנה נמוכה",
// };

// const THREAT_STYLES: Record<ThreatLevel, string> = {
//   high: "border-red-800 bg-red-950/60 text-red-400",
//   medium: "border-yellow-800 bg-yellow-950/60 text-yellow-400",
//   low: "border-emerald-800 bg-emerald-950/60 text-emerald-400",
// };

export function DroneRow({ drone }: { drone: Drone }): JSX.Element {
  return (
    <div
      data-testid={`drone-row-${drone.id}`}
      className="flex items-center justify-between rounded border border-line bg-panel-2 px-3 py-2"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-text">{drone.name}</span>
        <span
          className={
            "h-2 w-2 rounded-full " +
            (drone.active ? "bg-emerald-500" : "bg-text-dim")
          }
        />
      </div>

      {/* <span
        className={
          "rounded border px-2 py-0.5 text-[11px] font-medium " +
          THREAT_STYLES[drone.threatLevel]
        }
      >
        {THREAT_LABELS[drone.threatLevel]}
      </span> */}

      <button
        className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text"
        onClick={() => alert("shot one")}
      >
        <Crosshair className="h-3.5 w-3.5" />
        יירט
      </button>
    </div>
  );
}
