# Changelog

## 2.8.4 — 2026-06-20

### Added
- **Port hover effect** — scale(1.5) + color flash matching port color (orange/blue) with filter drop-shadow (#4 roadmap)
- `filter: brightness(1.5) drop-shadow()` for clean glow without double-shadow artifacts
- `handle-flash` animation — white burst → fade into port-colored glow

### Fixed
- **Connection error i18n** — hardcoded English message "This node cannot accept incoming connections" replaced with translated `errors.cannotConnect` (RU: «Невозможно соединить», EN: «Cannot connect»)

### Changed
- Stripped all comments from JS source files
- `docs/core/Node.md` — `canAcceptEdge` return type updated to match the code

### Refactored
- Port glow migrated from box-shadow to CSS filter (brightness + drop-shadow)
- Removed `.node-handle-blue:hover` block (inherits from the common hover rule)
