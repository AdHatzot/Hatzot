/**
 * @team     ops
 * @owner    ops-lead
 * @public   yes
 * @updated  2026-09-08
 *
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Map as LeafletMap } from "leaflet";

interface MapContextValue {
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const value = useMemo(() => ({ map, setMap }), [map]);
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap(): LeafletMap | null {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used inside <MapProvider>.");
  return ctx.map;
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used inside <MapProvider>.");
  return ctx;
}
