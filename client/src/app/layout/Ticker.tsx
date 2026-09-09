/**
 * @team     ops
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-08
 */
export function Ticker(): JSX.Element {
  return (
    <footer
      data-testid="ops-ticker"
      className="flex h-8 shrink-0 items-center gap-4 border-t border-line bg-panel px-4 font-mono text-xs text-text-dim"
    >
      <span>—</span>
    </footer>
  );
}
