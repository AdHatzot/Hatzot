/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
import { useState } from "react";
import { useMap } from "@/map/MapContext";
import { DeploymentDropdown } from "./DeploymentDropdown";
import { useDeploymentMapLayer } from "./useDeploymentMapLayer";

export function LogisticsView(): JSX.Element {
  const map = useMap();
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<number | null>(null);

  const { loadingPoints, pointsError, points } = useDeploymentMapLayer(
    map,
    selectedDeploymentId
  );

  return (
    <div
      data-testid="logistics-page"
      className="pointer-events-none absolute inset-0 overflow-hidden p-4"
    >
      {/* Top Header Card */}
      <div className="pointer-events-auto inline-flex flex-col rounded-lg border border-line bg-panel/90 p-4 shadow-lg backdrop-blur-sm max-w-sm">
        <h1 className="text-base font-semibold text-text">ניהול אמל״ח</h1>
        <p className="text-xs text-text-dim mt-0.5">
          מלאי, חימוש וזמינות כלים במרחב.
        </p>

        {selectedDeploymentId !== null && (
          <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-text font-medium">
              {loadingPoints
                ? "טוען נקודות פריסה..."
                : `מוצגים ${points.length} משגרים על המפה`}
            </span>
          </div>
        )}

        {pointsError && (
          <div className="mt-2 rounded bg-red-950/40 border border-red-800 px-2 py-1 text-xs text-red-400">
            {pointsError}
          </div>
        )}
      </div>

      {/* Deployment Dropdown positioned on the map alongside map controls */}
      <DeploymentDropdown
        selectedDeploymentId={selectedDeploymentId}
        onSelectDeployment={setSelectedDeploymentId}
        loadingPoints={loadingPoints}
      />
    </div>
  );
}
