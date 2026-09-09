import InfoPopup from "@/features/blue/LauncherPopup";
import { useState } from "react";

/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 */

const SwordIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M14 2 L22 10 L11 21 L7 21 L7 17 L18 6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 22 L7 17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const CoinStackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M4 5 V12 C4 13.7 7.6 15 12 15 C16.4 15 20 13.7 20 12 V5"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M4 12 V19 C4 20.7 7.6 22 12 22 C16.4 22 20 20.7 20 19 V12"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const AmmoBoxIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="4" height="18" stroke="currentColor" strokeWidth="1.6" />
    <rect x="10" y="3" width="4" height="18" stroke="currentColor" strokeWidth="1.6" />
    <rect x="17" y="3" width="4" height="18" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
export function SidebarEnd(): JSX.Element {
  const [open, setOpen] = useState(true);
  
  return (
    <aside
      data-testid="ops-sidebar-end"
      className="w-72 shrink-0 overflow-y-auto border-s border-line bg-panel p-3 text-sm"
    >
      <h2 className="mb-2 text-xs uppercase tracking-wide text-text-dim">
        פרטים
      </h2>

      <InfoPopup
      title="ShieldNest-Lite"
      subtitle="מיירט-17"
      onClose={() => setOpen(false)}
      rows={[
        { icon: <SwordIcon />, label: "סוג טיל", value: "BuzzStop-15" },
        { icon: <CoinStackIcon />, label: "עלות טיל", value: "$1,250,000" },
      ]}
      pipRow={{
        icon: <AmmoBoxIcon />,
        label: "טילים שנותרו",
        total: 8,
        filled: 6,
        caption: "6 מתוך 8",
      }}
      status={{ label: "פעיל", tone: "active" }}
    />
    </aside>
  );
}
