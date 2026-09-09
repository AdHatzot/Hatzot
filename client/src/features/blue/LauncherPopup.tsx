import React from "react";

/**
 * InfoPopup
 * A dark, map-style info card: icon + title/subtitle header, a close button,
 * a list of labeled stat rows, an optional "pip" row (e.g. remaining stock
 * rendered as icons), and a status badge.
 *
 * Fully data-driven — pass your own rows/status, no hardcoded content.
 */

export interface StatRow {
  /** Small icon/emoji/SVG shown at the start of the row */
  icon: React.ReactNode;
  /** Row label, e.g. "סוג טיל" */
  label: string;
  /** Row value, e.g. "BuzzStop-15" */
  value: string;
}

export interface PipRow {
  icon: React.ReactNode;
  label: string;
  /** Total number of pips to render */
  total: number;
  /** Number of pips rendered as "filled" */
  filled: number;
  /** Optional text shown before the pips, e.g. "8 מתוך 6" */
  caption?: string;
}

export interface InfoPopupProps {
  /** Icon shown in the header (defaults to a diamond) */
  headerIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rows: StatRow[];
  pipRow?: PipRow;
  status?: {
    label: string;
    tone?: "active" | "inactive";
  };
  onClose?: () => void;
  /** Text direction — defaults to "rtl" to match Hebrew content */
  dir?: "rtl" | "ltr";
  className?: string;
}

const DiamondIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2 L22 12 L12 22 L2 12 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const AmmoPip: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="10"
    height="20"
    viewBox="0 0 10 20"
    aria-hidden="true"
    style={{ opacity: filled ? 1 : 0.35, flexShrink: 0 }}
  >
    <path
      d="M5 0 L9 6 L9 20 L1 20 L1 6 Z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

export const InfoPopup: React.FC<InfoPopupProps> = ({
  headerIcon,
  title,
  subtitle,
  rows,
  pipRow,
  status,
  onClose,
  dir = "rtl",
  className,
}) => {
  return (
    <div
      dir={dir}
      className={className}
      style={{
        width: 320,
        background: "rgba(15, 18, 24, 0.92)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 16,
        color: "#E8EAED",
        fontFamily:
          "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(90, 169, 255, 0.15)",
              color: "#5AA9FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {headerIcon ?? <DiamondIcon />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(232,234,237,0.55)",
                  marginTop: 2,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(232,234,237,0.6)",
              cursor: "pointer",
              padding: 4,
              lineHeight: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4 L20 20 M20 4 L4 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Stat rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(232,234,237,0.6)",
              }}
            >
              <span style={{ width: 16, display: "inline-flex" }}>
                {row.icon}
              </span>
              <span>{row.label}</span>
            </div>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}

        {/* Pip row (e.g. remaining interceptors) */}
        {pipRow && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(232,234,237,0.6)",
              }}
            >
              <span style={{ width: 16, display: "inline-flex" }}>
                {pipRow.icon}
              </span>
              <span>{pipRow.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {pipRow.caption && (
                <span style={{ color: "rgba(232,234,237,0.6)" }}>
                  {pipRow.caption}
                </span>
              )}
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: pipRow.total }).map((_, i) => (
                  <AmmoPip key={i} filled={i < pipRow.filled} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status badge */}
      {status && (
        <div style={{ marginTop: 14 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 999,
              background:
                status.tone === "inactive"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(52, 199, 89, 0.15)",
              color: status.tone === "inactive" ? "rgba(232,234,237,0.6)" : "#34C759",
            }}
          >
            {status.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default InfoPopup;
