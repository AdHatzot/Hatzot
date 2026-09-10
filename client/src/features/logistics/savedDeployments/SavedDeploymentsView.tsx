import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DeploymentItem } from "./types";
import {
  fetchDeployments,
  fetchRealDeployment,
  promoteDeploymentToReal,
} from "./savedDeploymentsApi";
import { DeploymentPreviewPanel } from "./DeploymentPreviewPanel";
import { SavedDeploymentsTable } from "./SavedDeploymentsTable";
import { NewDeploymentModal } from "../newDeployment/NewDeploymentModal";
import type { NewDeployment } from "../newDeployment/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function SavedDeploymentsView(): JSX.Element {
  const navigate = useNavigate();

  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [realDeployment, setRealDeployment] = useState<DeploymentItem | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPromotingId, setIsPromotingId] = useState<number | null>(null);

  // New Deployment Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newSubmitError, setNewSubmitError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allDeps, liveDep] = await Promise.all([
        fetchDeployments(),
        fetchRealDeployment().catch(() => null),
      ]);

      setDeployments(allDeps);
      setRealDeployment(liveDep);

      // If no selected deployment yet, or if current selection is real, sync it
      if (!selectedDeployment && liveDep) {
        setSelectedDeployment(liveDep);
      } else if (selectedDeployment) {
        const updatedSelected = allDeps.find((d) => d.id === selectedDeployment.id);
        if (updatedSelected) setSelectedDeployment(updatedSelected);
      }
    } catch (err) {
      console.error("Failed to load deployments:", err);
      setError(
        err instanceof Error ? err.message : "שגיאה בטעינת פריסות מהשרת"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    void loadData();
  }, []);

  // Promote deployment to Real
  const handlePromoteToReal = async (id: number) => {
    setIsPromotingId(id);
    try {
      await promoteDeploymentToReal(id);
      await loadData();
    } catch (err) {
      console.error("Failed to promote deployment:", err);
      alert(err instanceof Error ? err.message : "שגיאה בעדכון הסטטוס");
    } finally {
      setIsPromotingId(null);
    }
  };

  // Create new deployment via modal
  const handleCreateNewDeployment = async (newDep: NewDeployment) => {
    setIsSubmittingNew(true);
    setNewSubmitError("");

    try {
      const response = await fetch(`${API_URL}/api/logistics/deployment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDep.name,
          rows: newDep.rows,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `שגיאה ביצירת פריסה (${response.status})`
        );
      }

      const result = await response.json();
      setIsNewModalOpen(false);

      // Navigate to verification screen
      navigate(`/logistics/deployment/${result.id}`, {
        state: {
          deploymentId: result.id,
          deploymentName: newDep.name,
          rows: newDep.rows,
          fileName: newDep.file.name,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה לא צפויה";
      setNewSubmitError(msg);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-5 text-text" dir="rtl">
      {/* Main Page Title Header */}
      <div className="mb-5 flex flex-col items-start">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          פריסת הגנה
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          בחר פריסה להצגה על המפה
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded bg-red-800/40 px-2 py-1 font-semibold hover:bg-red-700/50"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Two-column layout matching design requirement */}
      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-12 min-h-[560px]">
        {/* Left Side: Saved Deployments Table (7 cols) */}
        <div className="lg:col-span-6 xl:col-span-7 h-full">
          <SavedDeploymentsTable
            deployments={deployments}
            isLoading={isLoading}
            onPromoteToReal={handlePromoteToReal}
            onNewDeploymentClick={() => {
              setNewSubmitError("");
              setIsNewModalOpen(true);
            }}
            onSelectDeployment={(dep) => setSelectedDeployment(dep)}
            selectedDeploymentId={selectedDeployment?.id}
            isPromotingId={isPromotingId}
          />
        </div>

        {/* Right Side: Map Preview Panel (5 cols) */}
        <div className="lg:col-span-6 xl:col-span-5 h-full">
          <DeploymentPreviewPanel
            realDeployment={realDeployment}
            selectedDeployment={selectedDeployment}
          />
        </div>
      </div>

      {/* New Deployment Modal */}
      {isNewModalOpen && (
        <NewDeploymentModal
          onClose={() => {
            if (!isSubmittingNew) {
              setIsNewModalOpen(false);
            }
          }}
          isSubmitting={isSubmittingNew}
          submitError={newSubmitError}
          onCreated={(dep) => {
            void handleCreateNewDeployment(dep);
          }}
        />
      )}
    </div>
  );
}
