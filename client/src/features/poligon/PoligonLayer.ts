import L, {
  type LayerGroup,
  type Map as LeafletMap,
} from "leaflet";

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
      "http://localhost:3000/api/alerts/cities",
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch polygons: ${response.status}`,
      );
    }

    const data: PolygonResponse = await response.json();

    data.features.forEach((feature) => {
      if (feature.geometry.type !== "Polygon") {
        return;
      }

      // GeoJSON: [longitude, latitude]
      // Leaflet: [latitude, longitude]
      const latLngs: L.LatLngExpression[][] =
        feature.geometry.coordinates.map((ring) =>
          ring.map(([longitude, latitude]) => [
            latitude,
            longitude,
          ]),
        );

      L.polygon(latLngs, {
        color: "#3388ff",
        weight: 2,
        fillColor: "#3388ff",
        fillOpacity: 0.25,
      })
        .bindPopup(`
          <div>
            <strong>${feature.properties.ENG_NAME ?? ""}</strong>
            <br />
            ${feature.properties.CITY_NAME ?? ""}
          </div>
        `)
        .addTo(group);
    });
  } catch (error) {
    console.error(
      "Failed to load polygon layer:",
      error,
    );
  }
}
