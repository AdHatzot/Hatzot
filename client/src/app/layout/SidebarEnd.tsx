/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 */
export function SidebarEnd(): JSX.Element {
    return (
        <aside
            data-testid="ops-sidebar-end"
            className="w-72 shrink-0 overflow-y-auto border-s border-line bg-panel p-3 text-sm"
        >
            <h2 className="mb-2 flex items-center gap-1 text-xs uppercase tracking-wide text-text-dim">
                <svg
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-team-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m0 3.75h.008M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    />
                </svg>
                ישובים בהתראה
            </h2>
        </aside>
    );
}
