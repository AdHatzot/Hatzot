/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-08
 *
 * FROZEN. The seam between a feature team and the shell.
 * Changing a signature here breaks every team at once — needs all leads.
 */
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import type { Team } from '@/types/events';

export interface TeamMapLayer {
  id: Team;
  label: string;
  colour: string;
  defaultVisible: boolean;
  mount: (group: LayerGroup, map: LeafletMap) => void;
}
