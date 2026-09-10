import { Drone } from "@/types";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface DronesContextValue {
  drones: Drone[] | null;
  setDrones: (map: Drone[] | null) => void;
}

const DronesContext = createContext<DronesContextValue | null>(null);

export function DronesProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [drones, setDrones] = useState<Drone[] | null>(null);
  const value = useMemo(() => ({ drones, setDrones }), [drones]);
  return (
    <DronesContext.Provider value={value}>{children}</DronesContext.Provider>
  );
}

export function useDronesContext(): DronesContextValue {
  const ctx = useContext(DronesContext);
  if (!ctx) throw new Error("useDronesContext must be used inside <DronesProvider>.");
  return ctx;
}
