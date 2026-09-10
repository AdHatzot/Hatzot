/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-10
 */
import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded px-2 py-1 ${isActive ? "text-text" : "text-text-dim hover:text-text"}`;

const LOGO_URL = `${import.meta.env.BASE_URL}logo-hatzot.svg`;

export function NavBar(): JSX.Element {
  return (
    <nav
      data-testid="core-navbar"
      className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-panel px-4"
    >
      <NavLink to="/" end className="flex shrink-0 items-center" aria-label="חצות — חזרה לחמ״ל">
        <img src={LOGO_URL} alt="חצות — עד חצות" className="h-9 w-auto" draggable={false} />
      </NavLink>
      <span className="border-s border-line ps-4 text-sm font-medium text-text-dim">מרכז שליטה — הגנה אווירית</span>
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
