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
      className="relative flex h-12 shrink-0 items-center justify-between border-b border-line bg-[#0a0f14] px-4 text-xs select-none"
    >
      {/* Right side in RTL: Status Indicators & Menu */}
      <div className="flex items-center gap-4 text-text-dim">
        <button className="text-text-dim hover:text-text" aria-label="תפריט">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-text-dim" />
          <span>שידור חי</span>
        </div>

        <div className="flex items-center gap-1.5 text-text">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-text">מערכות תקינות</span>
        </div>
      </div>

      {/* Center: Brand Title */}
      <div className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-widest text-white">
        חצות
      </div>

      {/* Left side in RTL: Logo & Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-medium text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 22 20 2 20" />
            <circle cx="12" cy="13" r="2" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold">מרכז פיקוד טקטי</span>
        </div>

        <div className="ms-3 flex items-center gap-1 border-s border-line ps-3">
          <NavLink to="/" end className={linkClass}>
            חמ״ל
          </NavLink>
          <NavLink to="/logistics" className={linkClass}>
            ניהול אמל״ח
          </NavLink>
          <NavLink to="/logs" className={linkClass}>
            תחקור אירועים
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
