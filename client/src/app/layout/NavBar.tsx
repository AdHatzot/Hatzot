/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 */
import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded px-2 py-1 ${isActive ? "text-text" : "text-text-dim hover:text-text"}`;

export function NavBar(): JSX.Element {
  return (
    <nav
      data-testid="core-navbar"
      className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-panel px-4"
    >
      <span className="font-mono text-sm text-accent">C2</span>
      <span className="text-sm font-medium">מרכז שליטה — הגנה אווירית</span>
      <div className="mr-auto flex items-center gap-1 text-sm">
        <NavLink to="/" end className={linkClass}>
          חמ״ל
        </NavLink>
        <NavLink to="/logistics" className={linkClass}>
        יצירת פריסה
        </NavLink>
        <NavLink to="/logs" className={linkClass}>
          סגירת מעגל
        </NavLink>
      </div>
    </nav>
  );
}
