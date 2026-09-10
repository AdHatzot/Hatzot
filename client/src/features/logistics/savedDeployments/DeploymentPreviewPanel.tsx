import { useMemo, useState } from "react";
import type { DeploymentItem } from "./types";
import {
  ShieldNestIcon,
  IronHookIcon,
  HorizonEyeIcon,
  CloudFenceIcon,
} from "../newDeployment/LauncherIcons";

interface DeploymentPreviewPanelProps {
  realDeployment: DeploymentItem | null;
  selectedDeployment: DeploymentItem | null;
}

export function DeploymentPreviewPanel({
  realDeployment,
  selectedDeployment,
}: DeploymentPreviewPanelProps): JSX.Element {
  const [mapSearch, setMapSearch] = useState("");

  // Use selected deployment if available, else real deployment
  const activeDeployment = selectedDeployment || realDeployment;

  // Calculate counts of each launcher type
  const launcherCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "ShieldNest-Lite": 0,
      "IronHook-SR": 0,
      "HorizonEye-MX": 0,
      "CloudFence-Area": 0,
    };

    if (activeDeployment?.liveLaunchers) {
      for (const launcher of activeDeployment.liveLaunchers) {
        const typeName =
          launcher.launcherType?.name ||
          launcher.name ||
          "ShieldNest-Lite";
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
    }

    return counts;
  }, [activeDeployment]);

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
            className="flex items-center gap-1.5 rounded-md border border-[#223042] bg-[#0f1722] px-2.5 py-1 text-gray-300 transition hover:border-gray-500 hover:text-white"
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

      {/* Tactical Canvas / Placeholder Area */}
      <div className="relative flex min-h-[440px] flex-1 flex-col justify-between overflow-hidden p-4">
        {/* Subtle grid background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at center, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />

        {/* Top Search bar */}
        <div className="relative z-10 flex items-center justify-start">
          <div className="relative w-64">
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

        {/* Center: Tactical map placeholder */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-500/25 bg-sky-500/10 text-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.15)]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <p className="mt-3.5 text-sm font-semibold text-gray-200">
            תצוגת מפה אינה פעילה
          </p>
          <p className="mt-1.5 max-w-sm text-xs text-gray-400">
            פרטי הפריסה וסיכום המערכות מוצגים בטבלה. תצוגת המפה הגאוגרפית תתאפשר
            בהמשך.
          </p>
        </div>

        {/* Bottom Bar: System counts & Zoom controls */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Zoom controls */}
          <div className="flex flex-col overflow-hidden rounded-md border border-[#223042] bg-[#0c131d]/90 shadow-md">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center border-b border-[#223042] text-xs font-bold text-gray-300 transition hover:bg-[#1a2536] hover:text-white"
            >
              +
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-xs font-bold text-gray-300 transition hover:bg-[#1a2536] hover:text-white"
            >
              -
            </button>
          </div>

          {/* Launcher Type summary chips */}
          <div className="flex items-center gap-4 rounded-lg border border-[#223042] bg-[#0c131d]/90 px-3.5 py-1.5 backdrop-blur-sm">
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
  );
}
