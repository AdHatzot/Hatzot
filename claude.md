# CLAUDE.md

Air-defence C2 dashboard — **frontend only**. Shared repo, five feature teams, one product.
This file is the persistent contract. `context.md` holds the current build brief.

No backend, no database, no WebSocket in this repo yet. Data sources arrive later.

---

## Stack

| Layer           | Choice                       | Notes                                                   |
| --------------- | ---------------------------- | ------------------------------------------------------- |
| Build           | Vite + React 18 + TypeScript | **Not** Next.js. No SSR — this is a real-time dashboard |
| Map             | Leaflet                      | raw `leaflet`, no `react-leaflet` wrapper               |
| State           | Zustand                      | one store per feature. Never Context for hot data       |
| Routing         | react-router-dom v6          | three routes                                            |
| Styling         | Tailwind CSS                 | dark, RTL                                               |
| Package manager | pnpm                         | single app, no workspace                                |

Nothing gets added to this list without a lead's sign-off.

---

## Teams

| Team           | Code        | Owns                                                    | Colour |
| -------------- | ----------- | ------------------------------------------------------- | ------ |
| צד אדום        | `red`       | enemy targets on the map                                | red    |
| צד כחול        | `blue`      | our interceptors and assets on the map                  | blue   |
| התראות         | `alerts`    | the locality-alert side panel                           | amber  |
| לוגיסטיקה      | `logistics` | the `/logistics` page                                   | green  |
| סגירת מעגל     | `loop`      | the `/logs` page — interception trace, selection, result | violet |

`core` is not a team — it is the shell (chrome, map, router, shared data).
Change it only with a lead's agreement; the five teams never need to.

| Thing     | Format                     | Example                        |
| --------- | -------------------------- | ------------------------------ |
| Component | `<Team><Thing>`            | `RedDroneMarker`               |
| Map layer | `<Team>Layer`              | `RedLayer`                     |
| Hook      | `use<Team><Thing>`         | `useRedTargets`                |
| Store     | `use<Team>Store`           | `useRedStore`                  |
| Event     | `<team>:<entity>.<action>` | `red:target.updated`           |
| Test id   | `<team>-<thing>`           | `alerts-panel`                 |
| Branch    | `feat/<team>/<desc>`       | `feat/red/heading-vector`      |
| Commit    | `<type>(<team>): ...`      | `feat(red): add vector tail`   |

---

## Who owns which files

The point of this layout: **each team has files nobody else opens.** Two teams
working the same sprint should never touch the same file.

| Path                        | Owner       |
| --------------------------- | ----------- |
| `src/features/red/**`       | `red`       |
| `src/features/blue/**`      | `blue`      |
| `src/features/alerts/**`    | `alerts`    |
| `src/features/logistics/**` | `logistics` |
| `src/features/loop/**`      | `loop`      |
| `src/app/**`, `src/map/**`  | core        |
| `src/pages/**`              | core        |
| `src/shared/**`             | core        |
| `src/types/events.ts`       | all leads   |

Everything a team needs is already wired. Building out your feature means
editing **only your own folder**.

The three shared seams — each already populated, so they change rarely:

- `src/map/layerRegistry.ts` — one line per team map layer
- `src/app/router.tsx` — one line per team page
- `src/app/layout/Sidebar*.tsx` — one line per team panel

Adding a *new* seam entry is the one edit that needs coordinating. Land it on
its own, ahead of the feature work, so it never sits in a long-lived branch.

---

## Repo layout

```
.
├── CLAUDE.md
├── context.md
├── index.html
├── .env.example
├── public/                     ← raster tile assets, later local basemap
└── src/
    ├── main.tsx
    ├── styles.css
    ├── app/                    ★ core only
    │   ├── App.tsx
    │   ├── router.tsx
    │   └── layout/
    │       ├── AppShell.tsx
    │       ├── NavBar.tsx
    │       ├── SidebarStart.tsx   ← hosts the alerts panel
    │       ├── SidebarEnd.tsx     ← free slot, unclaimed
    │       └── Ticker.tsx
    ├── map/                    ★ core only
    │   ├── MapShell.tsx           the one Leaflet instance
    │   ├── MapContext.tsx
    │   ├── layerRegistry.ts       ← team layers wired here
    │   ├── useTeamLayers.ts       group-per-team lifecycle + toggle
    │   └── controls/
    │       ├── LayersButton.tsx
    │       └── LayersPanel.tsx
    ├── shared/                 ★ core only, read-only for teams
    │   ├── contracts.ts           TeamMapLayer — the team/shell seam
    │   ├── geo.ts                 Israel centre, zoom, bounds
    │   ├── localities.ts          118 localities + coordinates
    │   └── theme.ts               cssVar() for SVG/canvas colours
    ├── pages/                     thin route stubs, core-owned
    │   ├── OpsPage.tsx            חמ״ל — the map is the surface
    │   ├── LogisticsPage.tsx      → features/logistics
    │   └── LogsPage.tsx           → features/loop
    ├── features/
    │   ├── red/       { index.ts, RedLayer.ts }
    │   ├── blue/      { index.ts, BlueLayer.ts }
    │   ├── alerts/    { index.ts, AlertsPanel.tsx }
    │   ├── logistics/ { index.ts, LogisticsView.tsx }
    │   └── loop/      { index.ts, LogsView.tsx }
    └── types/
        └── events.ts           ★ shared event names — frozen
```

---

## Adding to the map

A team never touches `src/map/`. It exports a `TeamMapLayer` from its own
`index.ts`; the shell creates a `LayerGroup`, calls `mount` once, and owns
show/hide from the layers panel.

```ts
// src/features/red/index.ts
export const redLayer: TeamMapLayer = {
  id: 'red',
  label: 'צד אדום — מטרות אויב',
  colour: 'var(--team-red)',
  defaultVisible: true,
  mount: mountRedLayer, // (group, map) => void — fill `group`, nothing else
};
```

Both `red` and `blue` currently mount a single placeholder dot near the centre
of the country. **Delete the dot when real entities land** — it exists only to
prove the layer is wired.

Locality coordinates live in `@/shared/localities` (118 entries, keyed by a
stable `id`). Never keep a second coordinate table. `localitiesWithin(point, km)`
turns a track position into the settlements to warn.

---

## Design tokens

Defined once as CSS variables in `styles.css`, mirrored in `tailwind.config.ts`. Nobody hardcodes a hex.

```css
--bg: #070a0d; /* app background */
--panel: #0d1218; /* sidebars, navbar, ticker */
--panel-2: #111820; /* cards, inputs, raised surfaces */
--line: #1c2733; /* default border */
--line-hot: #2b3a4a; /* emphasised border, hover */

--text: #c8d6e2;
--text-dim: #5f7285;

--accent: #2f9bff; /* core chrome */

--team-red: #ff3b30;
--team-blue: #2f9bff;
--team-alerts: #ffb020;
--team-logistics: #37d67a;
--team-loop: #a78bfa;
```

Team colours are namespaced (`team-red`, not `red`) so they do not shadow
Tailwind's own palettes. Leaflet writes colours into SVG attributes, where
`var()` does not resolve — use `cssVar('--team-red')` from `@/shared/theme`
rather than pasting a hex.

Type: Heebo for Hebrew UI, IBM Plex Mono for anything numeric — IDs, coordinates, counts, timers. Tabular figures on all monospace numbers so they stop jittering under live updates.

Chrome is quiet: 1px borders, no shadows, corner radius 2–3px maximum. The map is the bright surface; everything around it recedes.

---

## Hard rules

1. **No deep cross-team imports.** A team imports from another only via `@/features/<team>` (its `index.ts`). Shared types come from `@/types/events`, shared data from `@/shared/*` (read-only).
2. **`src/map/`, `src/app/`, `src/pages/` and `src/shared/` are core's.** Other teams never edit them — they register a layer or export a panel.
3. **`src/types/events.ts` and `src/shared/contracts.ts` are frozen.** Changing either needs every lead.
4. **The map instance is created once and never unmounted.** Route changes toggle CSS visibility. Recreating a Leaflet map is expensive and discards camera state.
5. **Never put entity coordinates in React state.** At 10Hz, `setState` per tick will kill the browser. Positions go straight onto the Leaflet layer (`layer.setLatLng(...)` / `layer.setLatLngs(...)`) inside `requestAnimationFrame`. React owns UI only — panels, modals, tables.
6. **Explicit return types on everything exported from an `index.ts`.**
7. **No `any`.**

### File banner

```ts
/**
 * @team     red
 * @owner    <name>
 * @public   yes | no
 * @updated  YYYY-MM-DD
 */
```

### Enforced by lint

```js
'no-restricted-imports': ['error', { patterns: [
  { group: ['@/features/*/*'], message: 'Cross-team imports go through @/features/<team> only.' },
  { group: ['**/internal/**'], message: 'internal/ is private to its team.' },
]}]
```

---

## Commands

```bash
pnpm install
pnpm dev          # :5173
pnpm lint
pnpm typecheck
pnpm build
```

## Environment

`.env` — gitignored, so every developer needs their own copy.

```
VITE_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=YOUR_KEY
```

This is a **raster XYZ template**, not a style JSON — Leaflet interpolates
`{s}/{z}/{x}/{y}` itself. Point it at a MapLibre style URL and every tile
request throws inside Leaflet's `template()`.

The `key` parameter is required: CARTO now meter their raster basemaps and
watermark unkeyed tiles. Keys are free (5M tile requests/calendar month across
raster and vector) from <https://carto.com/basemaps/apikey> — no account
needed. **Never commit the key.** It goes in `.env`; `.env.example` carries a
placeholder.

**Attribution is a licence condition.** CARTO grant the free allowance in
exchange for visible CARTO + OpenStreetMap credit, so `attributionControl`
stays on in `MapShell`. Do not switch it off to quieten the chrome.

Two things to know before this becomes load-bearing:

- CARTO describe the free tier as **intended for non-commercial use**. Past the
  limit they may ask for a commercial agreement.
- **The raster service is being retired** in favour of vector, and CARTO are
  considering freezing its data. This only affects the hosted dev basemap —
  air-gapped production serves its own tiles — but it is a reason not to build
  anything long-lived on hosted raster.

### Closed-network note

Production runs air-gapped. The swap is isolated to one env var:

- **Tiles:** repoint `VITE_MAP_TILE_URL` at locally-served raster tiles — a static `{z}/{x}/{y}` tile directory or a raster `.pmtiles` archive read through `protomaps-leaflet`. No tile server.
- **Hebrew labels:** baked into the raster tiles themselves, so there is no RTL text plugin to self-host — that was a MapLibre vector-label concern.

---

## Working style for Claude Code

- Make the smallest change that satisfies the brief. This is a skeleton — resist filling it in.
- Anything marked "intentionally empty" in `context.md` stays empty. A placeholder comment is the correct output, not a plausible implementation.
- Before touching `src/map/`, `src/app/`, `src/pages/`, `src/shared/` or `src/types/events.ts`, say so and wait.
- One file per concern. Five teams read this.
- Hebrew UI text inline. No i18n framework.
