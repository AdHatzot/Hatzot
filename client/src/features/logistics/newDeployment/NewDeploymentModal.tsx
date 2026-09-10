import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { CsvRow, NewDeployment } from "./types";
import {
  CloudFenceIcon,
  getLauncherTypeIcon,
  HorizonEyeIcon,
  IronHookIcon,
  ShieldNestIcon,
} from "./LauncherIcons";
import {
  createSampleCsvFile,
  SAMPLE_CSV_ROWS,
  SAMPLE_DEPLOYMENT_NAME,
  SAMPLE_FILE_NAME,
} from "./sampleData";

type NewDeploymentModalProps = {
  onClose: () => void;
  onCreated?: (deployment: NewDeployment) => void;
  isSubmitting?: boolean;
  submitError?: string;
};

const REQUIRED_COLUMNS = [
  "launcher_type_name",
  "longitude",
  "latitude",
  "asl",
  "agl",
  "amount",
];

const MAX_ROWS = 57;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type CsvStatus = "empty" | "valid" | "warning" | "invalid";

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
}

/**
 * Basic CSV line parser supporting quoted values and commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(content: string): {
  headers: string[];
  rows: CsvRow[];
} {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");

  if (nonEmptyLines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(nonEmptyLines[0]).map((header) => header.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < nonEmptyLines.length; i += 1) {
    const values = parseCsvLine(nonEmptyLines[i]);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    rows.push(row);
  }

  return { headers, rows };
}

function validateCsv(
  headers: string[],
  rows: CsvRow[],
): {
  status: CsvStatus;
  error?: string;
  warning?: string;
} {
  if (headers.length === 0) {
    return {
      status: "invalid",
      error: "הקובץ אינו תקין. הקובץ אינו מכיל כותרות.",
    };
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  const missingColumns = REQUIRED_COLUMNS.filter(
    (requiredColumn) =>
      !normalizedHeaders.includes(normalizeHeader(requiredColumn)),
  );

  if (missingColumns.length > 0) {
    return {
      status: "invalid",
      error: `הקובץ אינו תקין. חסרות העמודות: ${missingColumns.join(", ")}.`,
    };
  }

  if (rows.length === 0) {
    return {
      status: "invalid",
      error: "הקובץ אינו תקין. הקובץ אינו מכיל שורות נתונים.",
    };
  }

  if (rows.length > MAX_ROWS) {
    return {
      status: "invalid",
      error: `הקובץ אינו תקין. ניתן להעלות עד ${MAX_ROWS} שורות נתונים.`,
    };
  }

  if (rows.length < MAX_ROWS) {
    return {
      status: "warning",
      warning: `הקובץ מכיל ${rows.length} מתוך ${MAX_ROWS} שורות אפשריות.`,
    };
  }

  return {
    status: "valid",
  };
}

interface LauncherTypeSummary {
  name: string;
  count: number;
}

export function NewDeploymentModal({
  onClose,
  onCreated,
  isSubmitting = false,
  submitError = "",
}: NewDeploymentModalProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // By default, pre-populate with the screenshot's sample values for immediate, smooth preview
  const [deploymentName, setDeploymentName] = useState<string>(SAMPLE_DEPLOYMENT_NAME);
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(() => createSampleCsvFile());
  const [parsedRows, setParsedRows] = useState<CsvRow[]>(() => SAMPLE_CSV_ROWS);
  const [csvStatus, setCsvStatus] = useState<CsvStatus>("valid");
  const [csvError, setCsvError] = useState("");
  const [csvWarning, setCsvWarning] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Navigation step: "verify" (the main requested UI from picture) or "upload"
  const [currentStep, setCurrentStep] = useState<"upload" | "verify">("verify");

  // Selected launcher state (generic empty state by default as requested: "Currently no data cause you cant choose a specific launcher cause there is no map")
  const [selectedLauncher, setSelectedLauncher] = useState<{
    id: string;
    typeName: string;
    missileType: string;
    range: string;
    coordinates: string;
    availableInterceptors: string;
  } | null>(null);

  const [mapSearch, setMapSearch] = useState("");

  /**
   * Aggregate launcher types from parsed rows
   */
  const launcherSummaries: LauncherTypeSummary[] = useMemo(() => {
    const counts: Record<string, number> = {};

    parsedRows.forEach((row) => {
      const typeName = (row.launcher_type_name || "").trim();
      if (typeName) {
        counts[typeName] = (counts[typeName] || 0) + 1;
      }
    });

    // Default known types order from screenshot
    const standardOrder = [
      "ShieldNest-Lite",
      "IronHook-SR",
      "HorizonEye-MX",
      "CloudFence-Area",
    ];

    const result: LauncherTypeSummary[] = [];

    // First add standard types in order
    standardOrder.forEach((name) => {
      if (counts[name] !== undefined) {
        result.push({ name, count: counts[name] });
        delete counts[name];
      } else {
        // If parsedRows is not empty, still show 0 if not present
        result.push({ name, count: 0 });
      }
    });

    // Add any remaining custom types
    Object.keys(counts).forEach((name) => {
      result.push({ name, count: counts[name] });
    });

    return result;
  }, [parsedRows]);

  /**
   * Process and validate the selected CSV.
   */
  const processFile = async (file: File) => {
    setSelectedFile(null);
    setParsedRows([]);
    setCsvStatus("empty");
    setCsvError("");
    setCsvWarning("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvStatus("invalid");
      setCsvError("ניתן להעלות קובץ CSV בלבד.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setCsvStatus("invalid");
      setCsvError("הקובץ גדול מדי. הגודל המרבי הוא 10MB.");
      return;
    }

    try {
      const content = await file.text();
      const { headers, rows } = parseCsv(content);
      const validation = validateCsv(headers, rows);

      setSelectedFile(file);
      setParsedRows(rows);
      setCsvStatus(validation.status);
      setCsvError(validation.error ?? "");
      setCsvWarning(validation.warning ?? "");

      if (validation.status === "valid" || validation.status === "warning") {
        // If deployment name was empty, default to file name without extension
        if (!deploymentName.trim()) {
          const autoName = file.name.replace(/\.csv$/i, "");
          setDeploymentName(autoName);
        }
        // Transition directly to verification step
        setCurrentStep("verify");
      }
    } catch {
      setSelectedFile(null);
      setParsedRows([]);
      setCsvStatus("invalid");
      setCsvError("לא ניתן לקרוא את קובץ ה-CSV.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleLoadSample = () => {
    const file = createSampleCsvFile();
    setDeploymentName(SAMPLE_DEPLOYMENT_NAME);
    setSelectedFile(file);
    setParsedRows(SAMPLE_CSV_ROWS);
    setCsvStatus("valid");
    setCsvError("");
    setCsvWarning("");
    setSelectedLauncher(null);
    setCurrentStep("verify");
  };

  const canCreate =
    deploymentName.trim().length > 0 &&
    selectedFile !== null &&
    parsedRows.length > 0 &&
    (csvStatus === "valid" || csvStatus === "warning");

  const handleCreate = () => {
    if (!canCreate || !selectedFile) {
      return;
    }

    const deployment: NewDeployment = {
      name: deploymentName.trim(),
      file: selectedFile,
      rows: parsedRows,
    };

    onCreated?.(deployment);
  };

  /**
   * Toggle previewing sample launcher data (like in the picture) or clearing it
   */
  const handleTogglePreviewLauncher = (typeName?: string) => {
    if (selectedLauncher) {
      // Clear back to empty state
      setSelectedLauncher(null);
      return;
    }

    // Populate generic preview data for the chosen/first type
    const targetType = typeName || "ShieldNest-Lite";
    setSelectedLauncher({
      id: "מיירט-06",
      typeName: targetType,
      missileType: "BuzzStop-15",
      range: '80 ק"מ',
      coordinates: "32.8191, 34.9983",
      availableInterceptors: "24",
    });
  };

  // =========================================================================
  // STEP 1: UPLOAD VIEW
  // =========================================================================
  if (currentStep === "upload") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        dir="rtl"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="relative w-full max-w-[620px] overflow-hidden rounded-xl border border-[#2d3748] bg-[#0c1017] text-white shadow-2xl"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="relative border-b border-[#1c2430] px-7 pb-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6L18 18" />
                <path d="M18 6L6 18" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded bg-[#1e293b] px-2 py-0.5 font-mono text-xs font-semibold text-sky-400 border border-[#334155]">CSV</span>
              <h2 className="text-xl font-bold tracking-tight">יבוא פריסה חדשה מקובץ</h2>
            </div>
            <p className="mt-1 text-sm text-[#94a3b8]">
              הגדר שם והעלה קובץ CSV עם פירוט המערכות
            </p>
          </div>

          {/* Form */}
          <div className="px-7 py-6">
            <div>
              <label htmlFor="deployment-name-input" className="mb-2 block text-sm font-medium text-gray-200">
                שם פריסה <span className="text-rose-500">*</span>
              </label>
              <input
                id="deployment-name-input"
                type="text"
                placeholder="לדוגמה: פריסת צפון — ספטמבר 2026"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
                className="h-11 w-full rounded-md border border-[#2d3748] bg-[#111622] px-4 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-200">
                קובץ פריסה (CSV) <span className="text-rose-500">*</span>
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 transition ${
                  isDragging
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-[#334155] bg-[#0f141d] hover:border-gray-400 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="text-base font-medium text-white">גרור לכאן קובץ CSV</div>
                <div className="mt-1 text-xs text-gray-400">או לחץ לעיון בקבצי המחשב • עד 10MB</div>
              </div>

              {/* Sample loader button */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#2d3748] bg-[#111722] p-3">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="font-mono text-sky-400">north_deployment_2026.csv</span>
                  <span>(18 מערכות להדגמה)</span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
                >
                  טען נתוני דוגמה
                </button>
              </div>

              {csvError && (
                <div className="mt-3 rounded-md border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
                  {csvError}
                </div>
              )}
            </div>

            {submitError && (
              <div className="mt-4 rounded-md border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#1c2430] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-md border border-[#374151] px-5 text-sm font-medium text-gray-300 transition hover:bg-white/5"
              >
                ביטול
              </button>

              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep("verify")}
                  className="h-10 rounded-md bg-white px-6 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
                >
                  המשך לאימות פריסה ←
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEP 2: VERIFICATION VIEW (Matches Reference Mockup)
  // =========================================================================
  const validCount = parsedRows.length;
  const totalIdentified = parsedRows.length;
  const currentFileName = selectedFile?.name || SAMPLE_FILE_NAME;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#070a0e] text-white"
      dir="rtl"
    >
      {/* ================= TOP TACTICAL APP BAR ================= */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1c2533] bg-[#0b0f15] px-5 text-sm">
        {/* Right side: Menu & Live indicators */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="תפריט"
            className="flex h-8 w-8 items-center justify-center rounded text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            <span>שידור חי</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
            <span>מערכות תקינות</span>
          </div>
        </div>

        {/* Center: Brand Name */}
        <div className="text-base font-extrabold tracking-wider text-white">
          חצות
        </div>

        {/* Left side: Command Center Logo */}
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
            <path d="M12 3L2 20H22L12 3Z" />
            <path d="M12 9L7 18H17L12 9Z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-200">
            מרכז פיקוד טקטי
          </span>
        </div>
      </header>

      {/* ================= ACTION SUB-HEADER BAR ================= */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1c2533] bg-[#0c1118] px-6">
        {/* Right: Breadcrumb title & CSV pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep("upload")}
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
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
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
                {deploymentName || "פריסה ללא שם"}
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
          <button
            type="button"
            onClick={() => setCurrentStep("upload")}
            className="rounded-md border border-[#374457] bg-[#111722] px-4 py-1.5 text-sm font-medium text-gray-200 transition hover:bg-[#1a2332] hover:text-white"
          >
            חזור להעלאה
          </button>

          <button
            type="button"
            disabled={!canCreate || isSubmitting}
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-md bg-white px-5 py-1.5 text-sm font-semibold text-[#0c1017] shadow transition hover:bg-gray-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin text-gray-900" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                <span>שומר פריסה...</span>
              </>
            ) : (
              <span>אשר ושמור פריסה</span>
            )}
          </button>
        </div>
      </div>

      {/* Submit Error Banner if any */}
      {submitError && (
        <div className="bg-rose-950/70 border-b border-rose-800 px-6 py-2 text-center text-xs text-rose-200">
          שגיאה בשמירת הפריסה: {submitError}
        </div>
      )}

      {/* ================= MAIN TWO-COLUMN BODY ================= */}
      <div className="flex min-h-0 flex-1 overflow-hidden p-4 gap-4">
        {/* ================= LEFT SECTION: DEPLOYMENT / MAP VIEW ================= */}
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-[#1e2736] bg-[#090d13]">
          {/* Header */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#1c2533] px-4">
            <h3 className="text-sm font-bold text-white">תצוגת הפריסה</h3>
            <span className="text-xs text-[#7f8c9b]">
              לחץ על מערכת לצפייה בפרטים ולשינוי מיקום
            </span>
          </div>

          {/* Tactical Map Placeholder Area (User: "Don'y create the map") */}
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

            {/* Center: Clean tactical placeholder explaining no map is created as instructed */}
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
                פרטי הפריסה וסיכום המערכות מוצגים בחלונית הבקרה משמאל. תצוגת המפה האינטראקטיבית תתווסף בהמשך.
              </p>
            </div>

            {/* Bottom Row: Zoom buttons and Legend bar */}
            <div className="relative z-10 flex items-end justify-between gap-4">
              {/* Zoom Controls (Bottom Left in LTR / Bottom Right in RTL) */}
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

              {/* Bottom Legend Bar with the 4 launcher types */}
              <div className="flex items-center gap-6 rounded-md border border-[#222c3b] bg-[#0c121a]/95 px-5 py-2.5 backdrop-blur-sm">
                <div
                  onClick={() => handleTogglePreviewLauncher("ShieldNest-Lite")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  title="לחץ לתצוגה מקדימה"
                >
                  <ShieldNestIcon size={20} />
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="text-gray-300 font-medium">ShieldNest-Lite</span>
                    <span className="font-bold text-white">
                      {launcherSummaries.find((s) => s.name === "ShieldNest-Lite")?.count ?? 6}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => handleTogglePreviewLauncher("IronHook-SR")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  title="לחץ לתצוגה מקדימה"
                >
                  <IronHookIcon size={20} />
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="text-gray-300 font-medium">IronHook-SR</span>
                    <span className="font-bold text-white">
                      {launcherSummaries.find((s) => s.name === "IronHook-SR")?.count ?? 4}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => handleTogglePreviewLauncher("HorizonEye-MX")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  title="לחץ לתצוגה מקדימה"
                >
                  <HorizonEyeIcon size={20} />
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="text-gray-300 font-medium">HorizonEye-MX</span>
                    <span className="font-bold text-white">
                      {launcherSummaries.find((s) => s.name === "HorizonEye-MX")?.count ?? 3}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => handleTogglePreviewLauncher("CloudFence-Area")}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  title="לחץ לתצוגה מקדימה"
                >
                  <CloudFenceIcon size={20} />
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="text-gray-300 font-medium">CloudFence-Area</span>
                    <span className="font-bold text-white">
                      {launcherSummaries.find((s) => s.name === "CloudFence-Area")?.count ?? 5}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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

              {/* Launcher Breakdown Grid (4 columns) */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {launcherSummaries.slice(0, 4).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleTogglePreviewLauncher(item.name)}
                    className="flex flex-col items-center justify-between rounded-md border border-[#1e2837] bg-[#0e141e] p-2.5 transition hover:border-[#384a62] hover:bg-[#131b27]"
                    title={`לחץ לבחירת ${item.name}`}
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
                  </button>
                ))}
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

              {/* Generic UI for selected launcher details */}
              {selectedLauncher ? (
                /* Populated State (e.g. if user clicked to preview or when launcher is selected) */
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
                /* Generic Empty State (Default as requested: "Currently no data cause you cant choose a specific launcher cause there is no map") */
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
              שינויים שלא נשמרו: <strong className="font-semibold text-white">0</strong>
            </span>
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 text-[#64748b] cursor-not-allowed transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              <span>בטל שינוי אחרון</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
