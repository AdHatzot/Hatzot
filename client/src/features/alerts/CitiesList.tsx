import { useEffect, useMemo, useState } from "react";
import {
  ExclamationTriangleFill,
  GeoAltFill,
  MegaphoneFill,
} from "react-bootstrap-icons";

type AlertType = "siren" | "threatened";

type AlertStatus = {
  type: AlertType;
  cityId: number;
  cityName?: string;
  timestamp?: number;
};

const POLL_INTERVAL_MS = 2000;

const isAlertStatus = (value: unknown): value is AlertStatus => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  const cityId =
    typeof entry.cityId === "number"
      ? entry.cityId
      : typeof entry.cityId === "string"
        ? Number(entry.cityId)
        : Number.NaN;

  return (
    (entry.type === "siren" || entry.type === "threatened") &&
    Number.isInteger(cityId)
  );
};

const normalizeAlertStatus = (value: unknown): AlertStatus | null => {
  if (!isAlertStatus(value)) {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const cityId = Number(entry.cityId);

  return {
    type: entry.type as AlertType,
    cityId,
    ...(typeof entry.cityName === "string"
      ? { cityName: entry.cityName }
      : {}),
    ...(typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp)
      ? { timestamp: entry.timestamp }
      : {}),
  };
};

const getMinutesSinceAlert = (timestamp?: number): number | null => {
  if (timestamp === undefined) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60));
};

export function CitiesList(): JSX.Element {
  const [alerts, setAlerts] = useState<AlertStatus[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL ?? "";

  useEffect(() => {
    let stopped = false;

    const getAlertStatus = async (): Promise<void> => {
      try {
        const response = await fetch(`${apiUrl}/api/alerts/status`);
        if (!response.ok) {
          throw new Error(`Failed to fetch alert status: ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid alert status response");
        }

        if (!stopped) {
          setAlerts(
            data.flatMap((entry) => {
              const normalized = normalizeAlertStatus(entry);
              return normalized ? [normalized] : [];
            }),
          );
          setError(null);
        }
      } catch (requestError) {
        if (!stopped) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to fetch alert status",
          );
        }
      }
    };

    void getAlertStatus();
    const timer = window.setInterval(
      () => void getAlertStatus(),
      POLL_INTERVAL_MS,
    );

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [apiUrl]);

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return alerts;
    }

    return alerts.filter((alert) =>
      (alert.cityName ?? String(alert.cityId)).includes(normalizedQuery),
    );
  }, [alerts, query]);

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded border border-line bg-panel-2"
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="flex items-center gap-1 text-sm font-semibold text-text">
          <ExclamationTriangleFill
            aria-hidden="true"
            className="text-team-red"
            size={16}
          />
          יישובים בהתראה
        </h2>
        <span className="rounded-full bg-team-red px-2 py-0.5 text-xs text-white">
          {alerts.length}
        </span>
      </div>

      {alerts.length > 0 && (
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="חיפוש יישוב..."
          aria-label="חיפוש יישוב"
          className="w-full border-b border-line bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-text-dim"
        />
      )}

      {error && (
        <p className="px-3 py-2 text-xs text-team-red">לא ניתן לטעון התראות</p>
      )}

      {!error && alerts.length === 0 && (
        <p className="px-3 py-3 text-sm text-text-dim">אין התראות פעילות</p>
      )}

      {filteredAlerts.length > 0 && (
        <ul className="divide-y divide-line">
          {filteredAlerts.map((alert) => {
            const minutesSinceAlert = getMinutesSinceAlert(alert.timestamp);

            return (
              <li
                key={`${alert.type}-${alert.cityId}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2 text-text">
                  <GeoAltFill
                    aria-hidden="true"
                    className="shrink-0 text-text-dim"
                    size={15}
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate">
                      {alert.cityName ?? `יישוב ${alert.cityId}`}
                    </span>
                    {minutesSinceAlert !== null && (
                      <span className="text-[11px] text-text-dim">
                        {minutesSinceAlert === 0
                          ? "עכשיו"
                          : `לפני ${minutesSinceAlert} דקות`}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={
                    alert.type === "siren"
                      ? "text-team-red"
                      : "text-team-alerts"
                  }
                  title={alert.type === "siren" ? "סירנה" : "סכנה"}
                >
                  {alert.type === "siren" ? (
                    <MegaphoneFill aria-hidden="true" size={16} />
                  ) : (
                    <ExclamationTriangleFill aria-hidden="true" size={16} />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
