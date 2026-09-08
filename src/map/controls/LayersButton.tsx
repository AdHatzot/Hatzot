/**
 * @team     ops
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-08
 */
export function LayersButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      data-testid="ops-layers-btn"
      onClick={onToggle}
      aria-expanded={open}
      aria-label="שכבות"
      className="absolute right-3 top-3 z-[1000] rounded border border-line bg-panel/90 p-2 text-text hover:border-line-hot"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <line x1="3" y1="5" x2="15" y2="5" />
        <line x1="3" y1="9" x2="15" y2="9" />
        <line x1="3" y1="13" x2="15" y2="13" />
      </svg>
    </button>
  );
}
