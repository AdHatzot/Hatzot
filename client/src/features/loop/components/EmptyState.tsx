/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 */
interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps): JSX.Element {
  return (
    <div
      data-testid="loop-empty-state"
      className="flex flex-1 flex-col items-center justify-center gap-1 py-16 text-center"
    >
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-xs text-text-dim">{description}</p>}
    </div>
  );
}