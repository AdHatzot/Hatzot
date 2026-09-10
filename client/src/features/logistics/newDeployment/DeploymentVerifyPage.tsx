import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { CsvRow } from "./types";
import { getLauncherTypeIcon } from "./LauncherIcons";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Shape of the location.state passed from NewDeploymentButton after creation */
interface DeploymentVerifyState {
  deploymentId?: number;
  deploymentName?: string;
  rows?: CsvRow[];
  fileName?: string;
}

interface LauncherTypeFromApi {
  id: number;
  name: string;
  reloadTimeS: number | null;
  rangeM: number | null;
}

interface LauncherTypeSummary {
  name: string;
  count: number;
}

export function DeploymentVerifyPage(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const state = location.state as DeploymentVerifyState | null;

  const deploymentId = state?.deploymentId ?? (paramId ? Number(paramId) : null);

  const [deploymentName, setDeploymentName] = useState(state?.deploymentName ?? "");
  const [currentFileName, setCurrentFileName] = useState(state?.fileName ?? "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editableName, setEditableName] = useState(state?.deploymentName ?? "");
  const [editableRows, setEditableRows] = useState<CsvRow[]>(state?.rows ?? []);
  const [rowsHistory, setRowsHistory] = useState<CsvRow[][]>([]);
  const [mapSearch, setMapSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingDeployment, setIsLoadingDeployment] = useState(false);

  // If no deploymentId, redirect back
  useEffect(() => {
    if (!deploymentId) {
      navigate("/logistics", { replace: true });
      return;
    }

    if (state?.rows && state.rows.length > 0 && state.deploymentName) {
      return;
    }

    let isMounted = true;
    async function loadDeployment() {
      setIsLoadingDeployment(true);
      try {
        const [depRes, launchersRes] = await Promise.all([
          fetch(`${API_URL}/api/logistics/deployments/${deploymentId}`),
          fetch(`${API_URL}/api/logistics/launchers?id=${deploymentId}`),
        ]);

        if (!depRes.ok) {
          throw new Error("לא ניתן למצוא את הפריסה");
        }

        const depData = await depRes.json();
        const launchersData = launchersRes.ok ? await launchersRes.json() : [];

        if (isMounted) {
          const name = depData.name ?? `פריסה ${deploymentId}`;
          setDeploymentName(name);
          setEditableName(name);
          setCurrentFileName(state?.fileName || `${name}.csv`);

          if (Array.isArray(launchersData) && launchersData.length > 0) {
            const mappedRows: CsvRow[] = launchersData.map((l: any) => ({
              id: l.id ? String(l.id) : "",
              launcher_type_name: String(l.name || ""),
              longitude: String(l.location?.long ?? 0),
              latitude: String(l.location?.lat ?? 0),
              asl: "0",
              agl: "0",
              amount: String(
                Array.isArray(l.interceptors)
                  ? l.interceptors.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0)
                  : 0
              ),
            }));
            setEditableRows(mappedRows);
          } else if (Array.isArray(depData.launchers) && depData.launchers.length > 0) {
            const mappedRows: CsvRow[] = depData.launchers.map((l: any) => ({
              id: l.id ? String(l.id) : "",
              launcher_type_name: String(l.name || "ShieldNest-Lite"),
              longitude: String(l.location?.longitude ?? 0),
              latitude: String(l.location?.latitude ?? 0),
              asl: String(l.location?.asl ?? 0),
              agl: String(l.location?.agl ?? 0),
              amount: String(l.ammunitionAmount ?? 0),
            }));
            setEditableRows(mappedRows);
          }
        }
      } catch (err) {
        console.error("Failed to load deployment:", err);
      } finally {
        if (isMounted) {
          setIsLoadingDeployment(false);
        }
      }
    }

    void loadDeployment();

    return () => {
      isMounted = false;
    };
  }, [deploymentId, state, navigate]);

  // Compute number of unsaved changes (name changed + any row modifications)
  const unsavedChangesCount =
    (editableName.trim() !== deploymentName.trim() ? 1 : 0) +
    rowsHistory.length;

  const handleUndo = () => {
    if (rowsHistory.length === 0) return;
    const prevRows = rowsHistory[rowsHistory.length - 1];
    setEditableRows(prevRows);
    setRowsHistory((prev) => prev.slice(0, prev.length - 1));
  };

  /**
   * Generic handler to update a launcher row (e.g. from coordinates change on the map or panel)
   */
  const handleUpdateRow = (index: number, updatedFields: Partial<CsvRow>) => {
    setRowsHistory((prev) => [...prev, editableRows]);
    setEditableRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updatedFields };
      return updated;
    });
  };

  /**
   * Saves updated deployment details (name, updated launcher rows/coordinates)
   * via PATCH /api/logistics/deployments/:id and returns to /logistics
   */
  const handleSaveDeployment = async () => {
    if (!deploymentId) {
      navigate("/logistics");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: {
        name: string;
        rows?: Array<{
          id?: string;
          launcher_type_name?: string;
          longitude?: number;
          latitude?: number;
          asl?: number;
          agl?: number;
          amount?: number;
        }>;
      } = {
        name: editableName.trim() || deploymentName,
      };

      // If rows have been edited, pass the formatted row updates
      if (rowsHistory.length > 0) {
        payload.rows = editableRows.map((r) => ({
          launcher_type_name: r.launcher_type_name,
          longitude: Number(r.longitude),
          latitude: Number(r.latitude),
          asl: Number(r.asl),
          agl: Number(r.agl),
          amount: Number(r.amount),
        }));
      }

      const response = await fetch(
        `${API_URL}/api/logistics/deployments/${deploymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `שגיאה בשמירת הפריסה (${response.status})`,
        );
      }

      // Successfully saved - navigate back to logistics tab
      navigate("/logistics");
    } catch (err) {
      console.error("Failed to save deployment:", err);
      const msg = err instanceof Error ? err.message : "שגיאה בשמירת הפריסה";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Launcher types from API
  const [launcherTypes, setLauncherTypes] = useState<LauncherTypeFromApi[]>([]);
  const [launcherTypesLoading, setLauncherTypesLoading] = useState(true);

  // Selected launcher state
  const [selectedLauncher, setSelectedLauncher] = useState<{
    id: string;
    typeName: string;
    missileType: string;
    range: string;
    coordinates: string;
    availableInterceptors: string;
  } | null>(null);

  // Fetch launcher types from API
  useEffect(() => {
    let cancelled = false;

    async function fetchLauncherTypes() {
      try {
        const response = await fetch(`${API_URL}/api/logistics/launcher-types`);
        if (!response.ok) {
          console.error("Failed to fetch launcher types:", response.status);
          return;
        }
        const data: LauncherTypeFromApi[] = await response.json();
        if (!cancelled) {
          setLauncherTypes(data);
        }
      } catch (error) {
        console.error("Error fetching launcher types:", error);
      } finally {
        if (!cancelled) {
          setLauncherTypesLoading(false);
        }
      }
    }

    void fetchLauncherTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Aggregate launcher types from editable rows, ordered by API launcher types
   */
  const launcherSummaries: LauncherTypeSummary[] = useMemo(() => {
    const counts: Record<string, number> = {};

    editableRows.forEach((row) => {
      const typeName = (row.launcher_type_name || "").trim();
      if (typeName) {
        counts[typeName] = (counts[typeName] || 0) + 1;
      }
    });

    const result: LauncherTypeSummary[] = [];

    // Use API-fetched launcher types for ordering
    if (launcherTypes.length > 0) {
      launcherTypes.forEach((lt) => {
        result.push({ name: lt.name, count: counts[lt.name] ?? 0 });
        delete counts[lt.name];
      });
    }

    // Add any remaining types from CSV that aren't in the API
    Object.keys(counts).forEach((name) => {
      result.push({ name, count: counts[name] });
    });

    return result;
  }, [editableRows, launcherTypes]);

  const handleTogglePreviewLauncher = (typeName?: string) => {
    if (selectedLauncher) {
      setSelectedLauncher(null);
      return;
    }

    const targetType = typeName || launcherTypes[0]?.name || "Unknown";
    // Find the matching API launcher type for range info
    const apiType = launcherTypes.find((lt) => lt.name === targetType);
    const rangeKm = apiType?.rangeM ? `${Math.round(apiType.rangeM / 1000)} ק"מ` : '—';

    // Find the first matching row from parsed data for coordinates
    const matchingRow = editableRows.find(
      (r) => (r.launcher_type_name || "").trim() === targetType,
    );

    setSelectedLauncher({
      id: `מיירט-${String(state?.deploymentId ?? 0).padStart(2, "0")}`,
      typeName: targetType,
      missileType: "—",
      range: rangeKm,
      coordinates: matchingRow
        ? `${matchingRow.latitude}, ${matchingRow.longitude}`
        : "—",
      availableInterceptors: matchingRow?.amount ?? "—",
    });
  };

  const validCount = editableRows.length;
  const totalIdentified = editableRows.length;

  if (!state) {
    return <div />;
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-[#070a0e] text-white"
      dir="rtl"
    >

      {/* ================= ACTION SUB-HEADER BAR ================= */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1c2533] bg-[#0c1118] px-6">
        {/* Right: Breadcrumb title & CSV pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/logistics")}
            className="flex items-center gap-1.5 text-lg font-bold text-white transition hover:text-gray-300"
            title="חזור"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>אימות פריסה מיובאת</span>
          </button>
          <span className="rounded-md border border-[#2b3848] bg-[#161f2c] px-2.5 py-0.5 font-mono text-xs font-bold text-gray-300">
            CSV
          </span>
        </div>

        {/* Center: Deployment name (editable) & Filename pill */}
        <div className="flex items-center gap-3">
          {/* Editable Deployment Name */}
          <div className="flex items-center gap-2 rounded-md border border-[#2b3848] bg-[#101620] px-3 py-1.5 text-sm text-gray-200">
            {isEditingName ? (
              <input
                type="text"
                autoFocus
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingName(false);
                }}
                className="bg-transparent text-sm text-white outline-none border-b border-sky-400"
              />
            ) : (
              <span
                onClick={() => setIsEditingName(true)}
                className="cursor-pointer hover:text-white"
                title="לחץ לעריכת שם הפריסה"
              >
                {editableName || "פריסה ללא שם"}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsEditingName((prev) => !prev)}
              className="text-gray-400 hover:text-white"
              title="ערוך שם"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {/* Filename Pill */}
          <div className="flex items-center gap-2 rounded-md border border-[#2b3848] bg-[#101620] px-3 py-1.5 text-sm text-gray-300">
            <span className="font-mono text-xs text-gray-200">{currentFileName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
        </div>

        {/* Left: Action Buttons */}
        <div className="flex items-center gap-3">
          {saveError && (
            <span className="text-xs text-rose-400 font-medium">
              {saveError}
            </span>
          )}

          <button
            type="button"
            onClick={() => navigate("/logistics")}
            disabled={isSaving}
            className="rounded-md border border-[#374457] bg-[#111722] px-4 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-[#1a2332] hover:text-white disabled:opacity-50"
          >
            חזור
          </button>

          <button
            type="button"
            onClick={() => void handleSaveDeployment()}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-white px-5 py-1.5 text-sm font-semibold text-[#0c1017] shadow transition hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin text-[#0c1017]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                <span>שומר...</span>
              </>
            ) : (
              <span>אשר ושמור פריסה</span>
            )}
          </button>
        </div>
      </div>

      {/* ================= MAIN TWO-COLUMN BODY ================= */}
      <div className="flex min-h-0 flex-1 overflow-hidden p-4 gap-4">
        {/* ================= RIGHT SECTION: CARDS PANEL ================= */}
        <aside className="flex w-[420px] shrink-0 flex-col justify-between gap-4 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {/* CARD 1: סיכום ייבוא (Import Summary) */}
            <div className="rounded-lg border border-[#1e2736] bg-[#0c1118] p-5 shadow-lg">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">סיכום ייבוא</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#34d399]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10b981] text-[#064e3b] text-[10px] font-black">
                    ✓
                  </span>
                  <span>הייבוא הושלם בהצלחה</span>
                </div>
              </div>

              {/* Summary Rows */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8896a6]">קובץ</span>
                  <span className="font-mono text-gray-200">{currentFileName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8896a6]">מערכות שזוהו</span>
                  <span className="font-semibold text-white">{totalIdentified}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8896a6]">תקינות</span>
                  <span className="text-gray-200">
                    {validCount} מתוך {totalIdentified}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-[#1c2533]" />

              {/* Launcher Breakdown Grid - DYNAMIC from API */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {launcherTypesLoading ? (
                  <div className="col-span-4 py-4 text-xs text-gray-400">טוען...</div>
                ) : (
                  launcherSummaries.slice(0, 4).map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-col items-center justify-between rounded-md border border-[#1e2837] bg-[#0e141e] p-2.5"
                    >
                      <div className="my-1 flex h-8 items-center justify-center">
                        {getLauncherTypeIcon(item.name, 26)}
                      </div>
                      <div className="mt-1 w-full truncate text-[11px] font-medium text-gray-300">
                        {item.name}
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        {item.count}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD 2: המערכת שנבחרה (Selected Launcher) */}
            <div className="rounded-lg border border-[#1e2736] bg-[#0c1118] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">המערכת שנבחרה</h3>
                {selectedLauncher && (
                  <button
                    type="button"
                    onClick={() => setSelectedLauncher(null)}
                    className="text-[11px] text-gray-400 hover:text-white"
                  >
                    נקה בחירה
                  </button>
                )}
              </div>

              {selectedLauncher ? (
                <div className="mt-4">
                  <div className="flex items-start justify-between">
                    {/* Left Icon & Type */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-950/20">
                        {getLauncherTypeIcon(selectedLauncher.typeName, 36)}
                      </div>
                      <span className="text-xs font-semibold text-gray-200">
                        {selectedLauncher.typeName}
                      </span>
                    </div>

                    {/* Right Key-Values */}
                    <div className="space-y-2 text-xs text-left">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-white">{selectedLauncher.id}</span>
                        <span className="text-[#8896a6]">מזהה:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-white">{selectedLauncher.missileType}</span>
                        <span className="text-[#8896a6]">סוג טיל:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-white">{selectedLauncher.range}</span>
                        <span className="text-[#8896a6]">רדיוס יירוט:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-mono text-gray-200">{selectedLauncher.coordinates}</span>
                        <span className="text-[#8896a6]">קואורדינטה:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-white">{selectedLauncher.availableInterceptors}</span>
                        <span className="text-[#8896a6]">מיירטים זמינים:</span>
                      </div>
                    </div>
                  </div>

                  {/* Change Location Button */}
                  <button
                    type="button"
                    className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#334255] bg-[#111823] text-xs font-semibold text-white transition hover:bg-[#1b2536]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="22" y1="12" x2="18" y2="12" />
                      <line x1="6" y1="12" x2="2" y2="12" />
                      <line x1="12" y1="6" x2="12" y2="2" />
                      <line x1="12" y1="22" x2="12" y2="18" />
                    </svg>
                    <span>שינוי מיקום</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-start justify-between">
                    {/* Left Generic Icon placeholder */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-[#2b3748] bg-[#0f151f]">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <span className="text-xs text-[#64748b]">—</span>
                    </div>

                    {/* Right Key-Values placeholders */}
                    <div className="space-y-2 text-xs text-left">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[#64748b]">—</span>
                        <span className="text-[#8896a6]">מזהה:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[#64748b]">—</span>
                        <span className="text-[#8896a6]">סוג טיל:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[#64748b]">—</span>
                        <span className="text-[#8896a6]">רדיוס יירוט:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[#64748b]">—</span>
                        <span className="text-[#8896a6]">קואורדינטה:</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[#64748b]">—</span>
                        <span className="text-[#8896a6]">מיירטים זמינים:</span>
                      </div>
                    </div>
                  </div>

                  {/* Disabled Change Location Button */}
                  <button
                    type="button"
                    disabled
                    className="mt-5 flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-[#232d3b] bg-[#0e131b] text-xs font-medium text-gray-500 opacity-60"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="22" y1="12" x2="18" y2="12" />
                      <line x1="6" y1="12" x2="2" y2="12" />
                      <line x1="12" y1="6" x2="12" y2="2" />
                      <line x1="12" y1="22" x2="12" y2="18" />
                    </svg>
                    <span>שינוי מיקום</span>
                  </button>

                  <div className="mt-3 text-center text-[11px] text-[#6b7785]">
                    לא נבחרה מערכת מהמפה (תצוגת מפה אינה זמינה כעת)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar: Unsaved changes & Undo button */}
          <div className="flex items-center justify-between rounded-lg border border-[#1e2736] bg-[#0c1118] px-4 py-3 text-xs">
            <span className="text-[#8896a6]">
              שינויים שלא נשמרו:{" "}
              <strong className={`font-semibold ${unsavedChangesCount > 0 ? "text-amber-400" : "text-white"}`}>
                {unsavedChangesCount}
              </strong>
            </span>
            <button
              type="button"
              onClick={handleUndo}
              disabled={rowsHistory.length === 0}
              className={`flex items-center gap-1.5 transition ${
                rowsHistory.length > 0
                  ? "text-sky-400 hover:text-sky-300 cursor-pointer"
                  : "text-[#64748b] cursor-not-allowed"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              <span>בטל שינוי אחרון</span>
            </button>
          </div>
        </aside>

        {/* ================= LEFT SECTION: DEPLOYMENT / MAP VIEW ================= */}
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-[#1e2736] bg-[#090d13]">
          {/* Header */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#1c2533] px-4">
            <h3 className="text-sm font-bold text-white">תצוגת הפריסה</h3>
            <span className="text-xs text-[#7f8c9b]">
              לחץ על מערכת לצפייה בפרטים ולשינוי מיקום
            </span>
          </div>

          {/* Tactical Map Placeholder Area */}
          <div className="relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden p-4">
            {/* Subtle tactical radar background styling */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at center, #223249 1px, transparent 1px), linear-gradient(to right, #16202e 1px, transparent 1px), linear-gradient(to bottom, #16202e 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Top Toolbar: Search Input */}
            <div className="relative z-10 flex items-center justify-start">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="חיפוש במפה"
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#2b3848] bg-[#0f151e]/90 pr-9 pl-3 text-xs text-white placeholder:text-gray-400 outline-none backdrop-blur-sm transition focus:border-sky-500"
                />
                <svg
                  width="16"
                  height="16"
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

            {/* Center: Clean tactical placeholder */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-300">
                תצוגת מפה אינה פעילה
              </p>
              <p className="mt-1 max-w-sm text-xs text-[#7f8c9b]">
                פרטי הפריסה וסיכום המערכות מוצגים בחלונית הבקרה מימין. תצוגת המפה האינטראקטיבית תתווסף בהמשך.
              </p>
            </div>

            {/* Bottom Row: Zoom buttons and Legend bar */}
            <div className="relative z-10 flex items-end justify-between gap-4">
              {/* Zoom Controls */}
              <div className="flex flex-col overflow-hidden rounded-md border border-[#2b3848] bg-[#111722]/90 shadow-md">
                <button
                  type="button"
                  aria-label="התקרב"
                  className="flex h-8 w-8 items-center justify-center text-base font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  +
                </button>
                <div className="h-px bg-[#2b3848]" />
                <button
                  type="button"
                  aria-label="התרחק"
                  className="flex h-8 w-8 items-center justify-center text-base font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  −
                </button>
              </div>

              {/* Bottom Legend Bar - DYNAMIC from API */}
              <div className="flex items-center gap-6 rounded-md border border-[#222c3b] bg-[#0c121a]/95 px-5 py-2.5 backdrop-blur-sm">
                {launcherTypesLoading ? (
                  <span className="text-xs text-gray-400">טוען סוגי משגרים...</span>
                ) : (
                  launcherSummaries
                    .filter((s) => s.count > 0)
                    .map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2"
                      >
                        {getLauncherTypeIcon(item.name, 20)}
                        <div className="flex items-baseline gap-1 text-xs">
                          <span className="text-gray-300 font-medium">{item.name}</span>
                          <span className="font-bold text-white">{item.count}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
