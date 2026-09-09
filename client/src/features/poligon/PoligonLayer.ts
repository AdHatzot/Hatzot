import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";

interface PolygonFeature {
  type: "Feature";
  properties: {
    CITY_NAME?: string;
    ENG_NAME?: string;
    OBJECTID?: number;
    TTL?: number; // seconds
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

const DEFAULT_COLOR = "#3388ff";
const ALERT_COLOR = "#ff0000";
const BLINK_INTERVAL_MS = 500;
const SOLID_RED_DURATION_MS = 10 * 60 * 1000; // 10 minutes

type Timer = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

export async function mountPolygonLayer(
  group: LayerGroup,
  _map: LeafletMap,
): Promise<() => void> {
  const alertedStub = [2, 4, 5, 12, 41, 1511, 1442, 142, 65, 654];

  const timers: Timer[] = [];

  try {
    const apiUrl = import.meta.env.VITE_API_URL ?? "";
    const response = await fetch(`${apiUrl}/api/alerts/cities`);

    if (!response.ok) {
      throw new Error(`Failed to fetch polygons: ${response.status}`);
    }

    const data: PolygonResponse = await response.json();

    data.features.forEach((feature) => {
      if (feature.geometry.type !== "Polygon") {
        return;
      }

      // GeoJSON: [longitude, latitude]
      // Leaflet: [latitude, longitude]
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
          <div>
            <strong>${feature.properties.ENG_NAME ?? ""}</strong>
            <br />
            ${feature.properties.CITY_NAME ?? ""}
          </div>
        `,
        )
        .addTo(group);

      const objectId = feature.properties.OBJECTID;
      const isAlerted =
        objectId !== undefined && alertedStub.includes(objectId);

      if (!isAlerted) {
        return;
      }

      const ttlSeconds = feature.properties.TTL ?? 0;
      const ttlMs = Math.max(0, ttlSeconds * 1000);

      startAlertSequence(polygon, ttlMs, timers);
    });
  } catch (error) {
    console.error("Failed to load polygon layer:", error);
  }

  // Cleanup: clear all pending blink/timeout timers for this layer
  return () => {
    timers.forEach((timer) => {
      clearTimeout(timer as ReturnType<typeof setTimeout>);
      clearInterval(timer as ReturnType<typeof setInterval>);
    });
    timers.length = 0;
  };
}

function startAlertSequence(
  polygon: L.Polygon,
  ttlMs: number,
  timers: Timer[],
): void {
  let showingRed = true;

  const setColor = (color: string) => {
    polygon.setStyle({ color, fillColor: color });
  };

  // Phase 1: blink red/blue for `ttlMs`
  const blinkInterval = setInterval(() => {
    showingRed = !showingRed;
    setColor(showingRed ? ALERT_COLOR : DEFAULT_COLOR);
  }, BLINK_INTERVAL_MS);
  timers.push(blinkInterval);

  // Phase 2: after ttlMs, stop blinking, hold solid red for 10 minutes
  const stopBlinkTimeout = setTimeout(() => {
    clearInterval(blinkInterval);
    setColor(ALERT_COLOR);

    // Phase 3: after 10 more minutes, revert to default blue
    const revertTimeout = setTimeout(() => {
      setColor(DEFAULT_COLOR);
    }, SOLID_RED_DURATION_MS);
    timers.push(revertTimeout);
  }, ttlMs);
  timers.push(stopBlinkTimeout);
}
