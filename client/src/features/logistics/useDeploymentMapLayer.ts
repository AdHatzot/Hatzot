import { useEffect, useRef, useState } from "react";
import L, { type LayerGroup, type Map as LeafletMap } from "leaflet";
import type { DeploymentLauncherPoint } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function ensurePopupStyles(): void {
  const styleId = "blue-launcher-popup-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .blue-launcher-popup .leaflet-popup-content-wrapper {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .blue-launcher-popup .leaflet-popup-content {
        margin: 0 !important;
        width: 280px !important;
      }
      .blue-launcher-popup .leaflet-popup-tip {
        background: #11161b !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function createDeploymentPointPopup(point: DeploymentLauncherPoint): string {
  return `
    <div dir="rtl" style="
      width:250px;
      background:#11161b;
      color:#f4f4f4;
      border-radius:10px;
      padding:14px;
      font-family:Arial,sans-serif;
      box-sizing:border-box;
      direction:rtl;
      text-align:right;
    ">
      <!-- Header -->
      <div style="
        display:flex;
        align-items:center;
        gap:10px;
      ">
        <img
          src="/icons/blue-marker.svg"
          alt=""
          style="
            width:32px;
            height:32px;
            object-fit:contain;
            flex-shrink:0;
          "
        />
        <div style="flex:1;">
          <div style="font-size:15px; font-weight:700;">
            משגר ${point.launcherId}
          </div>
          <div style="font-size:12px; color:#aeb5bc; margin-top:2px;">
            ${point.deployment.name} (${point.deployment.status ?? "פעיל"})
          </div>
        </div>
      </div>

      <div style="height:1px; background:#30353b; margin:10px 0;"></div>

      <!-- Location -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; font-size:12px;">
        <span style="color:#aeb5bc;">מיקום גיאוגרפי</span>
        <strong style="direction:ltr; font-family:monospace;">
          ${point.location.latitude.toFixed(4)}, ${point.location.longitude.toFixed(4)}
        </strong>
      </div>

      <!-- Altitude -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; font-size:12px;">
        <span style="color:#aeb5bc;">גובה (ASL / AGL)</span>
        <strong style="direction:ltr;">
          ${point.location.asl}m / ${point.location.agl}m
        </strong>
      </div>

      <div style="height:1px; background:#30353b; margin:10px 0;"></div>

      <!-- Ammunition -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
        <span style="color:#aeb5bc;">מלאי תחמושת</span>
        <strong style="color:#4ade80;">
          ${point.ammunitionAmount} מיירטים
        </strong>
      </div>
    </div>
  `;
}

export function useDeploymentMapLayer(
  map: LeafletMap | null,
  selectedDeploymentId: number | null
): {
  loadingPoints: boolean;
  pointsError: string | null;
  points: DeploymentLauncherPoint[];
} {
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [points, setPoints] = useState<DeploymentLauncherPoint[]>([]);

  // Initialize LayerGroup once map is ready
  useEffect(() => {
    if (!map) return;

    ensurePopupStyles();
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;

    return () => {
      group.remove();
      layerGroupRef.current = null;
    };
  }, [map]);

  // Load points whenever selected deployment changes
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;

    // Always clear previous deployment markers
    group.clearLayers();
    setPoints([]);
    setPointsError(null);

    if (selectedDeploymentId === null) {
      setLoadingPoints(false);
      return;
    }

    let isSubscribed = true;
    setLoadingPoints(true);

    fetch(`${API_BASE}/api/logistics/live-deployment/${selectedDeploymentId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`שגיאה בטעינת נקודות פריסה (${res.status})`);
        }
        return res.json() as Promise<DeploymentLauncherPoint[]>;
      })
      .then((data) => {
        if (!isSubscribed) return;
        setPoints(data);
        setLoadingPoints(false);

        const blueIcon = L.icon({
          iconUrl: "/icons/blue-marker.svg",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const latLngs: [number, number][] = [];

        data.forEach((point) => {
          const lat = point.location.latitude;
          const lng = point.location.longitude;
          latLngs.push([lat, lng]);

          L.marker([lat, lng], { icon: blueIcon })
            .bindPopup(createDeploymentPointPopup(point), {
              className: "blue-launcher-popup",
              closeButton: true,
              maxWidth: 280,
              minWidth: 280,
            })
            .addTo(group);
        });

        if (latLngs.length > 0 && map) {
          const bounds = L.latLngBounds(latLngs);
          map.flyToBounds(bounds, { maxZoom: 12, padding: [60, 60] });
        }
      })
      .catch((err: unknown) => {
        if (!isSubscribed) return;
        console.error("Failed to load deployment points:", err);
        setPointsError(err instanceof Error ? err.message : "שגיאה בטעינת נקודות");
        setLoadingPoints(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedDeploymentId, map]);

  return { loadingPoints, pointsError, points };
}
