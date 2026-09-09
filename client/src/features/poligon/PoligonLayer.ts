import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";

interface PolygonFeature {
  type: "Feature";
  properties: {
    CITY_NAME?: string;
    ENG_NAME?: string;
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

export async function mountPolygonLayer(
  group: LayerGroup,
  _map: LeafletMap,
): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/alerts/cities`,
    );

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

      L.polygon(latLngs, {
        color: "#a8a8a8",
        weight: 2,
        fillColor: "#a8a8a8",
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
    });
  } catch (error) {
    console.error("Failed to load polygon layer:", error);
  }
}
