# Таблица зависимостей

| Символ | Значение |
|--------|----------|
| `(все типы нодов)` | Все классы узлов: `NumberNode`, `ConstantNode`, `GroupNode`, `OutputNode`, `CalcNode`, `MapNode`, `ConfidenceIntervalNode` и другие |
| `(нет зависимостей)` | Файл не импортирует другие модули проекта (может использовать глобальные объекты или стандартную библиотеку JS) |

## Примечания к зависимостям

1. **Глобальные зависимости** (не через import, а через `window`):
   - `window._viewport`, `window.currentZoom`, `window._designQualitySaved`, `window.applyDesignQuality` – используются в `History`, `Viewport`, `PersistenceService`, `main.js`
   - `window._renderer`, `window._history`, `window._rendererVirtual` и др. – используются в `BenchmarkService`

2. **Внешние библиотеки** (CDN):
   - Font Awesome 6 – иконки в UI
   - Используются через CDN в `amenodes.html`, не требуют импорта в JS

3. **Самодостаточные модули**:
   - `SymbolMapper`
   - `FPSCounter`
   - `EventBus`
   - `DataType` (частично, зависит от `modal` только в `Graph`, но сам `DataType.js` независим)
   - 
| Модуль (файл) | Импортируемые зависимости |
|---------------|---------------------------|
| **src/main.js** | `Graph` (core/Graph), `Viewport` (renderer/Viewport), `DomRenderer` (renderer/DomRenderer), `History` (core/History), `ToolbarController` (ui/ToolbarController), `OptimizationPanel` (ui/OptimizationPanel), `BenchmarkService` (services/BenchmarkService), `PersistenceService` (services/PersistenceService), `EventBus` (services/EventBus), `FPSCounter` (utils/FPSCounter), `OPTIMIZATIONS` (config/Optimizations), `OutputNode` (nodes/OutputNode), `i18n`, `t`, `modal` (ui/CustomModal), `NodeMenu` (ui/NodeMenu) |
| **src/core/Graph.js** | (все типы нодов), `Edge` (core/Edge), `typeSystem`, `DataType` (core/DataType), `modal` (ui/CustomModal), `t` (i18n/LanguageManager) |
| **src/core/Node.js** | `EditableTitle` (ui/EditableTitle), `i18n` (i18n/LanguageManager) |
| **src/core/Edge.js** | (нет зависимостей) |
| **src/core/DataType.js** | (нет зависимостей) |
| **src/core/History.js** | (нет зависимостей, использует глобальный `window._viewport`, `window.currentZoom`, `window._designQualitySaved`, `window.applyDesignQuality`) |
| **src/nodes/NodeFactory.js** | (все типы нодов), `i18n` (i18n/LanguageManager) |
| **src/renderer/Viewport.js** | (нет зависимостей, использует глобальные `window.currentZoom`, `window._viewportX`, `window._viewportY`) |
| **src/renderer/DomRenderer.js** | `EdgeRenderer` (renderer/EdgeRenderer), `ContextMenu` (ui/ContextMenu), (все типы нодов) |
| **src/renderer/EdgeRenderer.js** | (нет зависимостей) |
| **src/ui/EditableTitle.js** | `replaceSymbols` (utils/SymbolMapper) |
| **src/ui/ContextMenu.js** | `NodeFactory` (nodes/NodeFactory), `modal` (ui/CustomModal), `i18n`, `t` (i18n/LanguageManager) |
| **src/ui/CustomModal.js** | (нет зависимостей) |
| **src/ui/LanguageSwitcher.js** | `i18n`, `t` (i18n/LanguageManager) |
| **src/ui/NodeMenu.js** | `NodeFactory` (nodes/NodeFactory), `i18n`, `t` (i18n/LanguageManager), `modal` (ui/CustomModal) |
| **src/ui/OptimizationPanel.js** | `OPTIMIZATIONS` (config/Optimizations), `i18n`, `t` (i18n/LanguageManager) |
| **src/ui/ToolbarController.js** | `NodeFactory` (nodes/NodeFactory), `modal` (ui/CustomModal), `i18n`, `t` (i18n/LanguageManager), `LanguageSwitcher` (ui/LanguageSwitcher) |
| **src/i18n/LanguageManager.js** | `ru` (i18n/locales/ru), `en` (i18n/locales/en) |
| **src/i18n/locales/ru.js** | (нет зависимостей, экспортирует объект переводов) |
| **src/i18n/locales/en.js** | (нет зависимостей, экспортирует объект переводов) |
| **src/services/BenchmarkService.js** | (нет зависимостей, использует глобальные `window._renderer`, `window._history`, `window._rendererVirtual`, `window._rendererWillChange`, `window._rendererContain`, `window._rendererPointerEvents`, `window._historyMaxSize`) |
| **src/services/PersistenceService.js** | `modal` (ui/CustomModal) |
| **src/services/EventBus.js** | (нет зависимостей) |
| **src/utils/SymbolMapper.js** | (нет зависимостей, экспортирует `SYMBOL_MAP` и функцию `replaceSymbols`) |
| **src/utils/FPSCounter.js** | (нет зависимостей) |
| **src/config/Optimizations.js** | (нет зависимостей, экспортирует `OPTIMIZATIONS`) |
| **amenodes.html** | `styles/main.css`, `src/main.js` (через type="module"), Font Awesome 6, иконка (data:image/svg+xml) |
| **styles/main.css** | (нет зависимостей, глобальные стили) |
| **README.md** | (нет зависимостей, документация) |


