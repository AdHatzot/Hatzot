import type { TeamMapLayer } from "@/shared/contracts";
import { mountInterceptionLayer } from "./InterceptionLayer"

export const interceptionLayer: TeamMapLayer = {
  id: "loop",
  label: "יירוטים",
  colour: "#ffffff",
  defaultVisible: true,
  mount: mountInterceptionLayer,
};