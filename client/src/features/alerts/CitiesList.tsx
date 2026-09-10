import { useEffect, useMemo, useState } from "react";
import {
  ExclamationTriangleFill,
  Building,
  Search,
  X,
  ChevronDown,
  GeoAlt,
  MegaphoneFill,
} from "react-bootstrap-icons";

// const MOCK_CITIES = [
//   { id: "1", name: "באר שבע-מערב", minutesAgo: 2 },
//   { id: "2", name: "אור נהר", minutesAgo: 4 },
//   { id: "3", name: "גבעת זאב", minutesAgo: 6 },
//   { id: "4", name: "נווה ירק", minutesAgo: 8 },
//   { id: "5", name: "קדומים", minutesAgo: 10 },
//   { id: "6", name: "המעפיל", minutesAgo: 13 },
//   { id: "7", name: "חיננית", minutesAgo: 16 },
//   { id: "9", name: "באר שבע-מזרח", minutesAgo: 22 },
//   { id: "10", name: "באר שבע-צפון", minutesAgo: 25 },
// ];

export function CitiesList(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState<string[]>([
    "siren:1",
    "siren:2",
    "threatened:3",
    "threatened:4",
  ]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      const data: string[] = JSON.parse(event.data);

      setAlerts(data);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    setIsOpen(alerts.length > 0);
  }, [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter((alert) => {
      const cityId = alert.split(":")[1];

      const city = CITI.find((city) => city.id === cityId);

      return city?.name.includes(query.trim());
    });
  }, [alerts, query]);

  return (
    <div
      dir="rtl"
      style={{
        width: "100%",
        fontFamily: "inherit",
        fontSize: 14,
        color: "#f2f2f2",
        background: "#1c1c1e",
        border: "1px solid #33333a",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "rgba(139, 0, 0, 0.35)",
          border: "none",
          padding: "10px 12px",
          color: "#f2f2f2",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              background: "#e03131",
              color: "#fff",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              padding: "2px 8px",
            }}
          >
            {alerts.length}
          </span>
          <span style={{ fontWeight: 500 }}>יישובים בהתראה</span>
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ExclamationTriangleFill size={16} color="#e03131" />

          <ChevronDown
            size={16}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </span>
      </button>

      {isOpen && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderTop: "1px solid #33333a",
              borderBottom: "1px solid #33333a",
            }}
          >
            <Search size={16} color="#9a9a9f" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש יישוב..."
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f2f2f2",
                fontSize: 14,
              }}
            />

            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                display: "flex",
                background: "transparent",
                border: "none",
                color: "#9a9a9f",
                cursor: "pointer",
                padding: 2,
              }}
            >
              <X size={16} />
            </button>
          </div>

          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: "100%",
              overflowY: "auto",
            }}
          >
            {filtered.map((alert, index) => {
              const cityId = alert.split(":")[1];
              const city = MOCK_CITIES.find((city) => city.id === cityId);
              if (!city) return null;

              return (
                <li
                  key={city.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderBottom:
                      index < filtered.length - 1
                        ? "1px solid #33333a"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        color: "#9a9a9f",
                      }}
                    >
                      <GeoAlt size={16} />

                      <span
                        style={{
                          fontSize: 11,
                          whiteSpace: "nowrap",
                        }}
                      >
                        לפני {city.minutesAgo} דק׳
                      </span>
                    </div>

                    <span>{city.name}</span>
                  </div>

                  <div
                    style={{
                      width: 40,
                      display: "flex",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building size={16} color="#9a9a9f" />
                  </div>

                  <div
                    style={{
                      width: 40,
                      display: "flex",
                      justifyContent: "flex-start",
                      flexShrink: 0,
                    }}
                  >
                    {alert.startsWith("siren:") ? (
                      <MegaphoneFill size={16} color="#e03131" />
                    ) : (
                      <ExclamationTriangleFill size={16} color="#f5c542" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
