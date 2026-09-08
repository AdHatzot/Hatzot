/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 */
import type { Team } from '@/types/events';
import type { TeamLayerState } from '../useTeamLayers';

export function LayersPanel({
  open,
  layers,
  onToggle,
}: {
  open: boolean;
  layers: readonly TeamLayerState[];
  onToggle: (id: Team) => void;
}): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      data-testid="ops-layers-panel"
      className="absolute right-3 top-12 z-[1000] w-64 rounded border border-line bg-panel/95 p-3 text-sm"
    >
      <div className="mb-2 text-xs uppercase tracking-wide text-text-dim">שכבות מפה</div>
      {layers.length === 0 ? (
        <div className="text-text-dim">אין שכבות רשומות</div>
      ) : (
        <ul className="space-y-1">
          {layers.map((layer) => (
            <li key={layer.id}>
              <label className="flex cursor-pointer items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  data-testid={`ops-layer-${layer.id}`}
                  checked={layer.visible}
                  onChange={() => onToggle(layer.id)}
                  className="accent-current"
                  style={{ color: layer.colour }}
                />
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: layer.colour }}
                />
                <span>{layer.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
