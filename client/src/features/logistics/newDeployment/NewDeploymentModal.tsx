import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { CsvRow, NewDeployment } from "./types";

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
 * Basic CSV line parser.
 *
 * Supports:
 * - comma separated values
 * - quoted values
 * - commas inside quoted values
 * - escaped quotes ("")
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

  /*
   * Empty lines don't count as data rows.
   */
  const nonEmptyLines = lines.filter((line) => line.trim() !== "");

  if (nonEmptyLines.length === 0) {
    return {
      headers: [],
      rows: [],
    };
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

  return {
    headers,
    rows,
  };
}

function validateCsv(
  headers: string[],
  rows: CsvRow[],
): {
  status: CsvStatus;
  error?: string;
  warning?: string;
} {
  /*
   * No header.
   */
  if (headers.length === 0) {
    return {
      status: "invalid",
      error: "הקובץ אינו תקין. הקובץ אינו מכיל כותרות.",
    };
  }

  /*
   * Check required columns.
   */
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

  /*
   * No data rows.
   */
  if (rows.length === 0) {
    return {
      status: "invalid",
      error: "הקובץ אינו תקין. הקובץ אינו מכיל שורות נתונים.",
    };
  }

  /*
   * More than 57 rows.
   */
  if (rows.length > MAX_ROWS) {
    return {
      status: "invalid",
      error: `הקובץ אינו תקין. ניתן להעלות עד ${MAX_ROWS} שורות נתונים.`,
    };
  }

  /*
   * Between 1 and 56 rows:
   * valid, but show warning.
   */
  if (rows.length < MAX_ROWS) {
    return {
      status: "warning",
      warning: `הקובץ מכיל ${rows.length} מתוך ${MAX_ROWS} שורות אפשריות. ניתן להמשיך.`,
    };
  }

  /*
   * Exactly 56 rows.
   */
  return {
    status: "valid",
  };
}

export function NewDeploymentModal({
  onClose,
  onCreated,
  isSubmitting = false,
  submitError = "",
}: NewDeploymentModalProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deploymentName, setDeploymentName] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);

  const [csvStatus, setCsvStatus] = useState<CsvStatus>("empty");

  const [csvError, setCsvError] = useState("");

  const [csvWarning, setCsvWarning] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  /**
   * Process and validate the selected CSV.
   */
  const processFile = async (file: File) => {
    /*
     * Reset the previous CSV state.
     */
    setSelectedFile(null);
    setParsedRows([]);
    setCsvStatus("empty");
    setCsvError("");
    setCsvWarning("");

    /*
     * CSV only.
     */
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvStatus("invalid");
      setCsvError("ניתן להעלות קובץ CSV בלבד.");
      return;
    }

    /*
     * 10MB maximum.
     */
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
    } catch {
      setSelectedFile(null);
      setParsedRows([]);
      setCsvStatus("invalid");

      setCsvError("לא ניתן לקרוא את קובץ ה-CSV.");
    }
  };

  /**
   * File input.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void processFile(file);
    }

    /*
     * Allows selecting the same file again.
     */
    event.target.value = "";
  };

  /**
   * Drag & drop.
   */
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void processFile(file);
    }
  };

  /**
   * Remove the current CSV.
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setCsvStatus("empty");
    setCsvError("");
    setCsvWarning("");
  };

  /**
   * Create is allowed when:
   *
   * 1. Deployment name exists
   * 2. File exists
   * 3. CSV is valid OR warning
   */
  const canCreate =
    deploymentName.trim().length > 0 &&
    selectedFile !== null &&
    (csvStatus === "valid" || csvStatus === "warning");

  /**
   * Create deployment.
   */
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
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/60
        p-4
      "
      dir="rtl"
      onMouseDown={(event) => {
        /*
         * Clicking the dark background closes the modal.
         */
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative
          w-full
          max-w-[620px]
          overflow-hidden
          rounded-xl
          border
          border-[#3b4149]
          bg-[#101418]
          text-white
          shadow-2xl
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-deployment-title"
      >
        {/* ================= HEADER ================= */}

        <div className="relative px-7 pb-2 pt-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="
              absolute
              left-5
              top-5
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              text-gray-300
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6L18 18" />
              <path d="M18 6L6 18" />
            </svg>
          </button>

          <h2
            id="new-deployment-title"
            className="
              text-right
              text-[25px]
              font-bold
              tracking-tight
            "
          >
            יבוא פריסה חדשה
          </h2>

          <p
            className="
              mt-2
              text-right
              text-[15px]
              text-[#aeb4bd]
            "
          >
            הגדר שם והעלה קובץ CSV בפורמט המערכת
          </p>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="px-7 pb-6 pt-5">
          {/* ================= DEPLOYMENT NAME ================= */}

          <div>
            <label
              htmlFor="deployment-name"
              className="
                mb-2
                block
                text-right
                text-[15px]
                font-medium
              "
            >
              שם פריסה <span className="text-[#e97070]">*</span>
            </label>

            <input
              id="deployment-name"
              type="text"
              value={deploymentName}
              onChange={(event) => setDeploymentName(event.target.value)}
              className="
                h-11
                w-full
                rounded-md
                border
                border-[#424850]
                bg-[#0e1216]
                px-4
                text-right
                text-[15px]
                text-white
                outline-none
                transition
                focus:border-[#6b737d]
                focus:ring-1
                focus:ring-[#6b737d]
              "
            />

            <p
              className="
                mt-2
                text-right
                text-[13px]
                text-[#858c96]
              "
            >
              השם יוצג ברשימת הפריסות
            </p>
          </div>

          {/* ================= CSV ================= */}

          <div className="mt-6">
            <label
              className="
                mb-2
                block
                text-right
                text-[15px]
                font-medium
              "
            >
              קובץ פריסה <span className="text-[#e97070]">*</span>
            </label>

            {/* ================= UPLOAD BOX ================= */}

            {!selectedFile ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex
                  min-h-[177px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-dashed
                  px-5
                  transition
                  ${isDragging
                    ? "border-white bg-white/5"
                    : "border-[#666d76] hover:bg-white/[0.025]"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Upload icon */}

                <div className="mb-3">
                  <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
                    <path
                      d="
                        M8 2H28L40 14V46
                        C40 48.2091 38.2091 50 36 50
                        H8
                        C5.79086 50 4 48.2091 4 46
                        V6
                        C4 3.79086 5.79086 2 8 2Z
                      "
                      stroke="#F1F3F5"
                      strokeWidth="2"
                    />

                    <path d="M28 2V14H40" stroke="#F1F3F5" strokeWidth="2" />

                    <path
                      d="M22 37V23"
                      stroke="#F1F3F5"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <path
                      d="M16 29L22 23L28 29"
                      stroke="#F1F3F5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div
                  className="
                    text-center
                    text-[18px]
                    font-medium
                  "
                >
                  גרור לכאן קובץ CSV
                </div>

                <div
                  className="
                    mt-1
                    text-center
                    text-[15px]
                    text-[#b5bbc3]
                  "
                >
                  או לחץ לבחירת קובץ
                </div>

                <div
                  className="
                    mt-2
                    text-center
                    text-[13px]
                    text-[#858c96]
                  "
                >
                  CSV בלבד • עד 10MB
                </div>
              </div>
            ) : (
              /* ================= SELECTED FILE ================= */

              <div
                className="
                  rounded-lg
                  border
                  border-[#3d444c]
                  bg-[#101419]
                  px-4
                  py-3
                "
              >
                <div className="flex items-center gap-3">
                  {/* File icon */}

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      border
                      border-[#9ca3ab]
                    "
                  >
                    <span className="text-[10px] font-bold">CSV</span>
                  </div>

                  {/* File information */}

                  <div className="min-w-0 flex-1 text-right">
                    <div
                      className="
                        truncate
                        text-[14px]
                        font-medium
                      "
                    >
                      {selectedFile.name}
                    </div>

                    <div
                      className="
                        mt-1
                        text-[12px]
                        text-[#9299a2]
                      "
                    >
                      {Math.max(1, Math.round(selectedFile.size / 1024))}
                      KB • {parsedRows.length} שורות
                    </div>
                  </div>

                  {/* Status */}

                  {csvStatus === "valid" && (
                    <div
                      className="
                        flex
                        shrink-0
                        items-center
                        gap-2
                        text-[13px]
                      "
                    >
                      <span
                        className="
                          flex
                          h-5
                          w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-[#3ddc84]
                          text-[#0b1710]
                        "
                      >
                        ✓
                      </span>

                      <span className="text-[#67d99a]">הקובץ תקין</span>
                    </div>
                  )}

                  {csvStatus === "warning" && (
                    <div
                      className="
                        flex
                        shrink-0
                        items-center
                        gap-2
                        text-[13px]
                      "
                    >
                      <span
                        className="
                          flex
                          h-5
                          w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-[#d9b84d]
                          text-[#17130a]
                        "
                      >
                        !
                      </span>

                      <span className="text-[#e5c96d]">אזהרה</span>
                    </div>
                  )}

                  {/* Replace */}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="
                      shrink-0
                      rounded-md
                      px-2
                      py-1
                      text-[12px]
                      text-[#b8bec6]
                      transition
                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    החלף
                  </button>

                  {/* Delete */}

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    aria-label="מחיקת קובץ"
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      text-[#9ca2aa]
                      transition
                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 7H20" />
                      <path d="M9 7V4H15V7" />
                      <path d="M7 7L8 20H16L17 7" />
                      <path d="M10 11V17" />
                      <path d="M14 11V17" />
                    </svg>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            {/* ================= ERROR ================= */}

            {csvError && (
              <div
                className="
                  mt-3
                  rounded-md
                  border
                  border-[#713f3f]
                  bg-[#291719]
                  px-3
                  py-2.5
                  text-right
                  text-[13px]
                  text-[#ff9999]
                "
              >
                {csvError}
              </div>
            )}

            {/* ================= WARNING ================= */}

            {csvWarning && csvStatus === "warning" && (
              <div
                className="
                    mt-3
                    rounded-md
                    border
                    border-[#69582e]
                    bg-[#292514]
                    px-3
                    py-2.5
                    text-right
                    text-[13px]
                    text-[#e5c96d]
                  "
              >
                {csvWarning}
              </div>
            )}

            {/* ================= REQUIRED COLUMNS ================= */}

            <div
              className="
                mt-4
                rounded-md
                border
                border-[#30363d]
                bg-[#151a1f]
                px-4
                py-3
                text-right
              "
            >
              <div
                className="
                  mb-2
                  text-[13px]
                  text-[#aeb4bc]
                "
              >
                הקובץ חייב לכלול:
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-x-6
                  gap-y-1
                  text-[12px]
                  text-[#d1d5da]
                "
              >
                {REQUIRED_COLUMNS.map((column) => (
                  <div key={column}>• {column}</div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= SUBMIT ERROR ================= */}

          {submitError && (
            <div
              className="
                mt-4
                rounded-md
                border
                border-[#713f3f]
                bg-[#291719]
                px-3
                py-2.5
                text-right
                text-[13px]
                text-[#ff9999]
              "
            >
              {submitError}
            </div>
          )}

          {/* ================= FOOTER ================= */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-between
              gap-3
            "
          >
            {/* Cancel */}

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                h-12
                min-w-[112px]
                rounded-md
                border
                border-[#59616b]
                bg-transparent
                px-5
                text-[15px]
                font-medium
                text-[#e5e7eb]
                transition
                hover:bg-white/5
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              ביטול
            </button>

            {/* Create */}

            <button
              type="button"
              disabled={!canCreate || isSubmitting}
              onClick={handleCreate}
              className="
                h-12
                min-w-[170px]
                rounded-md
                px-6
                text-[15px]
                font-semibold
                transition

                disabled:cursor-not-allowed
                disabled:bg-[#353a40]
                disabled:text-[#777e87]

                enabled:bg-white
                enabled:text-[#101418]
                enabled:hover:bg-[#eeeeee]
              "
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="31.4 31.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  יוצר פריסה...
                </span>
              ) : (
                "צור פריסה"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
