import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";

interface PolygonFeature {
  type: "Feature";
  properties: {
    CITY_NAME?: string;
    ENG_NAME?: string;
    OBJECTID?: number;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface PolygonResponse {
  type: "FeatureCollection";
  features: PolygonFeature[];
}

type AlertState = "siren" | "threatened" | "normal";

interface AlertStatusEntry {
  type: "siren" | "threatened";
  cityId: number;
}

const DEFAULT_COLOR = "#a8a8a8";
const ALERT_COLOR = "#ff0000";
const BLINK_INTERVAL_MS = 500;
const POLL_INTERVAL_MS = 2000;

interface TrackedPolygon {
  polygon: L.Polygon;
  state: AlertState;
  blinkInterval?: ReturnType<typeof setInterval>;
  showingRed: boolean;
}

const parseAlertEntry = (
  raw: unknown,
): { objectId: number; state: "siren" | "threatened" } | null => {
  if (typeof raw === "object" && raw !== null) {
    const entry = raw as Partial<AlertStatusEntry> & {
      cityId?: number | string;
    };
    const objectId = Number(entry.cityId);
    if (
      (entry.type !== "siren" && entry.type !== "threatened") ||
      !Number.isInteger(objectId)
    ) {
      console.warn("Unrecognized alert entry:", raw);
      return null;
    }

    return { objectId, state: entry.type };
  }

  if (typeof raw !== "string") {
    console.warn("Unrecognized alert entry:", raw);
    return null;
  }

  const [state, idStr] = raw.split(":");
  const objectId = Number(idStr);

  if ((state !== "siren" && state !== "threatened") || Number.isNaN(objectId)) {
    console.warn(`Unrecognized alert entry: "${raw}"`);
    return null;
  }

  return { objectId, state };
};

export async function mountPolygonLayer(
  group: LayerGroup,
  _map: LeafletMap,
): Promise<() => void> {
  const apiUrl = import.meta.env.VITE_API_URL ?? "";
  const tracked = new Map<number, TrackedPolygon>();
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;

  const setColor = (polygon: L.Polygon, color: string) => {
    polygon.setStyle({ color, fillColor: color });
  };

  const startBlink = (entry: TrackedPolygon) => {
    if (entry.blinkInterval) return; // already blinking, don't restart
    entry.showingRed = true;
    setColor(entry.polygon, ALERT_COLOR);
    entry.blinkInterval = setInterval(() => {
      entry.showingRed = !entry.showingRed;
      setColor(entry.polygon, entry.showingRed ? ALERT_COLOR : DEFAULT_COLOR);
    }, BLINK_INTERVAL_MS);
  };

  const stopBlink = (entry: TrackedPolygon) => {
    if (entry.blinkInterval) {
      clearInterval(entry.blinkInterval);
      entry.blinkInterval = undefined;
    }
  };

  const applyState = (entry: TrackedPolygon, next: AlertState) => {
    if (entry.state === next) return; // unchanged, don't touch DOM/timers

    if (next === "siren") {
      startBlink(entry);
    } else if (next === "threatened") {
      stopBlink(entry);
      setColor(entry.polygon, ALERT_COLOR);
    } else {
      stopBlink(entry);
      setColor(entry.polygon, DEFAULT_COLOR);
    }

    entry.state = next;
  };

  // --- Build polygons once ---
  try {
    const response = await fetch(`${apiUrl}/api/alerts/cities`);
    if (!response.ok) {
      throw new Error(`Failed to fetch polygons: ${response.status}`);
    }

    const data: PolygonResponse = await response.json();

    data.features.forEach((feature) => {
      if (feature.geometry.type !== "Polygon") return;

      const objectId = feature.properties.OBJECTID;
      if (objectId === undefined) return;

      const latLngs: L.LatLngExpression[][] = feature.geometry.coordinates.map(
        (ring) => ring.map(([longitude, latitude]) => [latitude, longitude]),
      );

      const polygon = L.polygon(latLngs, {
        color: DEFAULT_COLOR,
        weight: 2,
        fillColor: DEFAULT_COLOR,
        fillOpacity: 0.25,
      })
        .bindPopup(
          `
  <div dir="rtl" style="font-size: 14px; font-weight: 700;">
    ${feature.properties.CITY_NAME ?? ""}
  </div>
`,
        )
        .addTo(group);

      tracked.set(Number(objectId), {
        polygon,
        state: "normal",
        showingRed: false,
      });
    });
  } catch (error) {
    console.error("Failed to load polygon layer:", error);
  }

  // --- Poll alert status every 2s and reconcile against current state ---
  const pollStatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/alerts/status`);
      if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
      const raw: unknown[] = await res.json();

      const activeIds = new Set<number>();

      raw.forEach((item) => {
        const parsed = parseAlertEntry(item);
        if (!parsed) return;

        activeIds.add(parsed.objectId);
        const entry = tracked.get(parsed.objectId);
        if (entry) applyState(entry, parsed.state);
      });

      // Anything not present in this poll = back to normal
      tracked.forEach((entry, objectId) => {
        if (!activeIds.has(objectId) && entry.state !== "normal") {
          applyState(entry, "normal");
        }
      });
    } catch (error) {
      console.error("Failed to poll alert status:", error);
    }
  };

  if (!stopped) {
    await pollStatus(); // sync immediately instead of waiting the first 2s
    pollTimer = setInterval(pollStatus, POLL_INTERVAL_MS);
  }

  // Cleanup: stop polling and clear any active blink intervals
  return () => {
    stopped = true;
    if (pollTimer) clearInterval(pollTimer);
    tracked.forEach((entry) => stopBlink(entry));
    tracked.clear();
  };
}