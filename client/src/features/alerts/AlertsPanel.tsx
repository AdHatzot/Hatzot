/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
import { LOCALITIES } from "@/shared/localities";

export function AlertsPanel(): JSX.Element {
  return (
    <section data-testid="alerts-panel" className="flex h-full flex-col">
      <h2 className="mb-2 text-xs uppercase tracking-wide text-text-dim">
        התראות יישובים
      </h2>

      <div className="rounded border border-line bg-panel-2 p-3 text-sm text-text-dim">
        אין התראות פעילות
      </div>

      <p className="mt-2 font-mono text-[11px] text-text-dim">
        {LOCALITIES.length} יישובים מוגדרים
      </p>
    </section>
  );
}
