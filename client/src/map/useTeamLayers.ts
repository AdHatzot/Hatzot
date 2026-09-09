/**
 * @team     core
 * @owner    core
 * @public   no
 * @updated  2026-09-08
 *
 * Owns the lifecycle of every team layer: one LayerGroup per team, mounted
 * once, shown or hidden by the layers panel. A team's `mount` never sees the
 * toggle — it just fills its group.
 */
import { useEffect, useRef, useState } from 'react';
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet';
import type { Team } from '@/types/events';
import { TEAM_LAYERS } from './layerRegistry';

export interface TeamLayerState {
  id: Team;
  label: string;
  colour: string;
  visible: boolean;
}

export interface UseTeamLayers {
  layers: readonly TeamLayerState[];
  toggle: (id: Team) => void;
}

export function useTeamLayers(map: LeafletMap | null): UseTeamLayers {
  const groups = useRef(new Map<Team, LayerGroup>());
  const mounted = useRef(false);
  const [layers, setLayers] = useState<readonly TeamLayerState[]>(() =>
    TEAM_LAYERS.map((l) => ({
      id: l.id,
      label: l.label,
      colour: l.colour,
      visible: l.defaultVisible,
    })),
  );

  useEffect(() => {
    if (!map || mounted.current) return;
    mounted.current = true;
    for (const layer of TEAM_LAYERS) {
      const group = L.layerGroup();
      groups.current.set(layer.id, group);
      layer.mount(group, map);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    for (const layer of layers) {
      const group = groups.current.get(layer.id);
      if (!group) continue;
      if (layer.visible && !map.hasLayer(group)) group.addTo(map);
      else if (!layer.visible && map.hasLayer(group)) group.removeFrom(map);
    }
  }, [map, layers]);

  const toggle = (id: Team): void => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };

  return { layers, toggle };
}
