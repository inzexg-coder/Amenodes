<h1 align="center">Amenoke</h1>

<h4 align="center">
  <b><a href="https://github.com/inzexg-coder/Amenodes">Github Repository</a></b>
  •
  <b><a href="https://amenoke.ru/amenodes.html">AMENODES</a></b>
  •
  <b><a href="https://github.com/inzexg-coder/Amenodes/wiki">Wiki Docs</a></b>
</h3>

## Introduction
AMNDS is a node-based visual programming language developed in JavaScript for data analysis and work, replacing cumbersome Excel spreadsheets with a large set of mathematical tools.

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
project-root/
├── amenodes.html                 # Main application entry point
├── core/
│   ├── Graph.js                  # Core graph data structure (nodes, edges, evaluation)
│   ├── Node.js                   # Abstract base class for all node types
│   ├── Edge.js                   # Edge/connection model
│   └── History.js                # Undo/redo with localStorage autosave
├── nodes/
│   ├── NumberNode.js             # Numeric value node
│   ├── GroupNode.js              # Multi-value container node
│   ├── CalcNode.js               # Calculation node (div3, div_sqrt12, sqrt_sum_sq)
│   ├── OutputNode.js             # Results display node
│   └── MapNode.js                # Value mapping/transformation node
├── rendering/
│   ├── Viewport.js               # Pan/zoom viewport controller
│   └── DomRenderer.js            # DOM manipulation, edge rendering, drag handling
├── ui/
│   ├── EditableTitle.js          # Inline editable title component
│   └── OptimizationPanel.js      # Performance tuning panel UI
├── utils/
│   ├── SymbolMapper.js           # Greek letter and math symbol substitution
│   └── FPSCounter.js             # Real-time FPS measurement utility
└── config/
    └── Optimizations.js          # Performance optimization definitions and metadata
```

### Class Responsibility Matrix

| Class | File Path | Purpose | Dependencies |
|-------|-----------|---------|--------------|
| `Graph` | `core/Graph.js` | Manages nodes, edges, dependency resolution, value propagation | `Node`, `Edge` |
| `Node` | `core/Node.js` | Abstract node interface with lifecycle methods | None |
| `NumberNode` | `nodes/NumberNode.js` | Single numeric input/output | `Node` |
| `GroupNode` | `nodes/GroupNode.js` | Array of named numeric values | `Node`, `EditableTitle` |
| `CalcNode` | `nodes/CalcNode.js` | Mathematical operations on incoming edges | `Node` |
| `OutputNode` | `nodes/OutputNode.js` | Displays computed results in table format | `Node`, `EditableTitle` |
| `MapNode` | `nodes/MapNode.js` | X→Y value mapping with passthrough/separate modes | `Node`, `EditableTitle` |
| `Edge` | `core/Edge.js` | Connection between source and target ports | None |
| `History` | `core/History.js` | Snapshot-based undo/redo with autosave | `Graph` |
| `Viewport` | `rendering/Viewport.js` | Camera control (pan with right mouse button) | None |
| `DomRenderer` | `rendering/DomRenderer.js` | Node DOM creation, edge SVG rendering, drag-drop | `Graph`, `Viewport` |
| `EditableTitle` | `ui/EditableTitle.js` | Click-to-edit title component | `SymbolMapper` |
| `OptimizationPanel` | `ui/OptimizationPanel.js` | Performance settings UI with benchmarking | `OPTIMIZATIONS` |
| `SymbolMapper` | `utils/SymbolMapper.js` | `$alpha` → `α` conversion | None |
| `FPSCounter` | `utils/FPSCounter.js` | requestAnimationFrame-based FPS monitoring | None |
| `OPTIMIZATIONS` | `config/Optimizations.js` | Static optimization descriptors array | None |

### Module Loading Strategy

The application uses ES6 modules with an import map defined in `amenodes.html`:

```html
<script type="importmap">
{
  "imports": {
    "./utils/SymbolMapper.js": "./utils/SymbolMapper.js",
    "./ui/EditableTitle.js": "./ui/EditableTitle.js",
    "./core/Node.js": "./core/Node.js",
    ...
  }
}
</script>
```

All relative paths resolve from the document root. When deploying, ensure the directory structure matches exactly as shown above.

### Adding a New Node Type

1. Create `nodes/YourNode.js` extending `core/Node.js`
2. Implement required methods: `getValue()`, `toJSON()`, `createDOM()`, `getMinHeight()`
3. Add factory method in `Graph.loadFrom()` deserialization switch
4. Register in `amenodes.html` import map
5. Add creation button in toolbar if needed

Example skeleton:

```javascript
import { Node } from '../core/Node.js';

export class YourNode extends Node {
  constructor(id, x, y, title, customParam) {
    super(id, 'your_type', x, y, title);
    this.customParam = customParam;
  }

  getValue() { return [this.customParam]; }

  toJSON() { return { ...super.toJSON(), customParam: this.customParam }; }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    // Add custom UI
    renderer.addHandles(div, this.id, null);
    return div;
  }
}
```

### Git Workflow for Contributors

#### Repository Setup

```bash
git clone https://github.com/inzexg-coder/Amenodes.git
cd Amenodes
git checkout -b feature/your-feature-name
```

#### Commit Convention

Use semantic commit messages:

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature or node type |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring without behavior change |
| `style:` | CSS/visual changes only |
| `docs:` | Documentation updates |
| `perf:` | Performance optimization |
| `chore:` | Build/config changes |

Examples:
```
feat: add MatrixNode for linear algebra operations
fix: resolve cycle detection in MapNode unmapped mode
perf: implement WebGL instancing for 5000+ nodes
```

#### Before Committing

1. Test all existing node types
2. Run manual FPS benchmark (open optimization panel → "Пересчитать влияние оптимизаций")
3. Ensure no regression in undo/redo functionality
4. Verify import/export compatibility with previous saves

#### Pull Request Process

1. Push to your feature branch
2. Open PR against `main` branch
3. Include description of changes and test results
4. Request review from project maintainer

#### Hotfix Deployment

For critical fixes to `amenodes.html` (the single-file distribution):

```bash
git checkout main
git pull origin main
# Apply fix
git add amenodes.html
git commit -m "hotfix: description"
git push origin main
```

### Performance Optimization Guidelines

The optimization system benchmarks each technique independently. When adding performance-related code:

1. Add entry to `config/Optimizations.js` with `impl: true` if implementable
2. Implement toggle logic in `applyOptimizations()` function
3. The benchmarking framework automatically measures FPS impact

Important: The optimization panel runs benchmarks sequentially. Each optimization is measured in isolation for accurate gain calculation.

### Contact & Support

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
```
