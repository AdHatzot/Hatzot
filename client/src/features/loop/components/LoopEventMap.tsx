/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * "מיקום האירוע" — the selected interception on its own small map: the
 * launcher and its reach, the threat, both paths and the intercept point.
 *
 * This is a second, page-local Leaflet instance, created when /logs mounts and
 * removed when it unmounts. The persistent ops map (src/map, hard rule 4) is
 * untouched. Drawing is keyed on what the event shows, not object identity,
 * so the background refresh neither redraws nor resets the operator's pan.
 */
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L, { type LatLngTuple, type LayerGroup, type Map as LeafletMap } from 'leaflet';
import { ISRAEL_CENTER } from '@/shared/geo';
import { cssVar } from '@/shared/theme';
import { droneCode, eventCode, formatClock, interceptorCode } from '../format';
import { arrowIcon, droneIcon, interceptPointIcon, launcherIcon } from '../mapIcons';
import { SYSTEM_TOKEN, systemKind } from '../systemGlyph';
import type { GeoPoint, InterceptionLogEntry } from '../types';

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;
// Licence condition of the CARTO free tier — same credit as the ops map.
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>';

const toLatLng = (point: GeoPoint): LatLngTuple => [point.latitude, point.longitude];

/** Everything that changes the drawing. */
function drawingKey(event: InterceptionLogEntry | null): string {
  if (!event) return '';
  return JSON.stringify([event.id, event.interceptPoint, event.launcher, event.interceptor.rangeM, event.drone]);
}

/** Draws the event into `group`; returns the points the camera should frame. */
function drawEvent(map: LeafletMap, group: LayerGroup, event: InterceptionLogEntry): LatLngTuple[] {
  const blue = cssVar('--team-blue');
  const red = cssVar('--team-red');
  const text = cssVar('--text');

  const launcher = event.launcher.position ? toLatLng(event.launcher.position) : null;
  const drone = event.drone.position ? toLatLng(event.drone.position) : null;
  const hit = event.interceptPoint ? toLatLng(event.interceptPoint) : null;
  const reachM = event.interceptor.rangeM ?? event.launcher.rangeM;
  const quiet = { interactive: false } as const;

  if (launcher && reachM) {
    // One colour per system, like the blue layer's range circles on the ops map.
    const reach = cssVar(SYSTEM_TOKEN[systemKind(event.launcher.type)]);
    L.circle(launcher, { ...quiet, radius: reachM, color: reach, weight: 1, opacity: 0.6, fillColor: reach, fillOpacity: 0.07 }).addTo(group);
  }

  if (hit && drone) {
    L.polyline([drone, hit], { ...quiet, color: red, weight: 1.6, dashArray: '5 5' }).addTo(group);
  }

  if (hit && launcher) {
    L.polyline([launcher, hit], { ...quiet, color: blue, weight: 1.6, dashArray: '5 5' }).addTo(group);
    // Mercator is conformal, so the on-screen bearing is the same at every zoom.
    const from = map.project(launcher, 0);
    const to = map.project(hit, 0);
    if (from.distanceTo(to) > 0) {
      const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
      const at: LatLngTuple = [launcher[0] + (hit[0] - launcher[0]) * 0.55, launcher[1] + (hit[1] - launcher[1]) * 0.55];
      L.marker(at, { ...quiet, keyboard: false, icon: arrowIcon(angle) }).addTo(group);
    }
  } else if (launcher && drone) {
    // Not yet intercepted: a faint line pairs the launcher with its target.
    L.polyline([launcher, drone], { ...quiet, color: text, weight: 1.2, opacity: 0.55, dashArray: '3 6' }).addTo(group);
  }

  const marker = (at: LatLngTuple, icon: L.DivIcon, zIndexOffset: number): void => {
    L.marker(at, { ...quiet, keyboard: false, icon, zIndexOffset }).addTo(group);
  };
  if (launcher) marker(launcher, launcherIcon(event.launcher.type, interceptorCode(event)), 100);
  if (drone) marker(drone, droneIcon(droneCode(event)), 200);
  if (hit) marker(hit, interceptPointIcon('נקודת יירוט'), 300);

  return [launcher, drone, hit].filter((point): point is LatLngTuple => point !== null);
}

function MapNotice({ text }: { text: string }): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3">
      <span className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-text-dim">{text}</span>
    </div>
  );
}

export function LoopEventMap({ event }: { event: InterceptionLogEntry | null }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const framedIdRef = useRef<string | null>(null);
  const eventRef = useRef(event);
  eventRef.current = event;
  const key = drawingKey(event);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: ISRAEL_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'bottomleft', zoomInTitle: 'התקרבות', zoomOutTitle: 'התרחקות' }).addTo(map);
    L.tileLayer(TILE_URL, { maxZoom: 18, subdomains: 'abcd', attribution: TILE_ATTRIBUTION }).addTo(map);

    mapRef.current = map;
    groupRef.current = L.layerGroup().addTo(map);

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      groupRef.current = null;
      framedIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = groupRef.current;
    const current = eventRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (!current) return;

    const points = drawEvent(map, group, current);
    // Frame each event once; later redraws of the same event keep the camera.
    if (points.length === 0 || framedIdRef.current === current.id) return;
    const animate = framedIdRef.current !== null;
    framedIdRef.current = current.id;

    if (points.length === 1) {
      map.setView(points[0], 11, { animate });
    } else {
      // Extra room right and below: that is where the marker labels hang.
      map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [48, 40], paddingBottomRight: [88, 64], maxZoom: 12, animate });
    }
  }, [key]);

  const hasPosition = event !== null && (event.launcher.position || event.drone.position || event.interceptPoint) !== null;

  const telemetry: [label: string, value: string, mono: boolean][] = [
    ['שעת שיגור', event ? formatClock(event.launchedAt) : '—', true],
    ['מיירט', event ? interceptorCode(event) : '—', false],
    ['מזהה רחפן', event ? droneCode(event) : '—', false],
    ['מזהה אירוע', event ? eventCode(event) : '—', true],
  ];

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
        <h2 className="text-base font-semibold text-text">מיקום האירוע</h2>
        <span className="truncate text-xs text-text-dim">בחירת שורה תציג את האירוע על המפה</span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" data-testid="loop-event-map" />
        {event === null && <MapNotice text="בחרו אירוע ביומן כדי להציג אותו על המפה" />}
        {event !== null && !hasPosition && <MapNotice text="אין נתוני מיקום לאירוע זה" />}
      </div>

      {/* Four across, except while the map column is at its narrowest (xl up to
          1600px), where the ids would truncate — then two by two. The 1px gap
          over bg-line draws the dividers for either layout. */}
      <dl className="m-3 grid shrink-0 grid-cols-4 gap-px overflow-hidden rounded-md border border-line bg-line xl:grid-cols-2 min-[1600px]:grid-cols-4">
        {telemetry.map(([label, value, mono]) => (
          <div key={label} className="flex min-w-0 flex-col items-center gap-0.5 bg-panel-2 px-2 py-2.5">
            <dt className="order-2 text-xs text-text-dim">{label}</dt>
            <dd className={`order-1 max-w-full truncate text-sm font-semibold tabular-nums text-text ${mono && event ? 'font-mono' : ''}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
