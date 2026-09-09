/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-08
 *
 * Design tokens for code that cannot use CSS. Leaflet writes colours into SVG
 * presentation attributes, where `var(--x)` does not resolve reliably — so
 * canvas/SVG code resolves the token to a value here rather than hardcoding a
 * hex (see "Nobody hardcodes a hex" in CLAUDE.md).
 */

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
