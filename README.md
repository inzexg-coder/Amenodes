<h1 align="center">Amenodes</h1>

<p align="center">
  <strong>1.4.1</strong><br>
  <sub>Visual Programming Language for Data Analysis</sub>
</p>

<h4 align="center">
  <b><a href="https://github.com/inzexg-coder/Amenodes">GitHub Repository</a></b>
  •
  <b><a href="https://amenoke.ru/amenodes.html">Live Demo</a></b>
  •
  <b><a href="https://github.com/inzexg-coder/Amenodes/wiki">Wiki Docs</a></b>
</h4>

---

## 📖 About Amenodes

**Amenodes** is a node-based visual programming language developed in JavaScript for data analysis and calculations, replacing cumbersome Excel spreadsheets with a flexible, visual interface and a rich set of mathematical tools.

### Key Features

- **Visual Node Editor** – Drag-and-drop nodes, connect them with wires, and see results update in real-time.
- **Rich Node Library** – Number nodes, constants, groups, calculators (uncertainty propagation), mapping nodes, confidence intervals, and output displays.
- **Real-time Computation** – Automatic reevaluation when connections or values change.
- **Type System** – Smart connection validation prevents invalid links (e.g., connecting text to a number input).
- **Internationalization (i18n)** – Full support for English and Russian with an easy-to-extend translation system.
- **Performance Optimizations** – Built-in benchmarking and optimization panel to tune rendering (virtualization, GPU transforms, caching, and more).
- **Undo/Redo** – Full history with auto-save to localStorage.
- **Import/Export** – Save your graphs to `.amnk` files and load them back.
- **Pan & Zoom** – Right-click drag to pan, scroll to zoom.
- **Customizable UI** – Design quality slider to trade off visual effects for performance (up to +300% FPS).

---

## 🚀 Quick Start

### Live Demo

Try Amenodes online: **[https://amenoke.ru/amenodes.html](https://amenoke.ru/amenodes.html)**

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/inzexg-coder/Amenodes.git
   cd Amenodes
   ```

2. Start a local server (e.g., with Python):
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

3. Open `http://localhost:8000/amenodes.html` in your browser.

---

## 🎮 User Guide

### Creating Nodes

Click the **+** button in the toolbar or right-click on an existing node's handle to open the node menu. Select any node type – it will appear on the canvas.

### Connecting Nodes

- Click and drag from a colored circle (handle) on the right/bottom/top/left of a node to another node's handle.
- A line with an arrow indicates the connection.
- Right-click on a connection line to delete it.

### Working with Nodes

- **Edit titles** – Click on any node title to rename it.
- **Mark as important** – Right-click on a node and select "Mark IMPORTANT node" – the node gets a blue glow.
- **Delete nodes** – Click the ✕ button in the node header.
- **Drag nodes** – Click and drag the header to move nodes around.

### Toolbar

| Button | Action |
|--------|--------|
| **Undo** | Revert the last action |
| **Redo** | Re-apply a reverted action |
| **Export** | Save your graph as a `.amnk` file |
| **Import** | Load a previously saved `.amnk` file |
| **Clear storage** | Delete the auto-saved graph from localStorage |
| **Language** | Switch between English and Russian |

### Performance Panel

Click the **speedometer icon** (bottom-right) to open the optimization panel. You can:
- Enable/disable individual optimizations (virtualization, GPU transforms, will-change, etc.)
- Run benchmarks to measure FPS gains
- Adjust the **Design Quality** slider – lower quality dramatically improves performance (up to +300% FPS) at the cost of visual polish.

---

## 📚 Developer Documentation

### Project Architecture

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
│   │   └── DataType.js           # Type system for connection validation
│   ├── nodes/
│   │   ├── registry.js           # Node registration and translation loading
│   │   ├── manifest/this-manifest.js  # Node manifest
│   │   └── locales/              # Per-node translations (en/ru)
│   ├── renderer/
│   │   ├── Viewport.js           # Pan/zoom viewport controller
│   │   ├── DomRenderer.js        # DOM manipulation, edge rendering, drag handling
│   │   └── EdgeRenderer.js       # SVG edge rendering with arrows
│   ├── ui/
│   │   ├── EditableTitle.js      # Inline editable title component
│   │   ├── OptimizationPanel.js  # Performance tuning panel UI with benchmarking
│   │   ├── ContextMenu.js        # Right-click context menu for nodes
│   │   ├── CustomModal.js        # Custom modal dialogs (alert/confirm/prompt)
│   │   ├── LanguageSwitcher.js   # Language toggle button with dropdown menu
│   │   └── NodeMenu.js           # Node selection menu with metadata
│   ├── i18n/
│   │   ├── LanguageManager.js    # Core i18n manager with subscription system
│   │   └── locales/
│   │       ├── en.js             # Base English translations
│   │       └── ru.js             # Base Russian translations
│   ├── services/
│   │   ├── BenchmarkService.js   # Performance benchmarking for optimizations
│   │   ├── PersistenceService.js # Save/load to localStorage and files
│   │   └── EventBus.js           # Event pub/sub system
│   ├── utils/
│   │   ├── SymbolMapper.js       # Greek letter and math symbol substitution
│   │   └── FPSCounter.js         # Real-time FPS measurement utility
│   └── config/
│       └── Optimizations.js      # Performance optimization definitions
└── styles/
    └── main.css                  # All application styles
```

### Adding a New Node Type

1. Create a new node class in `src/nodes/` extending `Node` from `core/Node.js`.
2. Define `metadata` object with at least:
   ```javascript
   export const metadata = {
     type: 'myNode',           // unique identifier
     nameKey: 'nodes.myNode',  // translation key
     dataType: 'num',          // 'num', 'array', 'uncert', 'list', 'wlist', 'interval', 'auto'
     canHaveIncomingEdges: true/false,
     canHaveOutgoingEdges: true/false,
     allowedInputTypes: [...],
     allowedOutputTypes: [...],
     icon: 'fa-icon'
   };
   ```
3. Implement `createDOM(graph, renderer)` method.
4. Add translation files:
   - `src/nodes/locales/en/myNode.js` → `export default { nodes: { myNode: 'My Node' }, nodeDescriptions: {...}, dataTypes: {...} }`
   - `src/nodes/locales/ru/myNode.js` → Russian version
5. Register the node in `src/nodes/manifest/this-manifest.js`:
   ```javascript
   import { MyNode, metadata as myNodeMeta } from '../MyNode.js';
   // ... add to nodesManifest array
   ```

### Internationalization System

- **Base translations** (`src/i18n/locales/en.js`, `ru.js`) – contain UI strings (`common`, `toolbar`, `modal`, `errors`, etc.)
- **Node translations** (`src/nodes/locales/`) – contain `nodes`, `nodeDescriptions`, and node-specific UI sections (`calcTypes`, `output`, `group`, `map`, `confidence`, `dataTypes`).
- Translations are merged via `deepMerge` – node translations override base translations.
- Use `t('key')` in any component to get the current language's translation.

### Important: Relative Imports for Preview Compatibility

All dynamic imports **MUST** use relative paths (starting with `./` or `../`) to work correctly in preview environments:

```javascript
// ✅ CORRECT - works everywhere
const module = await import(`./${nodeType}.js`);
const locale = await import(`./locales/${lang}/${name}.js`);

// ❌ WRONG - breaks in preview subfolders
const module = await import(`/src/nodes/${nodeType}.js`);
```

### Adding New Translations for Node Data Types

To add a new data type (e.g., `'matrix'`), add to the node's translation file:
```javascript
export default {
  // ... existing translations
  dataTypes: {
    matrix: 'Matrix'  // English
  }
};
```

And in the Russian file:
```javascript
export default {
  dataTypes: {
    matrix: 'Матрица'
  }
};
```

### Type System

The type system validates connections:
- Each node declares its `dataType`.
- Each node declares `allowedInputTypes` and `allowedOutputTypes`.
- `DataType.canConnect()` checks compatibility.

### Key Classes for Developers

| Class | Path | Purpose |
|-------|------|---------|
| `Graph` | `core/Graph.js` | Manages nodes, edges, evaluation |
| `Node` | `core/Node.js` | Abstract base class for nodes |
| `NodeFactory` | `nodes/NodeFactory.js` | Node creation with i18n |
| `DataType` | `core/DataType.js` | Connection type validation |
| `History` | `core/History.js` | Undo/redo with autosave |
| `Viewport` | `renderer/Viewport.js` | Pan/zoom control |
| `DomRenderer` | `renderer/DomRenderer.js` | DOM rendering, drag handling |
| `EdgeRenderer` | `renderer/EdgeRenderer.js` | SVG edge rendering |
| `LanguageManager` | `i18n/LanguageManager.js` | i18n with subscriptions |
| `BenchmarkService` | `services/BenchmarkService.js` | Performance benchmarking |

---

## 📝 Versioning

Format: `MAJOR.MINOR.PATCH[-PRERELEASE][-CODETYPE]`

| Component | Meaning |
|-----------|---------|
| **MAJOR** | Breaking changes |
| **MINOR** | New features (backward-compatible) |
| **PATCH** | Bug fixes |
| **PRERELEASE** | `-alphaN`, `-betaN`, `-rcN` |
| **CODETYPE** | `API`, `TYP`, `SEC`, `OPT`, `DEP`, `REM`, `SYN`, `I18N` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes (see commit convention below)
4. Push to the branch
5. Open a Pull Request – CI will deploy a preview automatically to RU or EN server

### Commit Convention

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature or node type |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring |
| `style:` | CSS/visual changes |
| `docs:` | Documentation updates |
| `perf:` | Performance optimization |
| `i18n:` | Translation changes |
| `chore:` | Build/config changes |

---

## 📬 Contact & Support

<a href="https://t.me/Amenoke" target="_blank">
<img src=https://img.shields.io/badge/telegram-%2300acee.svg?color=1DA1F2&style=for-the-badge&logo=telegram&logoColor=white alt=telegram>
</a>

<a href="https://github.com/inzexg-coder" target="_blank">
<img src=https://img.shields.io/badge/github-%2300acee.svg?color=181717&style=for-the-badge&logo=github&logoColor=white alt=github>
</a>

<a href="mailto:amenokeakira@gmail.com" target="_blank">
<img src=https://img.shields.io/badge/gmail-%2300acee.svg?color=EA4335&style=for-the-badge&logo=gmail&logoColor=white alt=gmail>
</a>

---

**Repository:** https://github.com/inzexg-coder/Amenodes  
**Live Demo:** https://amenoke.ru/amenodes.html  
**Wiki:** https://github.com/inzexg-coder/Amenodes/wiki
