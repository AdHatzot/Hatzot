import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";

interface PolygonFeature {
  type: "Feature";
  properties: {
    CITY_NAME?: string;
    ENG_NAME?: string;
    OBJECTID?: number;
    CITY_ID?: number;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
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

const normalizeCityName = (name: string): string =>
  name.trim().replace(/\s+/g, " ");

interface TrackedPolygon {
  polygon: L.Polygon;
  cityName: string;
  state: AlertState;
  blinkInterval?: ReturnType<typeof setInterval>;
  showingRed: boolean;
}

const parseAlertEntry = (
  raw: unknown,
): {
  objectId: number;
  cityName?: string;
  state: "siren" | "threatened";
} | null => {
  if (typeof raw === "object" && raw !== null) {
    const entry = raw as Partial<AlertStatusEntry> & {
      cityId?: number | string;
    };
    const objectId = Number(entry.cityId);
    if (
      (entry.type !== "siren" && entry.type !== "threatened") ||
      !Number.isInteger(objectId)
    ) {
      return null;
    }

    return {
      objectId,
      cityName:
        typeof (entry as { cityName?: unknown }).cityName === "string"
          ? (entry as { cityName: string }).cityName
          : undefined,
      state: entry.type,
    };
  }

  if (typeof raw !== "string") {
    return null;
  }

  const [state, idStr] = raw.split(":");
  const objectId = Number(idStr);

  if ((state !== "siren" && state !== "threatened") || Number.isNaN(objectId)) {
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
  const trackedByName = new Map<string, TrackedPolygon>();
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;

  const setColor = (polygon: L.Polygon, color: string) => {
    polygon.setStyle({ color, fillColor: color });
  };

  const startBlink = (entry: TrackedPolygon) => {
    if (entry.blinkInterval) return;
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
    if (entry.state === next) return;

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

  try {
    const response = await fetch(`${apiUrl}/api/alerts/cities`);
    if (!response.ok) {
      throw new Error(`Failed to fetch polygons: ${response.status}`);
    }

    const data: PolygonResponse = await response.json();

    data.features.forEach((feature) => {
      const cityId = feature.properties.CITY_ID;
      if (cityId === undefined) return;

      const latLngs = (
        feature.geometry.type === "Polygon"
          ? (feature.geometry.coordinates as number[][][]).map((ring) =>
              ring.map(([longitude, latitude]) => [latitude, longitude]),
            )
          : (feature.geometry.coordinates as number[][][][]).flatMap(
              (polygon) =>
                polygon.map((ring) =>
                  ring.map(([longitude, latitude]) => [latitude, longitude]),
                ),
            )
      ) as L.LatLngExpression[][];

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

      const trackedPolygon: TrackedPolygon = {
        polygon,
        cityName: feature.properties.CITY_NAME ?? "",
        state: "normal",
        showingRed: false,
      };

      tracked.set(Number(cityId), trackedPolygon);
      if (trackedPolygon.cityName) {
        trackedByName.set(
          normalizeCityName(trackedPolygon.cityName),
          trackedPolygon,
        );
      }
    });
  } catch (error) {
    console.error("Failed to load polygon layer:", error);
  }

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
        const entry =
          tracked.get(parsed.objectId) ??
          (parsed.cityName
            ? trackedByName.get(normalizeCityName(parsed.cityName))
            : undefined);
        if (entry) applyState(entry, parsed.state);
      });

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
    await pollStatus();
    pollTimer = setInterval(pollStatus, POLL_INTERVAL_MS);
  }

  return () => {
    stopped = true;
    if (pollTimer) clearInterval(pollTimer);
    tracked.forEach((entry) => stopBlink(entry));
    tracked.clear();
    trackedByName.clear();
  };
}