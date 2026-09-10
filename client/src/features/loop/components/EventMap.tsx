/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Dedicated tactical Leaflet map visualizer for selected interception events.
 * Displays:
 * - Friendly launcher position + range circle + label
 * - Enemy drone position + label
 * - Interception point (crosshair) + trajectory lines
 * - Telemetry bar at the bottom with 4 columns
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { InterceptionEvent } from '../types';

interface EventMapProps {
  selectedEvent: InterceptionEvent | null;
}

function formatLaunchTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toTimeString().split(' ')[0] ?? '—';
  } catch {
    return '—';
  }
}

export function EventMap({ selectedEvent }: EventMapProps): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [32.0853, 34.7818],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const tileUrl =
      import.meta.env.VITE_MAP_TILE_URL ??
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);

    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Visuals on selectedEvent
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!selectedEvent) return;

    // Determine Coordinates
    // Fallbacks if some positions are missing from test/sample records
    const droneLat = selectedEvent.threat.lastPosition?.latitude ?? 32.79;
    const droneLng = selectedEvent.threat.lastPosition?.longitude ?? 34.95;

    const launcherLat = selectedEvent.interceptorLaunchPosition?.latitude ?? 31.95;
    const launcherLng = selectedEvent.interceptorLaunchPosition?.longitude ?? 34.80;

    // Interception point: midpoint or explicit
    const hitLat = (droneLat + launcherLat) / 2 + 0.05;
    const hitLng = (droneLng + launcherLng) / 2 + 0.05;

    // 1. Threat Drone Marker
    const droneIcon = L.divIcon({
      className: 'custom-drone-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
          <div style="width: 32px; height: 32px; background: rgba(239, 68, 68, 0.2); border: 2px solid #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"/>
            </svg>
          </div>
          <span style="background: rgba(13, 18, 24, 0.85); color: #c8d6e2; font-family: monospace; font-size: 11px; padding: 1px 6px; border-radius: 3px; border: 1px solid #2b3a4a; margin-top: 4px; white-space: nowrap;">
            רחפן-${selectedEvent.threat.droneId.padStart(3, '0')}
          </span>
        </div>
      `,
      iconSize: [0, 0],
    });

    const droneMarker = L.marker([droneLat, droneLng], { icon: droneIcon });
    group.addLayer(droneMarker);

    // 2. Launcher Marker + Range Ring
    const launcherIcon = L.divIcon({
      className: 'custom-launcher-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
          <div style="width: 32px; height: 32px; background: rgba(47, 155, 255, 0.2); border: 2px solid #2f9bff; border-radius: 4px; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(47, 155, 255, 0.6);">
            <div style="width: 8px; height: 8px; background: #2f9bff; border-radius: 50%;"></div>
          </div>
          <span style="background: rgba(13, 18, 24, 0.85); color: #c8d6e2; font-family: monospace; font-size: 11px; padding: 1px 6px; border-radius: 3px; border: 1px solid #2b3a4a; margin-top: 10px; white-space: nowrap;">
            מיירט-${selectedEvent.launcher.liveLauncherId.padStart(2, '0')}
          </span>
        </div>
      `,
      iconSize: [0, 0],
    });

    const launcherMarker = L.marker([launcherLat, launcherLng], { icon: launcherIcon });
    group.addLayer(launcherMarker);

    // Range Ring around launcher
    const rangeCircle = L.circle([launcherLat, launcherLng], {
      radius: 40000,
      color: '#2f9bff',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#2f9bff',
      fillOpacity: 0.06,
    });
    group.addLayer(rangeCircle);

    // 3. Interception Point Crosshair Marker
    const hitIcon = L.divIcon({
      className: 'custom-hit-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
          <div style="width: 24px; height: 24px; border: 1.5px dashed #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <span style="color: #ffffff; font-size: 11px; margin-top: 2px; text-shadow: 0 0 4px #000; white-space: nowrap;">
            נקודת יירוט
          </span>
        </div>
      `,
      iconSize: [0, 0],
    });

    const hitMarker = L.marker([hitLat, hitLng], { icon: hitIcon });
    group.addLayer(hitMarker);

    // 4. Trajectory Lines
    // Drone trajectory (Red dashed)
    const droneLine = L.polyline(
      [
        [droneLat, droneLng],
        [hitLat, hitLng],
      ],
      {
        color: '#ff3b30',
        weight: 2,
        dashArray: '5, 8',
        opacity: 0.8,
      },
    );
    group.addLayer(droneLine);

    // Interceptor trajectory (Blue dashed)
    const interceptorLine = L.polyline(
      [
        [launcherLat, launcherLng],
        [hitLat, hitLng],
      ],
      {
        color: '#2f9bff',
        weight: 2.2,
        dashArray: '4, 6',
        opacity: 0.9,
      },
    );
    group.addLayer(interceptorLine);

    // Fit Bounds
    const bounds = L.latLngBounds([
      [droneLat, droneLng],
      [launcherLat, launcherLng],
      [hitLat, hitLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }, [selectedEvent]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-panel">
      {/* Map Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-text">מיקום האירוע</h3>
        <span className="text-xs text-text-dim">בחירת שורה תציג את האירוע על המפה</span>
      </div>

      {/* Map Canvas */}
      <div className="relative min-h-[340px] flex-1 bg-bg">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="grid grid-cols-4 border-t border-line bg-panel p-3 text-center">
        <div className="border-e border-line/60 px-2 last:border-e-0">
          <div className="font-mono text-sm font-semibold text-text">
            {selectedEvent ? `EVT-${selectedEvent.id.padStart(4, '0')}` : '—'}
          </div>
          <div className="mt-0.5 text-xs text-text-dim">מזהה אירוע</div>
        </div>
        <div className="border-e border-line/60 px-2 last:border-e-0">
          <div className="font-mono text-sm font-semibold text-text">
            {selectedEvent ? `רחפן-${selectedEvent.threat.droneId.padStart(3, '0')}` : '—'}
          </div>
          <div className="mt-0.5 text-xs text-text-dim">מזהה רחפן</div>
        </div>
        <div className="border-e border-line/60 px-2 last:border-e-0">
          <div className="font-mono text-sm font-semibold text-text">
            {selectedEvent ? `מיירט-${selectedEvent.launcher.liveLauncherId.padStart(2, '0')}` : '—'}
          </div>
          <div className="mt-0.5 text-xs text-text-dim">מיירט</div>
        </div>
        <div className="px-2">
          <div className="font-mono text-sm font-semibold text-text">
            {selectedEvent ? formatLaunchTime(selectedEvent.launchedAt) : '—'}
          </div>
          <div className="mt-0.5 text-xs text-text-dim">שעת שיגור</div>
        </div>
      </div>
    </div>
  );
}
