import { useEffect, useMemo, useRef, useState } from "react";
import type { DeploymentItem, LiveLauncherItem } from "./types";
import { fetchLauncherTypes, type LauncherTypeItem } from "./savedDeploymentsApi";
import {
  ShieldNestIcon,
  IronHookIcon,
  HorizonEyeIcon,
  CloudFenceIcon,
} from "../newDeployment/LauncherIcons";
import {
  LogisticsMapPreview,
  type LogisticsMapHandle,
  type PreviewLauncher,
} from "../map/LogisticsMapPreview";

interface DeploymentPreviewPanelProps {
  realDeployment: DeploymentItem | null;
  selectedDeployment: DeploymentItem | null;
}

/** The list endpoint sends only launcherTypeId; the live one embeds launcherType. */
function resolveLauncherType(
  launcher: LiveLauncherItem,
  typesById: ReadonlyMap<number, LauncherTypeItem>,
): { name: string; rangeM: number | null } {
  const fromList =
    launcher.launcherTypeId !== undefined ? typesById.get(launcher.launcherTypeId) : undefined;
  return {
    name: launcher.launcherType?.name ?? fromList?.name ?? launcher.name ?? "",
    rangeM: launcher.launcherType?.rangeM ?? fromList?.rangeM ?? launcher.range ?? null,
  };
}

export function DeploymentPreviewPanel({
  realDeployment,
  selectedDeployment,
}: DeploymentPreviewPanelProps): JSX.Element {
  const [mapSearch, setMapSearch] = useState("");
  const [showRanges, setShowRanges] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [launcherTypes, setLauncherTypes] = useState<LauncherTypeItem[]>([]);
  const mapRef = useRef<LogisticsMapHandle>(null);

  // Use selected deployment if available, else real deployment
  const activeDeployment = selectedDeployment || realDeployment;

  useEffect(() => {
    let cancelled = false;
    fetchLauncherTypes()
      .then((types) => {
        if (!cancelled) setLauncherTypes(types);
      })
      .catch((error: unknown) => console.error("Failed to load launcher types:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const typesById = useMemo(
    () => new Map(launcherTypes.map((type) => [type.id, type])),
    [launcherTypes],
  );

  const previewLaunchers: PreviewLauncher[] = useMemo(
    () =>
      (activeDeployment?.liveLaunchers ?? []).map((launcher) => {
        const type = resolveLauncherType(launcher, typesById);
        return {
          key: String(launcher.id),
          label: `#${launcher.id}`,
          typeName: type.name,
          latitude: Number(launcher.latitude ?? launcher.location?.lat),
          longitude: Number(launcher.longitude ?? launcher.location?.long),
          rangeM: type.rangeM,
        };
      }),
    [activeDeployment, typesById],
  );

  // Calculate counts of each launcher type
  const launcherCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "ShieldNest-Lite": 0,
      "IronHook-SR": 0,
      "HorizonEye-MX": 0,
      "CloudFence-Area": 0,
    };

    for (const launcher of previewLaunchers) {
      const typeName = launcher.typeName;
      if (typeName in counts) {
        counts[typeName] = (counts[typeName] || 0) + 1;
      } else {
        // Normalize matching
        const lower = typeName.toLowerCase();
        if (lower.includes("shield")) counts["ShieldNest-Lite"]++;
        else if (lower.includes("iron")) counts["IronHook-SR"]++;
        else if (lower.includes("horizon")) counts["HorizonEye-MX"]++;
        else if (lower.includes("cloud")) counts["CloudFence-Area"]++;
      }
    }

    return counts;
  }, [previewLaunchers]);

  const totalSystems = activeDeployment?.liveLaunchers?.length ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#1a2332] bg-[#080d14] shadow-xl">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#18212e] px-4">
        <h3 className="text-sm font-semibold tracking-wide text-gray-200">
          תצוגה מקדימה
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md border border-[#223042] bg-[#0f1722] px-2.5 py-1 text-gray-300">
            <span>{activeDeployment?.name || "הפריסה המרכזית"}</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-[#223042] bg-[#0f1722] px-2.5 py-1 text-gray-300">
            <span>{totalSystems} מערכות</span>
          </div>
          <button
            type="button"
            onClick={() => setShowRanges((value) => !value)}
            aria-pressed={showRanges}
            title={showRanges ? "הסתר טווחי יירוט" : "הצג טווחי יירוט"}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition hover:text-white ${
              showRanges
                ? "border-sky-500/50 bg-sky-950/40 text-sky-300"
                : "border-[#223042] bg-[#0f1722] text-gray-300 hover:border-gray-500"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>מצב תצוגה</span>
          </button>
        </div>
      </div>

      {/* Tactical map */}
      <div className="relative min-h-[440px] flex-1 overflow-hidden">
        <LogisticsMapPreview
          ref={mapRef}
          launchers={previewLaunchers}
          selectedKey={selectedKey}
          search={mapSearch}
          showRanges={showRanges}
          emptyLabel={activeDeployment ? "אין מערכות ממוקמות בפריסה זו" : "לא נבחרה פריסה"}
          onSelect={(key) => setSelectedKey((current) => (current === key ? null : key))}
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pb-7">
          {/* Top Search bar */}
          <div className="flex items-center justify-start">
            <div className="pointer-events-auto relative w-64">
              <input
                type="text"
                placeholder="חיפוש במפה"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-[#223042] bg-[#0d141f]/90 pl-3 pr-9 text-xs text-white placeholder:text-gray-400 outline-none backdrop-blur-sm transition focus:border-sky-500"
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="absolute right-2.5 top-2.5 text-gray-400"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Bottom Bar: System counts & Zoom controls */}
          <div className="flex items-center justify-between">
            {/* Zoom controls */}
            <div className="pointer-events-auto flex flex-col overflow-hidden rounded-md border border-[#223042] bg-[#0c131d]/90 shadow-md">
              <button
                type="button"
                aria-label="התקרב"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex h-7 w-7 items-center justify-center border-b border-[#223042] text-xs font-bold text-gray-300 transition hover:bg-[#1a2536] hover:text-white"
              >
                +
              </button>
              <button
                type="button"
                aria-label="התרחק"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex h-7 w-7 items-center justify-center text-xs font-bold text-gray-300 transition hover:bg-[#1a2536] hover:text-white"
              >
                -
              </button>
            </div>

            {/* Launcher Type summary chips */}
            <div className="pointer-events-auto flex items-center gap-4 rounded-lg border border-[#223042] bg-[#0c131d]/90 px-3.5 py-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <ShieldNestIcon size={18} />
                <span className="text-[11px] text-gray-300">ShieldNest-Lite</span>
                <span className="text-xs font-bold text-white">
                  {launcherCounts["ShieldNest-Lite"]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IronHookIcon size={18} />
                <span className="text-[11px] text-gray-300">IronHook-SR</span>
                <span className="text-xs font-bold text-white">
                  {launcherCounts["IronHook-SR"]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HorizonEyeIcon size={18} />
                <span className="text-[11px] text-gray-300">HorizonEye-MX</span>
                <span className="text-xs font-bold text-white">
                  {launcherCounts["HorizonEye-MX"]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CloudFenceIcon size={18} />
                <span className="text-[11px] text-gray-300">CloudFence-Area</span>
                <span className="text-xs font-bold text-white">
                  {launcherCounts["CloudFence-Area"]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
