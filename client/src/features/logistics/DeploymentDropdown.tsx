import { useState, useEffect, useRef } from "react";
import type { DeploymentItem } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface DeploymentDropdownProps {
  selectedDeploymentId: number | null;
  onSelectDeployment: (id: number | null) => void;
  loadingPoints?: boolean;
}

export function DeploymentDropdown({
  selectedDeploymentId,
  onSelectDeployment,
  loadingPoints = false,
}: DeploymentDropdownProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchDeployments = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/logistics/all`);
      if (!response.ok) {
        throw new Error(`שגיאה בטעינת פריסות: ${response.status}`);
      }
      const data: DeploymentItem[] = await response.json();
      setDeployments(data);
    } catch (err: unknown) {
      console.error("Failed to load deployments:", err);
      setError(err instanceof Error ? err.message : "שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedDeployment = deployments.find((d) => d.id === selectedDeploymentId);

  return (
    <div ref={containerRef} className="pointer-events-auto">
      {/* Dropdown Toggle Button alongside existing map controls */}
      <button
        type="button"
        data-testid="deployment-dropdown-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="בחירת פריסה"
        className={`absolute right-14 top-3 z-[1000] flex h-9 items-center gap-2 rounded border px-3 text-sm transition-colors ${
          open || selectedDeploymentId !== null
            ? "border-accent bg-panel text-text shadow-md"
            : "border-line bg-panel/90 text-text hover:border-line-hot"
        }`}
      >
        {/* Layout / Deployment Grid Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={selectedDeploymentId !== null ? "text-accent" : "text-text-dim"}
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>

        <span className="font-medium">
          {selectedDeployment ? selectedDeployment.name : "פריסה"}
        </span>

        {loadingPoints ? (
          <span
            aria-label="טוען נתונים"
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent"
          />
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-200 ${
              open ? "rotate-180 text-text" : "text-text-dim"
            }`}
          >
            <polyline points="2 4 6 8 10 4" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu Panel */}
      {open && (
        <div
          data-testid="deployment-dropdown-panel"
          dir="rtl"
          className="absolute right-14 top-14 z-[1000] w-64 rounded-md border border-line bg-panel/95 p-2 text-sm shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-2 pb-2 pt-1 text-xs text-text-dim">
            <span className="font-semibold uppercase tracking-wide">
              פריסות זמינות
            </span>
            <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[11px] font-mono">
              {deployments.length}
            </span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-text-dim">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span>טוען פריסות מהשרת...</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="py-3 px-2 text-center text-xs">
              <p className="text-red-400 mb-2">{error}</p>
              <button
                type="button"
                onClick={fetchDeployments}
                className="rounded border border-line px-2 py-1 text-[11px] text-text hover:bg-panel-2"
              >
                נסה שוב
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && deployments.length === 0 && (
            <div className="py-4 text-center text-xs text-text-dim">
              לא נמצאו פריסות במערכת
            </div>
          )}

          {/* Deployments List */}
          {!loading && !error && deployments.length > 0 && (
            <ul className="mt-1 space-y-1">
              {deployments.map((deployment) => {
                const isSelected = selectedDeploymentId === deployment.id;
                return (
                  <li key={deployment.id}>
                    <button
                      type="button"
                      data-testid={`deployment-item-${deployment.id}`}
                      onClick={() => {
                        onSelectDeployment(deployment.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-right transition-colors ${
                        isSelected
                          ? "bg-accent/15 text-accent font-medium"
                          : "text-text hover:bg-panel-2"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`inline-block h-2 w-2 shrink-0 rounded-full transition-colors ${
                            isSelected ? "bg-accent" : "bg-text-dim"
                          }`}
                        />
                        <span>{deployment.name}</span>
                      </div>
                      {deployment.status && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-mono ${
                            isSelected
                              ? "bg-accent/20 text-accent"
                              : "bg-panel-2 text-text-dim"
                          }`}
                        >
                          {deployment.status}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}

              {/* Clear Selection Option */}
              {selectedDeploymentId !== null && (
                <li className="border-t border-line pt-1 mt-1">
                  <button
                    type="button"
                    data-testid="deployment-clear-btn"
                    onClick={() => {
                      onSelectDeployment(null);
                      setOpen(false);
                    }}
                    className="w-full rounded px-2.5 py-1.5 text-center text-xs text-text-dim hover:text-text hover:bg-panel-2"
                  >
                    הסר פריסה מהמפה
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
