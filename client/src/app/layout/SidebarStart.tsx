/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 */
import { AlertsPanel } from "@/features/alerts";

export function SidebarStart(): JSX.Element {
  return (
    <aside
      data-testid="ops-sidebar-start"
      className="w-96 shrink-0 overflow-y-auto border-e border-line bg-panel p-3 text-sm"
    >
      <AlertsPanel />
    </aside>
  );
}
