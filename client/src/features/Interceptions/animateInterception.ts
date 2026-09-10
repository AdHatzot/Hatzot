/**
 * @team     interceptions
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-10
 */

import L, { type CircleMarker, type LayerGroup, type Polyline } from "leaflet";

// הגדרת הפרמטרים שהפונקציה מקבלת
interface AnimateInterceptionOptions {
  group: LayerGroup;

  start: {
    lat: number;
    lng: number;
  };

  target: {
    lat: number;
    lng: number;
  };

  result: "hit" | "miss";

  durationMs: number;
}

export function animateInterception({
  group,
  start: startCoordinates,
  target: targetCoordinates,
  result,
  durationMs,
}: AnimateInterceptionOptions): () => void {
  const start = L.latLng(startCoordinates.lat, startCoordinates.lng);
  const target = L.latLng(targetCoordinates.lat, targetCoordinates.lng);

  // מיירט
  const interceptor: CircleMarker = L.circleMarker(start, {
    radius: 5,
    color: "#ffffff",
    fillColor: "#ffffff",
    fillOpacity: 1,
    weight: 2,
    interactive: false,
  }).addTo(group);

  // שובלים
  const trailGlow: Polyline = L.polyline([start, start], {
    color: "#ff2d2d",
    weight: 10,
    opacity: 0.25,
    lineCap: "round",
    lineJoin: "round",
    interactive: false,
  }).addTo(group);

  const trail: Polyline = L.polyline([start, start], {
    color: "#ff3b30",
    weight: 5,
    opacity: 0.85,
    lineCap: "round",
    lineJoin: "round",
    interactive: false,
  }).addTo(group);

  const trailCore: Polyline = L.polyline([start, start], {
    color: "#ffffff",
    weight: 2,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round",
    interactive: false,
  }).addTo(group);

  const startedAt = performance.now();

  let animationFrame = 0;
  let finished = false;

  const trailLength = 0.25;

  function cleanup(): void {
    if (finished) return;

    finished = true;

    cancelAnimationFrame(animationFrame);

    function remove(layer: any) {
      if (group.hasLayer(layer)) {
        group.removeLayer(layer);
      }
    }

    remove(interceptor);
    remove(trailGlow);
    remove(trail);
    remove(trailCore);
  }

  function animate(now: number): void {
    if (finished) return;

    const elapsed = now - startedAt;
    const progress = Math.min(elapsed / durationMs, 1);
    const lat = start.lat + (target.lat - start.lat) * progress;
    const lng = start.lng + (target.lng - start.lng) * progress;
    const position = L.latLng(lat, lng);
    interceptor.setLatLng(position);

    const trailStartProgress = Math.max(0, progress - trailLength);

    const trailStart = L.latLng(
      start.lat + (target.lat - start.lat) * trailStartProgress,
      start.lng + (target.lng - start.lng) * trailStartProgress,
    );

    trailGlow.setLatLngs([trailStart, position]);
    trail.setLatLngs([trailStart, position]);
    trailCore.setLatLngs([trailStart, position]);

    const fadeStart = 0.55;

    const fadeProgress =
      progress <= fadeStart ? 0 : (progress - fadeStart) / (1 - fadeStart);

    const fadeOpacity = Math.max(0, 1 - fadeProgress);

    trailGlow.setStyle({
      opacity: 0.25 * fadeOpacity,
    });

    trail.setStyle({
      opacity: 0.85 * fadeOpacity,
    });

    trailCore.setStyle({
      opacity: 0.95 * fadeOpacity,
    });

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);

      return;
    }

    cleanup();

    if (result === "hit") {
      animateHit(group, target);
    }
  }

  animationFrame = requestAnimationFrame(animate);

  return () => {
    cleanup();
  };
}

function animateHit(group: LayerGroup, target: L.LatLng): void {
  const ring = L.circleMarker(target, {
    radius: 6,
    color: "#ff3030",
    fillColor: "transparent",
    fillOpacity: 0,
    opacity: 0.95,
    weight: 6,
    interactive: false,
  }).addTo(group);

  const startedAt = performance.now();

  const duration = 350;

  let animationFrame = 0;

  function animate(now: number): void {
    const progress = Math.min((now - startedAt) / duration, 1);

    ring.setRadius(6 + progress * 25);

    ring.setStyle({
      opacity: 0.95 * (1 - progress),
    });

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);

      return;
    }

    cancelAnimationFrame(animationFrame);

    group.removeLayer(ring);
  }

  animationFrame = requestAnimationFrame(animate);
}
