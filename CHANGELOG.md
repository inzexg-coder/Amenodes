# Changelog

## 2.8.4 — 2026-06-20

### Added
- **Port hover effect** — scale(1.5) + цветная вспышка в цвет порта (оранжевый/синий) с filter drop-shadow (#4 roadmap)
- `filter: brightness(1.5) drop-shadow()` для чистого свечения без двойного наложения
- Анимация `handle-flash` — белый burst → затухание до glow порта

### Fixed
- **i18n ошибки соединения** — сообщение «This node cannot accept incoming connections» заменено на переведённое `errors.cannotConnect` (RU: «Невозможно соединить», EN: «Cannot connect»)

### Changed
- Все JS-файлы очищены от комментариев
- `docs/core/Node.md` — возвращаемый тип `canAcceptEdge` приведён в соответствие с кодом

### Refactored
- Glow портов переведён с box-shadow на CSS filter (brightness + drop-shadow)
- Удалён CSS-блок `.node-handle-blue:hover` (наследуется от общего ховера)
