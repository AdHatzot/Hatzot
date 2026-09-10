/**
 * @team     ops
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-08
 */
import { RouterProvider } from "react-router-dom";
import { MapProvider } from "@/map/MapContext";
import { router } from "@/app/router";
import { DronesProvider } from "@/features/red";

export function App(): JSX.Element {
  return (
    <DronesProvider>
      <MapProvider>
        <RouterProvider router={router} />
      </MapProvider>
    </DronesProvider>
  );
}
