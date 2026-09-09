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

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;

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
    </div>
  );
}
