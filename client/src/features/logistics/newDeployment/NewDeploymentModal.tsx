import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { CsvRow, NewDeployment } from "./types";
import { getLauncherTypeIcon } from "./LauncherIcons";
import {
  createSampleCsvFile,
  SAMPLE_CSV_ROWS,
  SAMPLE_DEPLOYMENT_NAME,
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

  // Start with empty state — user must upload a file or load sample data
  const [deploymentName, setDeploymentName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [csvStatus, setCsvStatus] = useState<CsvStatus>("empty");
  const [csvError, setCsvError] = useState("");
  const [csvWarning, setCsvWarning] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Aggregate launcher types from parsed rows for the preview
   */
  const launcherSummaries: LauncherTypeSummary[] = useMemo(() => {
    const counts: Record<string, number> = {};

    parsedRows.forEach((row) => {
      const typeName = (row.launcher_type_name || "").trim();
      if (typeName) {
        counts[typeName] = (counts[typeName] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
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

            {/* Selected file info */}
            {selectedFile && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#2d3748] bg-[#111722] p-3">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  <span className="font-mono text-sky-400">{selectedFile.name}</span>
                  <span>({parsedRows.length} מערכות)</span>
                </div>
                {csvStatus === "valid" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#34d399]">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10b981] text-[#064e3b] text-[10px] font-black">✓</span>
                    תקין
                  </span>
                )}
              </div>
            )}

            {/* Launcher types preview from uploaded CSV */}
            {parsedRows.length > 0 && launcherSummaries.length > 0 && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#1e2736] bg-[#0c1118] p-3">
                {launcherSummaries.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    {getLauncherTypeIcon(item.name, 18)}
                    <span className="text-gray-300">{item.name}</span>
                    <span className="font-bold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sample loader button */}
            {!selectedFile && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#2d3748] bg-[#111722] p-3">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="font-mono text-sky-400">north_deployment_2026.csv</span>
                  <span>(18 מערכות להדגמה)</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample();
                  }}
                  className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
                >
                  טען נתוני דוגמה
                </button>
              </div>
            )}

            {csvError && (
              <div className="mt-3 rounded-md border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
                {csvError}
              </div>
            )}

            {csvWarning && !csvError && (
              <div className="mt-3 rounded-md border border-amber-900/50 bg-amber-950/40 p-3 text-xs text-amber-300">
                {csvWarning}
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

            <button
              type="button"
              disabled={!canCreate || isSubmitting}
              onClick={handleCreate}
              className="flex items-center gap-2 h-10 rounded-md bg-white px-6 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-gray-900" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                  <span>יוצר פריסה...</span>
                </>
              ) : (
                <span>צור פריסה</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
