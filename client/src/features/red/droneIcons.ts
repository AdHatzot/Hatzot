/**
 * @team     red
 * @owner    red-lead
 * @public   no
 * @updated  2026-09-10
 *
 * One marker icon per drone type reported by the external feed. The art is
 * inline rather than a file under public/ so the layer never waits on a network
 * round-trip mid-tick, and `currentColor` lets --team-red drive the fill
 * instead of a pasted hex.
 */
import L from "leaflet";

const SIZE = 28;

const SVG_BY_TYPE: Readonly<Record<string, string>> = {
  "Falcon-Long X4": `<path d="M29 7h6l3 20 21 10v8l-22-4-2 16 8 4v3L32 61 21 64v-3l8-4-2-16-22 4v-8l21-10 3-20Z" fill="currentColor"/>`,

  "NanoSwarm-Q9": `<g stroke="currentColor" stroke-width="4" stroke-linejoin="miter">
      <path d="M32 5 44 17 32 29 20 17 32 5Z"/>
      <path d="M49 22 61 34 49 46 37 34 49 22Z"/>
      <path d="M32 39 44 51 32 63 20 51 32 39Z"/>
      <path d="M15 22 27 34 15 46 3 34 15 22Z"/>
    </g>
    <g fill="currentColor">
      <circle cx="32" cy="17" r="3.5"/>
      <circle cx="49" cy="34" r="3.5"/>
      <circle cx="32" cy="51" r="3.5"/>
      <circle cx="15" cy="34" r="3.5"/>
    </g>`,

  "LoadBee-M2": `<g stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m25 23-8-9M39 23l8-9M25 37l-8 9M39 37l8 9"/>
      <circle cx="13" cy="10" r="8"/>
      <circle cx="51" cy="10" r="8"/>
      <circle cx="13" cy="50" r="8"/>
      <circle cx="51" cy="50" r="8"/>
    </g>
    <rect x="22" y="21" width="20" height="18" rx="4" fill="currentColor"/>
    <path d="M26 39h12v19H26z" fill="currentColor"/>`,

  "SkyMite-C7": `<g stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m25 25-8-8M39 25l8-8M25 39l-8 8M39 39l8 8"/>
      <circle cx="13" cy="13" r="8"/>
      <circle cx="51" cy="13" r="8"/>
      <circle cx="13" cy="51" r="8"/>
      <circle cx="51" cy="51" r="8"/>
    </g>
    <rect x="23" y="23" width="18" height="18" rx="4" fill="currentColor"/>`,
};

/** The feed is external — a type we have no art for still has to draw. */
const FALLBACK_SVG = `<circle cx="32" cy="32" r="14" fill="currentColor"/>`;

const iconCache = new Map<string, L.DivIcon>();

/** Shared across every marker of a type — Leaflet clones the DOM per marker. */
export function droneIcon(type: string): L.DivIcon {
  const cached = iconCache.get(type);
  if (cached) return cached;

  const body = SVG_BY_TYPE[type] ?? FALLBACK_SVG;
  const icon = L.divIcon({
    className: "red-drone-marker",
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" aria-hidden="true" style="width:${SIZE}px;height:${SIZE}px;display:block;color:var(--team-red)">${body}</svg>`,
  });

  iconCache.set(type, icon);
  return icon;
}
