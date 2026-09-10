/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Leaflet divIcons for the event map: threat, launcher, intercept point and
 * the heading arrow on the interceptor's path. Colours are CSS variables in
 * `style`, where they resolve.
 */
import L from 'leaflet';
import { SYSTEM_ICON_URL, SYSTEM_TOKEN, glyphMarkup, systemKind } from './systemGlyph';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

// Map labels sit straight on the tiles, so they get a halo in the background
// colour to stay legible over roads and coastlines.
const LABEL_STYLE = [
  'position:absolute',
  'white-space:nowrap',
  'font:500 12px/1.2 Heebo,system-ui,sans-serif',
  'color:var(--text)',
  'text-shadow:0 0 2px var(--bg),0 0 4px var(--bg),0 0 8px var(--bg)',
  'pointer-events:none',
].join(';');

// Units are labelled underneath; the intercept point to its right, so the two
// labels cannot collide when the intercept happens on top of the drone.
const LABEL_PLACEMENT = {
  below: 'top:calc(100% + 4px);left:50%;transform:translateX(-50%)',
  beside: 'top:50%;left:calc(100% + 4px);transform:translateY(-50%)',
} as const;

function labelledIcon(
  size: number,
  colourToken: string,
  svg: string,
  label: string,
  placement: keyof typeof LABEL_PLACEMENT = 'below',
): L.DivIcon {
  return L.divIcon({
    className: 'loop-map-marker',
    html:
      `<div style="position:relative;width:${size}px;height:${size}px;color:var(${colourToken})">` +
      `${svg}<span style="${LABEL_STYLE};${LABEL_PLACEMENT[placement]}">${escapeHtml(label)}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function droneIcon(label: string): L.DivIcon {
  const rotor = (cx: number, cy: number): string =>
    `<circle cx="${cx}" cy="${cy}" r="3.4" style="fill:var(--bg);fill-opacity:.6" stroke="currentColor" stroke-width="1.8"/>`;
  const svg =
    '<svg viewBox="0 0 24 24" width="26" height="26" style="display:block;overflow:visible" aria-hidden="true">' +
    '<path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    rotor(5.2, 5.2) + rotor(18.8, 5.2) + rotor(5.2, 18.8) + rotor(18.8, 18.8) +
    '<rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1.2" fill="currentColor"/></svg>';
  return labelledIcon(26, '--team-red', svg, label);
}

export function launcherIcon(system: string | null, label: string): L.DivIcon {
  const kind = systemKind(system);
  const iconUrl = SYSTEM_ICON_URL[kind];
  const symbol = iconUrl
    ? `<img src="${iconUrl}" width="24" height="24" alt="" draggable="false" style="display:block">`
    : `<svg viewBox="0 0 20 20" width="24" height="24" style="display:block" aria-hidden="true">${glyphMarkup(kind)}</svg>`;
  return labelledIcon(24, SYSTEM_TOKEN[kind], symbol, label);
}

export function interceptPointIcon(label: string): L.DivIcon {
  const svg =
    '<svg viewBox="0 0 24 24" width="26" height="26" style="display:block" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<circle cx="12" cy="12" r="1.9" fill="currentColor"/></svg>';
  return labelledIcon(26, '--text', svg, label, 'beside');
}

/** A small arrowhead pointing along `angleDeg` (screen degrees, 0 = east, clockwise). */
export function arrowIcon(angleDeg: number): L.DivIcon {
  return L.divIcon({
    className: 'loop-map-marker',
    html:
      `<svg viewBox="0 0 10 10" width="11" height="11" style="display:block;color:var(--team-blue);transform:rotate(${angleDeg.toFixed(1)}deg)" aria-hidden="true">` +
      '<path d="M1 1.2 9 5 1 8.8 3.2 5Z" fill="currentColor"/></svg>',
    iconSize: [11, 11],
    iconAnchor: [5.5, 5.5],
  });
}
