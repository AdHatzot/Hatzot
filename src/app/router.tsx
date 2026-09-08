/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/layout/AppShell";
import { OpsPage } from "@/pages/OpsPage";
import { LogisticsPage } from "@/pages/LogisticsPage";
import { LogsPage } from "@/pages/LogsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <OpsPage /> },
      { path: "logistics", element: <LogisticsPage /> },
      { path: "logs", element: <LogsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
