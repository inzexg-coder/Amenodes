<h1 align="center">Amenoke</h1>

<p align="center">
  <strong>1.1.0-rc1-I18N</strong><br>
  <sub>Internationalization Release Candidate | Multi-language support (EN/RU) with dynamic UI translation</sub>
</p>

<h4 align="center">
  <b><a href="https://github.com/inzexg-coder/Amenodes">Github Repository</a></b>
  •
  <b><a href="https://amenoke.ru/amenodes.html">AMENODES</a></b>
  •
  <b><a href="https://github.com/inzexg-coder/Amenodes/wiki">Wiki Docs</a></b>
</h3>

## Introduction

AMNDS is a node-based visual programming language developed in JavaScript for data analysis and work, replacing cumbersome Excel spreadsheets with a large set of mathematical tools.

---

## Tools under development

See Wikipedia update statistics and problem resolutions in the following graphs:

<a href="https://next.ossinsight.io/widgets/official/analyze-repo-pushes-and-commits-per-month?repo_id=1224446727" target="_blank" style="display: block" align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/analyze-repo-pushes-and-commits-per-month/thumbnail.png?repo_id=1224446727&image_size=auto&color_scheme=dark" width="auto" height="180">
    <img alt="Pushes and Commits of inzexg-coder/Amenodes" src="https://next.ossinsight.io/widgets/official/analyze-repo-pushes-and-commits-per-month/thumbnail.png?repo_id=1224446727&image_size=auto&color_scheme=dark" width="auto" height="180">
  </picture>
</a>

<a href="https://next.ossinsight.io/widgets/official/analyze-user-contribution-time-distribution?user_id=280004226&period=all_times" target="_blank" style="display: block" align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/analyze-user-contribution-time-distribution/thumbnail.png?user_id=244792661&period=all_times&image_size=auto&color_scheme=dark" width="auto" height="180">
    <img alt="Contribution Time Distribution of Amenoke" src="https://next.ossinsight.io/widgets/official/analyze-user-contribution-time-distribution/thumbnail.png?user_id=244792661&period=all_times&image_size=auto&color_scheme=dark" width="auto" height="180">
  </picture>
</a>

---

## Amenoke stats

My latest actions on the GitHub page, somehow related to the project or others:

<a href="https://next.ossinsight.io/widgets/official/compose-user-dashboard-stats?user_id=244792661" target="_blank" style="display: block" align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-user-dashboard-stats/thumbnail.png?user_id=244792661&image_size=auto&color_scheme=dark" width="890" height="auto">
    <img alt="Dashboard stats of @inzexg-coder" src="https://next.ossinsight.io/widgets/official/compose-user-dashboard-stats/thumbnail.png?user_id=244792661&image_size=auto&color_scheme=dark" width="890" height="auto">
  </picture>
</a>

---

## Developer Documentation

### Project Architecture

The codebase is modularized into ES6 classes organized by responsibility. Below is the complete directory structure:

```
root/
├── amenodes.html                 # Main application entry point
├── src/
│   ├── main.js                   # Application entry point, orchestrates all modules
│   ├── core/
│   │   ├── Graph.js              # Core graph data structure (nodes, edges, evaluation)
│   │   ├── Node.js               # Abstract base class for all node types
│   │   ├── Edge.js               # Edge/connection model
│   │   ├── History.js            # Undo/redo with localStorage autosave
│   │   └── DataType.js           # Type system for connection validation (NUM, ARRAY, AUTO, UNCERT, LIST, WLIST)
│   ├── nodes/
│   │   ├── NumberNode.js         # Single numeric value node
│   │   ├── ConstantNode.js       # Constant value node with visual display
│   │   ├── GroupNode.js          # Multi-value container node
│   │   ├── CalcNode.js           # Calculation node (div3, div_sqrt12, sqrt_sum_sq)
│   │   ├── OutputNode.js         # Results display node with table view
│   │   ├── MapNode.js            # Value mapping/transformation node (X→Y with passthrough/separate modes)
│   │   └── NodeFactory.js        # Factory for creating nodes with localized titles
│   ├── renderer/
│   │   ├── Viewport.js           # Pan/zoom viewport controller (right-mouse drag)
│   │   └── DomRenderer.js        # DOM manipulation, edge rendering, drag handling
│   ├── ui/
│   │   ├── EditableTitle.js      # Inline editable title component with symbol support
│   │   ├── OptimizationPanel.js  # Performance tuning panel UI with benchmarking
│   │   ├── ContextMenu.js        # Right-click context menu for nodes
│   │   ├── CustomModal.js        # Custom modal dialogs (alert, confirm, prompt)
│   │   └── LanguageSwitcher.js   # Language toggle button with dropdown menu
│   ├── i18n/
│   │   ├── LanguageManager.js    # Core i18n manager with subscription system
│   │   └── locales/
│   │       ├── ru.js             # Russian translations for all UI strings
│   │       └── en.js             # English translations for all UI strings
│   ├── services/
│   │   ├── BenchmarkService.js   # Performance benchmarking for optimizations
│   │   ├── PersistenceService.js # Save/load to localStorage and files
│   │   └── EventBus.js           # Event pub/sub system for component communication
│   ├── utils/
│   │   ├── SymbolMapper.js       # Greek letter and math symbol substitution ($alpha → α)
│   │   └── FPSCounter.js         # Real-time FPS measurement utility
│   └── config/
│       └── Optimizations.js      # Performance optimization definitions and metadata
└── styles/
    └── main.css                  # All application styles with design quality variants
```

---

## Class Responsibility Matrix

| Class | File Path | Purpose | Key Methods | Dependencies |
|-------|-----------|---------|-------------|--------------|
| `Graph` | `core/Graph.js` | Manages nodes, edges, dependency resolution, value propagation | `addNode()`, `addEdge()`, `removeNode()`, `getSourceValue()`, `reevaluateAll()` | `Node`, `Edge`, `DataType` |
| `Node` | `core/Node.js` | Abstract base class for all nodes with translation support | `createBaseDiv()`, `getLocalizedTitle()`, `updateTitleTranslation()`, `toJSON()` | `EditableTitle`, `i18n` |
| `NumberNode` | `nodes/NumberNode.js` | Single numeric input/output | `getValue()`, `createDOM()` | `Node` |
| `ConstantNode` | `nodes/ConstantNode.js` | Constant value with visual display and inline editing | `getValue()`, `createDOM()` | `Node`, `CustomModal` |
| `GroupNode` | `nodes/GroupNode.js` | Array of named numeric values | `getValue()`, `createDOM()` | `Node`, `EditableTitle`, `i18n` |
| `CalcNode` | `nodes/CalcNode.js` | Mathematical operations (div3, div_sqrt12, sqrt_sum_sq) | `getValue()`, `createDOM()` | `Node`, `i18n` |
| `OutputNode` | `nodes/OutputNode.js` | Displays computed results in table format | `getValue()`, `createDOM()` | `Node`, `EditableTitle`, `i18n` |
| `MapNode` | `nodes/MapNode.js` | X→Y value mapping with passthrough/separate modes | `getValue()`, `getUnmapped()`, `createDOM()` | `Node`, `EditableTitle`, `i18n` |
| `NodeFactory` | `nodes/NodeFactory.js` | Factory for creating nodes with localized titles | `createNode()`, `createNumberAt()`, `createConstantAt()`, `createGroupAt()`, `createOutputAt()`, `createCalcAt()`, `createMapAt()` | `i18n` |
| `Edge` | `core/Edge.js` | Connection between source and target ports | `toJSON()` | None |
| `DataType` | `core/DataType.js` | Type definitions and connection validation | `canConnect()`, `getNodeType()` | None |
| `History` | `core/History.js` | Snapshot-based undo/redo with autosave | `save()`, `undo()`, `redo()`, `autoSave()` | `Graph` |
| `Viewport` | `renderer/Viewport.js` | Camera control (pan with right mouse button, zoom) | `attach()`, `update()`, `getOffset()`, `getRect()` | None |
| `DomRenderer` | `renderer/DomRenderer.js` | Node DOM creation, edge SVG rendering, drag-drop | `render()`, `addHandles()`, `applyOptStyles()`, `setVirtual()` | `Graph`, `Viewport`, `EdgeRenderer` |
| `EdgeRenderer` | `renderer/EdgeRenderer.js` | SVG edge rendering with arrows and deletion | `renderEdges()`, `getBorderPoint()` | None |
| `EditableTitle` | `ui/EditableTitle.js` | Click-to-edit title component with symbol replacement | `startEdit()`, `finish()`, `getElement()` | `SymbolMapper` |
| `OptimizationPanel` | `ui/OptimizationPanel.js` | Performance settings UI with benchmarking | `buildPanel()`, `apply()`, `updateGains()` | `OPTIMIZATIONS`, `i18n` |
| `ContextMenu` | `ui/ContextMenu.js` | Right-click context menu for node operations | `show()`, `close()` | `NodeFactory`, `i18n` |
| `CustomModal` | `ui/CustomModal.js` | Custom modal dialogs (alert, confirm, prompt) | `alert()`, `confirm()`, `prompt()`, `close()` | None |
| `LanguageSwitcher` | `ui/LanguageSwitcher.js` | Language toggle button with dropdown | `init()`, `toggleMenu()`, `createMenu()` | `i18n` |
| `LanguageManager` | `i18n/LanguageManager.js` | Core i18n with subscription system | `t()`, `setLanguage()`, `subscribe()`, `getAvailableLanguages()` | `locales/*.js` |
| `BenchmarkService` | `services/BenchmarkService.js` | Performance benchmarking for optimizations | `runBenchmark()`, `captureState()`, `restoreState()` | `FPSCounter`, `OPTIMIZATIONS` |
| `PersistenceService` | `services/PersistenceService.js` | Save/load to localStorage and .amnk files | `saveToStorage()`, `loadFromStorage()`, `exportToFile()`, `importFromFile()` | `Graph`, `modal` |
| `EventBus` | `services/EventBus.js` | Event pub/sub system | `on()`, `off()`, `emit()` | None |
| `SymbolMapper` | `utils/SymbolMapper.js` | Greek letter and math symbol substitution | `replaceSymbols()` | None |
| `FPSCounter` | `utils/FPSCounter.js` | requestAnimationFrame-based FPS monitoring | `start()`, `measure()` | None |
| `OPTIMIZATIONS` | `config/Optimizations.js` | Static optimization descriptors array | None | None |

---

## How to Use the Classes for Developers

### Core Graph Management

```javascript
import { Graph } from './core/Graph.js';
import { NumberNode } from './nodes/NumberNode.js';
import { OutputNode } from './nodes/OutputNode.js';

const graph = new Graph();

// Create nodes manually
const numNode = new NumberNode(null, 100, 100, "My Number", 42);
const outNode = new OutputNode(null, 400, 100, "Output", []);

graph.addNode(numNode);
graph.addNode(outNode);

// Connect nodes
graph.addEdge(numNode.id, outNode.id);

// Reevaluate all calculations
graph.reevaluateAll();
graph.updateAllOutputs();

// Save/load state
const serialized = graph.toSerial();
graph.loadFrom(serialized);
```

### Creating Nodes with Factory (Recommended)

```javascript
import { NodeFactory } from './nodes/NodeFactory.js';

// Creates node at center of viewport
const numberNode = NodeFactory.createNumberAt(200, 150, 100);
const constantNode = NodeFactory.createConstantAt(200, 250, 3.14159);
const groupNode = NodeFactory.createGroupAt(200, 350);
const calcNode = NodeFactory.createCalcAt(500, 150, 'div3', 'Measurement Error');
const outputNode = NodeFactory.createOutputAt(500, 350);
const mapNode = NodeFactory.createMapAt(500, 250);

graph.addNode(numberNode);
```

### Using the Type System

```javascript
import { typeSystem, DataType } from './core/DataType.js';

// Check if two node types can connect
const canConnect = typeSystem.canConnect(
  DataType.NUM,   // source type
  'number',       // source node type
  DataType.AUTO,  // target type
  'output'        // target node type
);

// Get node's data type
const nodeType = typeSystem.getNodeType(someNode);
```

### Undo/Redo with History

```javascript
import { History } from './core/History.js';

const history = new History(graph, 50); // max 50 steps

// After any modification:
history.save();

// Undo/redo:
history.undo();
history.redo();

// Auto-save is automatic, but you can force:
history.autoSave();
```

### Rendering with Viewport and DomRenderer

```javascript
import { Viewport } from './renderer/Viewport.js';
import { DomRenderer } from './renderer/DomRenderer.js';

const viewport = new Viewport(viewportElement, canvasContainer);
const renderer = new DomRenderer(graph, nodesLayer, viewportElement, eventBus);

renderer.setViewport(viewport);
renderer.setHistory(history);
renderer.render();

// Enable virtualization for performance
renderer.setVirtual(true);

// Access viewport controls
viewport.setOffset(100, 200); // pan
window.setZoom(1.5); // zoom using global helper
```

### Internationalization (i18n)

```javascript
import { i18n, t } from './i18n/LanguageManager.js';

// Get current language
const lang = i18n.getCurrentLanguage(); // 'en' or 'ru'

// Translate a string
const translated = t('common.ok'); // 'OK' or 'ОК'

// Translate with parameters
const welcome = t('common.welcome', { name: 'User' });

// Set language dynamically
i18n.setLanguage('ru'); // All subscribed UI updates automatically

// Subscribe to language changes
const unsubscribe = i18n.subscribe((lang, translations) => {
  console.log(`Language changed to ${lang}`);
  this.updateUI();
});

// Unsubscribe when component is destroyed
unsubscribe();

// Get available languages
const languages = i18n.getAvailableLanguages();
// Returns: [{ code: 'en', name: 'English', nativeName: 'English' }, ...]
```

### Adding New Translations

1. Add keys to both `src/i18n/locales/ru.js` and `src/i18n/locales/en.js`
2. Follow the nested object structure: `category.subcategory.key`
3. Use `t('category.subcategory.key')` in components

Example:
```javascript
// locales/en.js
export const en = {
  myFeature: {
    buttonText: 'Click Me',
    description: 'This is a {color} button'
  }
};

// In component
const text = t('myFeature.buttonText'); // 'Click Me'
const desc = t('myFeature.description', { color: 'red' }); // 'This is a red button'
```

### Performance Benchmarking

```javascript
import { BenchmarkService } from './services/BenchmarkService.js';
import { OPTIMIZATIONS } from './config/Optimizations.js';

const benchmarkService = new BenchmarkService(graph, fpsCounter, OPTIMIZATIONS);

// Run automatic benchmark (tests each optimization)
const result = await benchmarkService.runBenchmark();
console.log(`Baseline FPS: ${result.baseline}`);
console.log(`Gains: ${result.gains}`);

// Apply optimizations manually
benchmarkService.setVirtual(true);
benchmarkService.setWillChange(true);
```

### Save/Load Functionality

```javascript
import { PersistenceService } from './services/PersistenceService.js';

const persistence = new PersistenceService(graph);

// Auto-save to localStorage
persistence.saveToStorage(viewport, currentZoom, qualityValue);

// Load from localStorage
const saved = persistence.loadFromStorage();

// Export to .amnk file
persistence.exportToFile();

// Import from .amnk file
const success = await persistence.importFromFile(file);
```

### Custom Modal Dialogs

```javascript
import { modal } from './ui/CustomModal.js';

// Alert
await modal.alert('Something happened');

// Confirm
const confirmed = await modal.confirm('Are you sure?');

// Prompt
const value = await modal.prompt('Enter value:', 'default');
```

### Event Bus for Component Communication

```javascript
import { EventBus } from './services/EventBus.js';

const bus = new EventBus();

// Subscribe to event
bus.on('node:created', (data) => {
  console.log('Node created:', data.nodeId);
});

// Emit event
bus.emit('node:created', { nodeId: 123 });
```

---

## Versioning System for Developers

Amenoke follows a **structured versioning scheme** combining semantic versioning, pre-release labels, and change-type codes.

### Format
`MAJOR.MINOR.PATCH[-PRERELEASE][-CODETYPE]`

| Component | Meaning | Example |
|-----------|---------|---------|
| **MAJOR** | Breaking changes (incompatible API) | `2.0.0` |
| **MINOR** | Backward-compatible new features | `1.2.0` |
| **PATCH** | Backward-compatible bug fixes | `1.0.1` |
| **PRERELEASE** | Development phase: `-alphaN`, `-betaN`, `-rcN` | `-rc1` |
| **CODETYPE** | Nature of changes: `API`, `TYP`, `SEC`, `OPT`, `DEP`, `REM`, `SYN`, `I18N` | `-I18N` |

### Change Type Codes

| Code | Meaning | When to Use |
|------|---------|--------------|
| `API` | Public API changes (new/removed methods) | After modifying `Graph.js` public interface |
| `TYP` | Type system enhancements | After changes to type checking in `DataType.js` or `Node.js` |
| `SEC` | Security fixes | After patching vulnerabilities |
| `OPT` | Performance optimizations | After changes in `Optimizations.js` or renderer |
| `DEP` | Deprecations (still working) | After marking old features as deprecated |
| `REM` | Removed deprecated features | After deleting old functionality |
| `SYN` | Syntax/parser changes | After modifying node connection rules |
| `I18N` | Internationalization | After adding/updating language support |

### Full Version Examples

| Human Readable | System Version | Meaning |
|----------------|----------------|---------|
| Internationalization RC1 | `1.2.0-rc1-I18N` | Multi-language support, release candidate 1 |
| Type System RC1 | `1.1.0-rc1-TYP` | New type system, release candidate 1 |
| Security Hotfix | `1.0.2-SEC` | Critical security patch |
| API Redesign | `2.0.0-beta1-API` | Breaking API changes in beta |
| Performance Boost | `1.0.1-OPT` | Optimized evaluation engine |

### How to Bump Version

1. Determine change type from commit history
2. Increment component according to rules:
   - Breaking change → `MAJOR+1`, reset `MINOR`/`PATCH` to 0
   - New feature → `MINOR+1`, reset `PATCH` to 0  
   - Bug fix → `PATCH+1`
3. Append appropriate `CODETYPE` based on primary change
4. For pre-releases, append `-alpha/beta/rcN`

Example after merging i18n PR:
```
Previous: 1.1.1-CONST
Change: Added multi-language support
New version: 1.2.0-rc1-I18N
```

---

## Module Loading Strategy

The application uses ES6 modules with an import map defined in `amenodes.html`:

```html
<script type="importmap">
{
  "imports": {
    "./src/main.js": "./src/main.js",
    "./src/i18n/LanguageManager.js": "./src/i18n/LanguageManager.js",
    "./src/i18n/locales/ru.js": "./src/i18n/locales/ru.js",
    "./src/i18n/locales/en.js": "./src/i18n/locales/en.js",
    "./src/ui/LanguageSwitcher.js": "./src/ui/LanguageSwitcher.js"
  }
}
</script>
```

All relative paths resolve from the document root. When deploying, ensure the directory structure matches exactly as shown above.

---

## Git Workflow for Contributors

### Repository Setup

```bash
git clone https://github.com/inzexg-coder/Amenodes.git
cd Amenodes
git checkout -b feature/your-feature-name
```

### Commit Convention

Use semantic commit messages:

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature or node type |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring without behavior change |
| `style:` | CSS/visual changes only |
| `docs:` | Documentation updates |
| `perf:` | Performance optimization |
| `i18n:` | Translation or language-related changes |
| `chore:` | Build/config changes |

### Before Committing

1. Test all existing node types
2. Run manual FPS benchmark (open optimization panel → "Recalculate optimization impact")
3. Ensure no regression in undo/redo functionality
4. Verify import/export compatibility with previous saves
5. Test language switching for all UI components

### Pull Request Process

1. Push to your feature branch
2. Open PR against `main` branch
3. Include description of changes and test results
4. Request review from project maintainer

---

## Performance Optimization Guidelines

The optimization system benchmarks each technique independently. When adding performance-related code:

1. Add entry to `config/Optimizations.js` with `impl: true` if implementable
2. Implement toggle logic in `applyOptimizations()` function
3. The benchmarking framework automatically measures FPS impact

Important: The optimization panel runs benchmarks sequentially. Each optimization is measured in isolation for accurate gain calculation.

---

## Contact & Support

<a href="https://t.me/Amenoke" target="_blank">
<img src=https://img.shields.io/badge/telegram-%2300acee.svg?color=1DA1F2&style=for-the-badge&logo=telegram&logoColor=white alt=telegram style="margin-bottom: 5px;" />
</a>

<a href="https://github.com/inzexg-coder" target="_blank">
<img src=https://img.shields.io/badge/github-%2300acee.svg?color=181717&style=for-the-badge&logo=github&logoColor=white alt=github style="margin-bottom: 5px;" />
</a>

<a href="mailto:amenokeakira@gmail.com" target="_blank">
<img src=https://img.shields.io/badge/gmail-%2300acee.svg?color=EA4335&style=for-the-badge&logo=gmail&logoColor=white alt=gmail style="margin-bottom: 5px;" />
</a>

---

**Repository:** [https://github.com/inzexg-coder/Amenodes](https://github.com/inzexg-coder/Amenodes)  
**Live Demo:** [https://amenoke.ru/amenodes.html](https://amenoke.ru/amenodes.html)  
**Wiki:** [https://github.com/inzexg-coder/Amenodes/wiki](https://github.com/inzexg-coder/Amenodes/wiki)
