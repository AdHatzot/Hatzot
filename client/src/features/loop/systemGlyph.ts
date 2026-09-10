/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * One glyph per air-defence system, drawn in a 20×20 box in `currentColor`.
 * Kept as markup so the table (React) and the map (Leaflet divIcon) share a
 * single drawing. Fills use `style`, not the `fill` attribute — var() does
 * not resolve reliably in SVG presentation attributes.
 */
export type SystemKind = 'shieldnest' | 'ironhook' | 'horizoneye' | 'cloudfence' | 'unknown';

export const SYSTEM_TOKEN: Readonly<Record<SystemKind, string>> = {
  shieldnest: '--team-blue',
  ironhook: '--team-alerts',
  horizoneye: '--team-logistics',
  cloudfence: '--team-loop',
  unknown: '--text-dim',
};

/**
 * The blue team's launcher icons (client/public/icons) — the same files their
 * layer draws on the ops map, so a system looks identical on both screens.
 * The drawn glyphs below stay as the fallback for a system without an icon.
 */
export const SYSTEM_ICON_URL: Readonly<Record<SystemKind, string | null>> = {
  shieldnest: `${import.meta.env.BASE_URL}icons/blue-marker.svg`,
  ironhook: `${import.meta.env.BASE_URL}icons/IronHook-SR.svg`,
  horizoneye: `${import.meta.env.BASE_URL}icons/HorizonEye-MX.svg`,
  cloudfence: `${import.meta.env.BASE_URL}icons/CloudFence-Area.svg`,
  unknown: null,
};

const OUTLINE = 'style="fill:var(--bg)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"';

const GLYPHS: Readonly<Record<SystemKind, string>> = {
  shieldnest:
    `<path d="M10 1.8 18.2 10 10 18.2 1.8 10Z" ${OUTLINE}/>` +
    '<path d="M10 6.4 13.6 10 10 13.6 6.4 10Z" fill="currentColor"/>',
  ironhook:
    '<path d="M3.6 10.4 10 4.6l6.4 5.8M3.6 16.2 10 10.4l6.4 5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  horizoneye:
    `<path d="M10 2.4 18.2 17H1.8Z" ${OUTLINE}/>` +
    '<path d="M10 8.8 13 14H7Z" fill="currentColor"/>',
  cloudfence:
    `<path d="M10 1.8 17.2 5.9v8.2L10 18.2l-7.2-4.1V5.9Z" ${OUTLINE}/>` +
    '<path d="M10 6.9 12.7 8.45v3.1L10 13.1l-2.7-1.55v-3.1Z" fill="currentColor"/>',
  unknown:
    '<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2.4"/>' +
    '<circle cx="10" cy="10" r="2.2" fill="currentColor"/>',
};

/** Matches the launcher_type names in the DDL: "ShieldNest-Lite", "IronHook-SR", … */
export function systemKind(name: string | null): SystemKind {
  const key = (name ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (key.startsWith('shieldnest')) return 'shieldnest';
  if (key.startsWith('ironhook')) return 'ironhook';
  if (key.startsWith('horizoneye')) return 'horizoneye';
  if (key.startsWith('cloudfence')) return 'cloudfence';
  return 'unknown';
}

/** Inner SVG markup for a `viewBox="0 0 20 20"` element. Static — no user input. */
export function glyphMarkup(kind: SystemKind): string {
  return GLYPHS[kind];
}
