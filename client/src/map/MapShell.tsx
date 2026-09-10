/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 */
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import { ISRAEL_BOUNDS, ISRAEL_CENTER, ISRAEL_ZOOM } from "@/shared/geo";
import { useMapContext } from "./MapContext";
import { useTeamLayers } from "./useTeamLayers";
import { LayersButton } from "./controls/LayersButton";
import { LayersPanel } from "./controls/LayersPanel";
import { MapInfoBar } from "./MapInfoBar";
import { Diamond, ChevronsUp, Triangle, Hexagon } from "lucide-react";

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;

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
    icon: <Diamond className="h-4 w-4 text-sky-400" />,
  },
  {
    id: "i2",
    label: "IronHook-SR",
    count: 14,
    icon: <ChevronsUp className="h-4 w-4 text-orange-400" />,
  },
  {
    id: "i3",
    label: "HorizonEye-MX",
    count: 12,
    icon: <Triangle className="h-4 w-4 text-emerald-400" />,
  },
  {
    id: "i4",
    label: "CloudFence-Area",
    count: 12,
    icon: <Hexagon className="h-4 w-4 text-violet-400" />,
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
