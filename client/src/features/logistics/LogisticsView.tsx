/**
 * @team     logistics
 * @owner    logistics-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
export function LogisticsView(): JSX.Element {
  return (
    <div
      data-testid="logistics-page"
      className="absolute inset-0 overflow-auto bg-bg p-6"
    >
      <h1 className="mb-3 text-lg font-medium">יצירת פריסה</h1>
      <p className="text-sm text-text-dim">מלאי, חימוש וזמינות כלים.</p>
    </div>
  );
}
