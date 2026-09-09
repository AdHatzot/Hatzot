/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-08
 *
 */
export function LogsView(): JSX.Element {
  return (
    <div
      data-testid="loop-page"
      className="absolute inset-0 overflow-auto bg-bg p-6"
    >
      <h1 className="mb-3 text-lg font-medium">סגירת מעגל</h1>
      <p className="text-sm text-text-dim">
        לוג תהליך היירוט — אלגוריתם בחירת המיירט, שלבי הביניים ותוצאה.
      </p>
    </div>
  );
}
