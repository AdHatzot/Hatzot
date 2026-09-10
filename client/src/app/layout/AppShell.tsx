/**
 * @team     ops
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-08
 */
import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './NavBar';
import { SidebarStart } from './SidebarStart';
import { SidebarEnd } from './SidebarEnd';
import { Ticker } from './Ticker';
import { MapShell } from '@/map/MapShell';

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const isOps = pathname === '/';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg text-text">
      <NavBar />
      <div className="flex min-h-0 flex-1">
        {isOps && <SidebarStart />}
        <main className="relative min-w-0 flex-1">
          <MapShell visible={isOps} />
          <Outlet />
        </main>
        {isOps && <SidebarEnd />}
      </div>
      {isOps && <Ticker />}
    </div>
  );
}
