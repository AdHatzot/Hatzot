/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 */
import { SYSTEM_ICON_URL, SYSTEM_TOKEN, glyphMarkup, systemKind } from '../systemGlyph';

interface LoopSystemGlyphProps {
  system: string | null;
  size?: number;
}

export function LoopSystemGlyph({ system, size = 18 }: LoopSystemGlyphProps): JSX.Element {
  const kind = systemKind(system);
  const iconUrl = SYSTEM_ICON_URL[kind];
  if (iconUrl) {
    return <img src={iconUrl} width={size} height={size} alt="" draggable={false} className="shrink-0 object-contain" />;
  }
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className="shrink-0"
      style={{ color: `var(${SYSTEM_TOKEN[kind]})` }}
      aria-hidden="true"
      // Static markup from systemGlyph.ts — never user data.
      dangerouslySetInnerHTML={{ __html: glyphMarkup(kind) }}
    />
  );
}
