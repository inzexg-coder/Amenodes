# Changelog

## [2.8.3] — 2026-06-18

### Fixed

- **Edge sync during node drag** — Edges no longer "tear" or "hang in the air" when dragging nodes sharply. CSS transition is disabled on the dragged node (`transition: none`) so the node follows the cursor instantly. Edge positions are updated in sync with the node position.
- **Edge break on fast mouse jerks** — Added `requestAnimationFrame` throttling for edge position updates (once per frame maximum) and coordinate validation (`isFinite` check) in `getBorderPoint()` to prevent NaN/Infinity coordinates from breaking the SVG line.
- **Edge break when cursor leaves the viewport** — Added `mouseleave` handler on the viewport that forces a synchronous edge position update when the cursor leaves the canvas during a drag.
- **Type connection: List → Uncertainty** — `CalcNode` (data type `uncert`) now accepts `list` and `wlist` as allowed input types. Map nodes (`list`) can now be connected to Calculator nodes for uncertainty propagation.

### Changed

- **Type metadata centralized** — All node type configuration (`dataType`, `allowedInputTypes`, `canHaveIncomingEdges`, `canHaveOutgoingEdges`, `defaultValue`) has been moved from individual node files (`CalcNode.js`, `MapNode.js`, etc.) into a single `nodeTypeConfig` map in `src/nodes/registry.js`. This eliminates dependency on ES module caching and makes type definitions the single source of truth.
- **Type registration** — Types are now registered directly in `registerAllNodes()` via `typeSystem.registerType()`, making them available immediately after `loadAllNodes()` without relying on `initFromNodeRegistry()`.

### Docs

- `docs/nodes-class/registry.md` — documented `nodeTypeConfig`, updated `registerAllNodes()` flow.
- `docs/renderer/EdgeRenderer.md` — added coordinate validation note.
- `docs/renderer/DomRenderer.md` — documented `transition:none` during drag, rAF throttling, `mouseleave` handler, and `onGlobalUp` cleanup.
