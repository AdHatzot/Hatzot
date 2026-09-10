/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Deployment preview map. A small Leaflet instance of logistics' own — the ops
 * map stays mounted (hidden) behind every other route and is never borrowed.
 * Launchers are drawn straight onto a layer group; React only passes the list.
 */
import "leaflet/dist/leaflet.css";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import L from "leaflet";
import { ISRAEL_CENTER, ISRAEL_ZOOM } from "@/shared/geo";
import { getLauncherTypeColor, getLauncherTypeIconUrl } from "../newDeployment/LauncherIcons";

const TILE_URL: string | undefined = import.meta.env.VITE_MAP_TILE_URL;

const FIT_PADDING: L.PointTuple = [56, 56];
const FIT_MAX_ZOOM = 11;
const SEARCH_MAX_ZOOM = 12;
const SEARCH_DEBOUNCE_MS = 350;

export interface PreviewLauncher {
  /** Stable while the deployment is open — a moved launcher keeps its key. */
  key: string;
  label: string;
  typeName: string;
  latitude: number;
  longitude: number;
  rangeM: number | null;
}

export interface LogisticsMapHandle {
  zoomIn(): void;
  zoomOut(): void;
}

interface LogisticsMapPreviewProps {
  launchers: PreviewLauncher[];
  selectedKey?: string | null;
  /** The launcher that can be dragged to a new position. */
  movableKey?: string | null;
  search?: string;
  showRanges?: boolean;
  emptyLabel?: string;
  onSelect?: (key: string) => void;
  onMove?: (key: string, latitude: number, longitude: number) => void;
}

function isPlaced(launcher: PreviewLauncher): boolean {
  return (
    Number.isFinite(launcher.latitude) &&
    Number.isFinite(launcher.longitude) &&
    Math.abs(launcher.latitude) <= 90 &&
    Math.abs(launcher.longitude) <= 180 &&
    !(launcher.latitude === 0 && launcher.longitude === 0)
  );
}

function matches(launcher: PreviewLauncher, query: string): boolean {
  return (
    launcher.typeName.toLowerCase().includes(query) ||
    launcher.label.toLowerCase().includes(query)
  );
}

function boundsOf(launchers: PreviewLauncher[]): L.LatLngBounds {
  return L.latLngBounds(launchers.map((launcher) => [launcher.latitude, launcher.longitude]));
}

function fitLaunchers(map: L.Map, launchers: PreviewLauncher[]): void {
  const placed = launchers.filter(isPlaced);
  if (placed.length === 0) {
    map.setView(ISRAEL_CENTER, ISRAEL_ZOOM, { animate: false });
    return;
  }
  map.fitBounds(boundsOf(placed), { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, animate: false });
}

function launcherIcon(typeName: string, accent: string, selected: boolean, movable: boolean): L.DivIcon {
  const size = selected ? 36 : 28;
  const ring = selected
    ? `0 0 0 2px ${accent}, 0 0 16px ${accent}`
    : `0 0 0 1px ${accent}80`;
  return L.divIcon({
    className: "logistics-launcher-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html:
      `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;` +
      `align-items:center;justify-content:center;background:rgba(7,10,14,0.85);` +
      `box-shadow:${ring};cursor:${movable ? "grab" : "pointer"}">` +
      `<img src="${getLauncherTypeIconUrl(typeName)}" alt="" draggable="false" ` +
      `style="width:${size - 8}px;height:${size - 8}px;object-fit:contain;pointer-events:none" />` +
      `</div>`,
  });
}

function tooltipContent(text: string): HTMLElement {
  // Type names come from uploaded CSVs — never let them reach innerHTML.
  const element = document.createElement("span");
  element.textContent = text;
  return element;
}

export const LogisticsMapPreview = forwardRef<LogisticsMapHandle, LogisticsMapPreviewProps>(
  function LogisticsMapPreview(
    {
      launchers,
      selectedKey = null,
      movableKey = null,
      search = "",
      showRanges = true,
      emptyLabel,
      onSelect,
      onMove,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const launchersRef = useRef(launchers);
    const callbacksRef = useRef({ onSelect, onMove });
    const pendingFitRef = useRef(false);

    useEffect(() => {
      launchersRef.current = launchers;
      callbacksRef.current = { onSelect, onMove };
    });

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => map?.zoomIn(),
        zoomOut: () => map?.zoomOut(),
      }),
      [map],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const instance = L.map(container, {
        center: ISRAEL_CENTER,
        zoom: ISRAEL_ZOOM,
        minZoom: 5,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: true,
      });
      if (TILE_URL) {
        L.tileLayer(TILE_URL, {
          maxZoom: 18,
          subdomains: "abcd",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }).addTo(instance);
      }

      // Panels resize with the layout; a fit made at zero size is redone once
      // the container has real dimensions.
      const observer = new ResizeObserver(() => {
        instance.invalidateSize();
        if (pendingFitRef.current && container.clientWidth > 0 && container.clientHeight > 0) {
          pendingFitRef.current = false;
          fitLaunchers(instance, launchersRef.current);
        }
      });
      observer.observe(container);
      setMap(instance);

      return () => {
        observer.disconnect();
        instance.remove();
      };
    }, []);

    // Reframe only when the set of launchers changes — not when one is moved.
    const signature = launchers.map((launcher) => launcher.key).join("|");
    useEffect(() => {
      if (!map) return;
      const container = map.getContainer();
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        pendingFitRef.current = true;
        return;
      }
      fitLaunchers(map, launchersRef.current);
    }, [map, signature]);

    useEffect(() => {
      if (!map) return;
      const group = L.layerGroup().addTo(map);
      const query = search.trim().toLowerCase();

      for (const launcher of launchers) {
        if (!isPlaced(launcher)) continue;
        const { accent } = getLauncherTypeColor(launcher.typeName);
        const selected = launcher.key === selectedKey;
        const movable = launcher.key === movableKey;
        const dimmed = query !== "" && !matches(launcher, query);
        const position: L.LatLngTuple = [launcher.latitude, launcher.longitude];

        if (showRanges && launcher.rangeM && launcher.rangeM > 0) {
          L.circle(position, {
            radius: launcher.rangeM,
            color: accent,
            weight: selected ? 1.5 : 1,
            opacity: dimmed ? 0.08 : selected ? 0.9 : 0.35,
            dashArray: selected ? undefined : "4 6",
            fillColor: accent,
            fillOpacity: dimmed ? 0 : selected ? 0.12 : 0.025,
            interactive: false,
          }).addTo(group);
        }

        const marker = L.marker(position, {
          icon: launcherIcon(launcher.typeName, accent, selected, movable),
          draggable: movable,
          keyboard: false,
          opacity: dimmed ? 0.3 : 1,
          zIndexOffset: selected ? 1000 : 0,
          riseOnHover: true,
        });
        marker.bindTooltip(tooltipContent(`${launcher.typeName} · ${launcher.label}`), {
          direction: "top",
          offset: [0, -16],
        });
        marker.on("click", () => callbacksRef.current.onSelect?.(launcher.key));
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          callbacksRef.current.onMove?.(launcher.key, lat, lng);
        });
        marker.addTo(group);
      }

      return () => {
        group.remove();
      };
    }, [map, launchers, selectedKey, movableKey, search, showRanges]);

    useEffect(() => {
      const query = search.trim().toLowerCase();
      if (!map || query === "") return;
      const timer = window.setTimeout(() => {
        const hits = launchersRef.current.filter(
          (launcher) => isPlaced(launcher) && matches(launcher, query),
        );
        if (hits.length > 0) {
          map.flyToBounds(boundsOf(hits), {
            padding: FIT_PADDING,
            maxZoom: SEARCH_MAX_ZOOM,
            duration: 0.6,
          });
        }
      }, SEARCH_DEBOUNCE_MS);
      return () => window.clearTimeout(timer);
    }, [map, search]);

    const placedCount = launchers.filter(isPlaced).length;

    return (
      <div className="absolute inset-0 z-0">
        <div ref={containerRef} data-testid="logistics-map-preview" className="absolute inset-0" />
        {emptyLabel && placedCount === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
            <span className="rounded-md border border-[#223042] bg-[#0c131d]/90 px-4 py-2 text-xs text-gray-300">
              {emptyLabel}
            </span>
          </div>
        )}
      </div>
    );
  },
);
