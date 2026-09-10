/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * One interceptor's flight, written straight onto the Leaflet layer inside
 * requestAnimationFrame (hard rule 5 — nothing per frame goes through React):
 *
 *   launch  a muzzle flash at the launcher
 *   flight  a white-hot missile with an amber exhaust boosts along a shallow
 *           arc, leaving a spreading smoke trail, while a lock-on reticle
 *           tightens on the target
 *   impact  HIT:  sharp flash, white-hot core, fireball, shockwaves, debris
 *           MISS: the missile overshoots, burns out, and the lock drops
 *
 * Warm and light colours keep the missile readable over the blue alert
 * polygons and the red drones. Every shape is a circleMarker or polyline on
 * one shared canvas renderer, so sizes are screen pixels (the same at any
 * zoom) and "יירט הכל" with dozens of flights at once stays smooth.
 */
import L, { type CircleMarker, type LayerGroup, type Map as LeafletMap } from "leaflet";
import { cssVar } from "@/shared/theme";

interface AnimateInterceptionOptions {
  group: LayerGroup;
  /** Lets debris fly a fixed number of screen pixels; without it debris is skipped. */
  map?: LeafletMap;
  start: { lat: number; lng: number };
  target: { lat: number; lng: number };
  result: "hit" | "miss";
  /** Launch to arrival at the target — the backend settles the result at this moment. */
  durationMs: number;
}

type Point = { lat: number; lng: number };

const LAUNCH_MS = 260;
const IMPACT_MS = 950;
/** How far the arc bows sideways, as a fraction of the launcher→target distance. */
const ARC_BEND = 0.16;
/** Share of the path the exhaust trail covers behind the head. */
const TRAIL_SPAN = 0.24;
/** A miss keeps flying this share of the path beyond the target before burning out. */
const OVERSHOOT = 0.22;
const SMOKE_EVERY_MS = 55;
const SMOKE_LIFE_MS = 950;
const DEBRIS_COUNT = 10;

/**
 * Map pane the flights draw into. It sits above the drone markers (Leaflet's
 * markerPane is 600), so an impact is not hidden under the drone's own icon;
 * InterceptionLayer creates it.
 */
export const INTERCEPTIONS_PANE = "interceptions";

const renderer = L.canvas({ padding: 0.5, pane: INTERCEPTIONS_PANE });
const quiet = { interactive: false, renderer } as const;

// Flights running now — smoke thins out when many fly at once.
let activeFlights = 0;

const clamp01 = (t: number): number => Math.min(Math.max(t, 0), 1);
const easeOut = (t: number): number => 1 - (1 - clamp01(t)) ** 3;
/** Slow off the rail, accelerating into the target. */
const boost = (t: number): number => clamp01(t) ** 1.6;

function pathPoint(from: Point, bend: Point, to: Point, t: number): Point {
  if (t <= 1) {
    const u = 1 - t;
    return {
      lat: u * u * from.lat + 2 * u * t * bend.lat + t * t * to.lat,
      lng: u * u * from.lng + 2 * u * t * bend.lng + t * t * to.lng,
    };
  }
  // Past the target: carry on along the arc's final heading.
  const k = 2 * (t - 1);
  return { lat: to.lat + (to.lat - bend.lat) * k, lng: to.lng + (to.lng - bend.lng) * k };
}

export function animateInterception({
  group,
  map,
  start,
  target,
  result,
  durationMs,
}: AnimateInterceptionOptions): () => void {
  const colour = {
    hot: cssVar("--text"),
    exhaust: cssVar("--team-alerts"),
    smoke: cssVar("--text"),
    lock: cssVar("--team-red"),
    fire: cssVar("--team-alerts"),
    ash: cssVar("--text-dim"),
  };
  const hit = result === "hit";
  const bend: Point = {
    lat: (start.lat + target.lat) / 2 - (target.lng - start.lng) * ARC_BEND,
    lng: (start.lng + target.lng) / 2 + (target.lat - start.lat) * ARC_BEND,
  };
  const pathEnd = hit ? 1 : 1 + OVERSHOOT;

  const layers = new Set<L.Layer>();
  const add = <T extends L.Layer>(layer: T): T => {
    layer.addTo(group);
    layers.add(layer);
    return layer;
  };
  const drop = (layer: L.Layer): void => {
    if (group.hasLayer(layer)) group.removeLayer(layer);
    layers.delete(layer);
  };

  const muzzle = add(L.circleMarker(start, { ...quiet, radius: 3, color: colour.exhaust, weight: 2, fillColor: colour.hot, fillOpacity: 1 }));
  const lock = add(L.circleMarker(target, { ...quiet, radius: 24, color: colour.lock, weight: 1.5, dashArray: "5 4", fill: false, opacity: 0 }));
  const lockDot = add(L.circleMarker(target, { ...quiet, radius: 2, stroke: false, fillColor: colour.lock, fillOpacity: 0 }));
  const trailGlow = add(L.polyline([start, start], { ...quiet, color: colour.exhaust, weight: 7, opacity: 0.35, lineCap: "round", lineJoin: "round" }));
  const trailCore = add(L.polyline([start, start], { ...quiet, color: colour.hot, weight: 2, opacity: 0.9, lineCap: "round", lineJoin: "round" }));
  const headGlow = add(L.circleMarker(start, { ...quiet, radius: 6, stroke: false, fillColor: colour.exhaust, fillOpacity: 0.55 }));
  const head = add(L.circleMarker(start, { ...quiet, radius: 2.5, stroke: false, fillColor: colour.hot, fillOpacity: 1 }));
  const flightLayers = [trailGlow, trailCore, headGlow, head];

  const smoke: { puff: CircleMarker; bornAt: number }[] = [];
  let lastSmokeAt = 0;

  // Impact effects, created when the flight ends.
  let flash: CircleMarker | null = null;
  let core: CircleMarker | null = null;
  let fireball: CircleMarker | null = null;
  let shockwave: CircleMarker | null = null;
  let echo: CircleMarker | null = null;
  let fizzle: CircleMarker | null = null;
  const debris: { piece: CircleMarker; dx: number; dy: number }[] = [];

  const startedAt = performance.now();
  let impactAt: number | null = null;
  let frame = 0;
  let finished = false;
  activeFlights++;

  function finish(): void {
    if (finished) return;
    finished = true;
    activeFlights--;
    cancelAnimationFrame(frame);
    for (const layer of [...layers]) drop(layer);
  }

  function explode(at: Point): void {
    fireball = add(L.circleMarker(at, { ...quiet, radius: 5, stroke: false, fillColor: colour.fire, fillOpacity: 0.85 }));
    core = add(L.circleMarker(at, { ...quiet, radius: 4, stroke: false, fillColor: colour.hot, fillOpacity: 1 }));
    flash = add(L.circleMarker(at, { ...quiet, radius: 5, color: colour.hot, weight: 2, fillColor: colour.hot, fillOpacity: 0.9 }));
    shockwave = add(L.circleMarker(at, { ...quiet, radius: 8, color: colour.exhaust, weight: 2.5, fill: false, opacity: 0.85 }));
    echo = add(L.circleMarker(at, { ...quiet, radius: 8, color: colour.hot, weight: 1.5, fill: false, opacity: 0 }));
    if (map) {
      for (let i = 0; i < DEBRIS_COUNT; i++) {
        const angle = (i / DEBRIS_COUNT) * Math.PI * 2 + Math.random() * 0.5;
        const reach = 16 + Math.random() * 16;
        debris.push({
          piece: add(L.circleMarker(at, { ...quiet, radius: 1.8, stroke: false, fillColor: i % 3 === 0 ? colour.hot : colour.fire, fillOpacity: 1 })),
          dx: Math.cos(angle) * reach,
          dy: Math.sin(angle) * reach,
        });
      }
    }
  }

  function step(now: number): void {
    // A rAF timestamp can predate startedAt by up to a frame — never let time run negative.
    const elapsed = Math.max(0, now - startedAt);

    // Launch flash.
    if (layers.has(muzzle)) {
      const p = clamp01(elapsed / LAUNCH_MS);
      if (p >= 1) {
        drop(muzzle);
      } else {
        muzzle.setRadius(3 + 11 * easeOut(p));
        muzzle.setStyle({ opacity: 1 - p, fillOpacity: 1 - p });
      }
    }

    // Flight.
    const flightP = clamp01(elapsed / durationMs);
    if (impactAt === null) {
      const along = pathEnd * boost(flightP);
      const headAt = pathPoint(start, bend, target, along);
      const tailFrom = Math.max(0, along - TRAIL_SPAN);
      const trail = [0, 0.2, 0.4, 0.6, 0.8, 1].map((k) => pathPoint(start, bend, target, tailFrom + (along - tailFrom) * k));
      // A miss burns out on its way past the target.
      const burn = !hit && along > 1 ? clamp01((along - 1) / OVERSHOOT) : 0;
      const flicker = 0.85 + 0.15 * Math.sin(now / 35);

      head.setLatLng(headAt);
      headGlow.setLatLng(headAt);
      headGlow.setRadius(5 + 1.5 * flicker);
      trailGlow.setLatLngs(trail);
      trailCore.setLatLngs(trail.slice(2));
      head.setStyle({ fillOpacity: 1 - burn });
      headGlow.setStyle({ fillOpacity: 0.55 * flicker * (1 - burn) });
      trailGlow.setStyle({ opacity: 0.35 * (1 - burn) });
      trailCore.setStyle({ opacity: 0.9 * (1 - burn) });

      const smokeEvery = SMOKE_EVERY_MS * Math.max(1, activeFlights / 10);
      if (burn < 1 && now - lastSmokeAt > smokeEvery) {
        lastSmokeAt = now;
        smoke.push({ puff: add(L.circleMarker(trail[1], { ...quiet, radius: 2, stroke: false, fillColor: colour.smoke, fillOpacity: 0.28 })), bornAt: now });
      }

      // The lock tightens and firms up as the missile closes in.
      lock.setRadius(24 - 12 * flightP + 1.5 * Math.sin(now / 80));
      lock.setStyle({ opacity: 0.3 + 0.6 * flightP });
      lockDot.setStyle({ fillOpacity: 0.4 + 0.6 * Math.abs(Math.sin(now / 120)) });

      if (flightP >= 1) {
        impactAt = now;
        for (const layer of flightLayers) drop(layer);
        if (hit) {
          drop(lock);
          drop(lockDot);
          explode(target);
        } else {
          fizzle = add(L.circleMarker(headAt, { ...quiet, radius: 3, stroke: false, fillColor: colour.ash, fillOpacity: 0.6 }));
        }
      }
    }

    // Smoke spreads and thins out.
    for (let i = smoke.length - 1; i >= 0; i--) {
      const age = (now - smoke[i].bornAt) / SMOKE_LIFE_MS;
      if (age >= 1) {
        drop(smoke[i].puff);
        smoke.splice(i, 1);
      } else {
        smoke[i].puff.setRadius(2 + 7 * easeOut(age));
        smoke[i].puff.setStyle({ fillOpacity: 0.28 * (1 - clamp01(age)) });
      }
    }

    // Impact.
    if (impactAt !== null) {
      const since = Math.max(0, now - impactAt);
      const p = clamp01(since / IMPACT_MS);

      if (hit) {
        const flashP = clamp01(since / 120);
        flash?.setRadius(5 + 9 * easeOut(flashP));
        flash?.setStyle({ opacity: 1 - flashP, fillOpacity: 0.9 * (1 - flashP) });
        const coreP = clamp01(since / 320);
        core?.setRadius(4 + 5 * easeOut(coreP));
        core?.setStyle({ fillOpacity: 1 - coreP });
        const fireP = clamp01(since / 680);
        fireball?.setRadius(5 + 10 * easeOut(fireP));
        fireball?.setStyle({ fillOpacity: 0.85 * (1 - fireP) ** 1.4 });
        const shockP = clamp01(since / 700);
        shockwave?.setRadius(8 + 28 * easeOut(shockP));
        shockwave?.setStyle({ opacity: 0.85 * (1 - shockP), weight: 2.5 - 2 * shockP });
        const echoP = clamp01((since - 120) / 650);
        echo?.setRadius(8 + 20 * easeOut(echoP));
        echo?.setStyle({ opacity: echoP > 0 ? 0.5 * (1 - echoP) : 0 });
        if (map) {
          const origin = map.latLngToContainerPoint(target);
          const debrisP = clamp01(since / 850);
          const travel = easeOut(debrisP);
          for (const { piece, dx, dy } of debris) {
            piece.setLatLng(map.containerPointToLatLng([origin.x + dx * travel, origin.y + dy * travel + 8 * debrisP * debrisP]));
            piece.setRadius(1.8 - 0.9 * debrisP);
            piece.setStyle({ fillOpacity: 1 - debrisP });
          }
        }
      } else {
        const fadeP = clamp01(since / 450);
        fizzle?.setRadius(3 + 8 * easeOut(fadeP));
        fizzle?.setStyle({ fillOpacity: 0.6 * (1 - fadeP) });
        lock.setRadius(12 + 10 * easeOut(fadeP));
        lock.setStyle({ opacity: 0.9 * (1 - fadeP) });
        lockDot.setStyle({ fillOpacity: 1 - fadeP });
      }

      if (p >= 1 && smoke.length === 0) {
        finish();
        return;
      }
    }

    frame = requestAnimationFrame(tick);
  }

  // One bad frame must never leave a half-drawn flight stuck on the map.
  function tick(now: number): void {
    if (finished) return;
    try {
      step(now);
    } catch (error) {
      console.error("Interception animation stopped", error);
      finish();
    }
  }

  frame = requestAnimationFrame(tick);
  return finish;
}
