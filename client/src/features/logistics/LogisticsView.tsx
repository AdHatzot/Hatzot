import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NewDeploymentButton } from "./newDeployment/NewDeploymentButton";
import { SavedDeploymentsView } from "./savedDeployments/SavedDeploymentsView";

/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   no
 * @updated  2026-09-10
 */
export function LogisticsView(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"saved" | "create">(
    tabParam === "create" ? "create" : "saved"
  );

  const handleTabChange = (tab: "saved" | "create") => {
    setActiveTab(tab);
    setSearchParams(tab === "create" ? { tab: "create" } : {});
  };

  return (
    <div
      data-testid="logistics-page"
      className="absolute inset-0 flex flex-col overflow-hidden bg-[#070b10]"
    >
      {/* Logistics Top Tabs Navigation */}
      <div
        className="flex h-12 shrink-0 items-center border-b border-[#1b2533] bg-[#0c1219] px-6"
        dir="rtl"
      >
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => handleTabChange("saved")}
            className={`relative flex h-12 items-center text-sm font-medium transition ${
              activeTab === "saved"
                ? "text-white"
                : "text-text-dim hover:text-text"
            }`}
          >
            <span>פריסות שמורות</span>
            {activeTab === "saved" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("create")}
            className={`relative flex h-12 items-center text-sm font-medium transition ${
              activeTab === "create"
                ? "text-white"
                : "text-text-dim hover:text-text"
            }`}
          >
            <span>יצירת פריסה</span>
            {activeTab === "create" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "saved" ? (
          <SavedDeploymentsView />
        ) : (
          <div className="p-6" dir="rtl">
            <h1 className="mb-3 text-lg font-medium text-white">יצירת פריסה</h1>
            <p className="text-sm text-text-dim">מלאי, חימוש וזמינות כלים.</p>
            <div className="mt-6">
              <NewDeploymentButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
