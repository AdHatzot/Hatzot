# context.md

Current build brief. `CLAUDE.md` is the persistent contract; this file changes per iteration.

---

## Now

**Skeleton, five teams, nothing implemented.** The shell runs, three routes
work, and every team has a wired mount point in a folder nobody else opens.

What exists:

- **חמ״ל (`/`)** — the persistent Leaflet map over Israel. Pan, zoom, bounds
  clamped to the country. Two toggleable layers in the layers panel:
  `צד אדום` and `צד כחול`, each holding **one placeholder dot** near the centre
  purely to prove the layer is live.
- **Alerts side panel** — empty, on the start (right) side. Reads nothing but
  the locality count.
- **לוגיסטיקה (`/logistics`)** — empty page.
- **סגירת מעגל (`/logs`)** — empty page.
- **`@/shared/localities`** — 118 Israeli localities with coordinates, keyed by
  a stable id, plus `localitiesWithin(point, km)`.

Everything below those mount points is **intentionally empty**: no entities, no
feed, no alert rows, no tables. A placeholder comment is the correct output —
not a plausible implementation.

## Each team's first edit

| Team        | Start here                             |
| ----------- | -------------------------------------- |
| `red`       | `client/src/features/red/RedLayer.ts`         |
| `blue`      | `client/src/features/blue/BlueLayer.ts`       |
| `alerts`    | `client/src/features/alerts/AlertsPanel.tsx`  |
| `logistics` | `client/src/features/logistics/LogisticsView.tsx` |
| `loop`      | `client/src/features/loop/LogsView.tsx`       |

Delete the placeholder dot in your layer as soon as you have something real.

## Next (not now)

- Data sources (backend / WebSocket) — arrive later, out of this repo for now.
- The full CBS locality registry, replacing the ~118-row seed list in
  `@/shared/localities`. Only that array changes; the shape is the contract.
- Closed-network swap: locally-served raster basemap tiles (no RTL text plugin needed).
