/**
 * @team     alerts
 * @owner    alerts-lead
 * @public   no
 * @updated  2026-09-10
 *
 * Local replacement for the `Crosshair` icon from `lucide-react` — that
 * package was never installed (see CLAUDE.md: no new dependency without a
 * lead's sign-off). Same visual shape, zero dependency.
 */
export function CrosshairIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}
