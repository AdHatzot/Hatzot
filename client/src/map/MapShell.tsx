/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 */

import BlueMarker from "../../public/icons/blue-marker.svg";
import CloudFence from "../../public/icons/CloudFence-Area.svg";
import HorizonEye from "../../public/icons/HorizonEye-MX.svg";
import IronHook from "../../public/icons/IronHook-SR.svg";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import { ISRAEL_BOUNDS, ISRAEL_CENTER, ISRAEL_ZOOM } from "@/shared/geo";
import { useMapContext } from "./MapContext";
import { useTeamLayers } from "./useTeamLayers";
import { LayersButton } from "./controls/LayersButton";
import { LayersPanel } from "./controls/LayersPanel";
import { MapInfoBar } from "./MapInfoBar";

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;
const API_BASE_URL = "http://localhost:3000";

export interface InfoBarItem {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
}

// TODO: replace with real data source
const DEMO_ITEMS: InfoBarItem[] = [
  {
    id: "i1",
    label: "ShieldNest-Lite",
    count: 18,
    icon: <img src={BlueMarker} alt="Blue Marker" width="30px" height="30px" />,
  },
  {
    id: "i2",
    label: "IronHook-SR",
    count: 14,
    icon: <img src={IronHook} alt="Blue Marker" width="25px" height="25px" />,
  },
  {
    id: "i3",
    label: "HorizonEye-MX",
    count: 12,
    icon: <img src={HorizonEye} alt="Blue Marker" width="25px" height="25px" />,
  },
  {
    id: "i4",
    label: "CloudFence-Area",
    count: 12,
    icon: <img src={CloudFence} alt="Blue Marker" width="25px" height="25px" />,
  },
];

export function MapShell({ visible }: { visible: boolean }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const created = useRef(false);
  const { map, setMap } = useMapContext();
  const [layersOpen, setLayersOpen] = useState(false);
  const { layers, toggle } = useTeamLayers(map);

  useEffect(() => {
    if (created.current || !containerRef.current) return;
    created.current = true;

    const instance: LeafletMap = L.map(containerRef.current, {
      center: ISRAEL_CENTER,
      zoom: ISRAEL_ZOOM,
      minZoom: 7,
      maxZoom: 18,
      maxBounds: ISRAEL_BOUNDS,
      maxBoundsViscosity: 0.7,
      attributionControl: true,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomleft" }).addTo(instance);
    L.tileLayer(TILE_URL, {
      maxZoom: 18,
      subdomains: "abcd",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(instance);

    setMap(instance);
  }, [setMap]);

  useEffect(() => {
    if (visible && map) map.invalidateSize();
  }, [visible, map]);

  useEffect(() => {
    const loadData = async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/logistics/launcher-data`,
      );

      console.log(response);
    };

    loadData();
  }, []);

  return (
    <div className={`absolute inset-0 ${visible ? "" : "invisible"}`}>
      <div
        ref={containerRef}
        data-testid="ops-map"
        className="absolute inset-0"
      />
      <LayersButton
        open={layersOpen}
        onToggle={() => setLayersOpen((v) => !v)}
      />
      <LayersPanel open={layersOpen} layers={layers} onToggle={toggle} />

      <MapInfoBar infoItems={DEMO_ITEMS} />
    </div>
  );
}
