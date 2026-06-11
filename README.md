# Amenodes

**2.8.1** — *Visual Programming Language for Data Analysis*

[GitHub Repository](https://github.com/inzexg-coder/Amenodes) • [Live Demo](https://amenoke.ru/amenodes.html) • [Wiki Docs](https://github.com/inzexg-coder/Amenodes/wiki)

---

## 📖 About

**Amenodes** is a node-based visual programming language built in JavaScript for data analysis and calculations. Replace cumbersome Excel spreadsheets with a flexible, visual interface powered by a rich set of mathematical tools.

### Key Features

- **Visual Node Editor** – Drag-and-drop nodes, connect them with wires, and see results update in real time.
- **Rich Node Library** – Number nodes, constants, groups, calculators (uncertainty propagation), mapping, SEM, and output displays.
- **Real-time Computation** – Automatic reevaluation when connections or values change.
- **Type System** – Smart connection validation prevents invalid links (e.g., connecting text to a number input).
- **Internationalization (i18n)** – Full support for English and Russian with an easy-to-extend translation system.
- **Performance Optimizations** – Built-in benchmarking and optimization panel with toggle switches and real-time FPS gain display.
- **Undo/Redo** – Full history with auto-save to localStorage.
- **Import/Export** – Save your graphs to `.amnk` files and load them back.
- **Pan & Zoom** – Right-click drag to pan, scroll to zoom.
- **Customizable UI** – Design quality slider to trade off visual effects for performance (up to +300% FPS).
- **Dirty State Indicator** – Visual feedback for unsaved changes: asterisk `(*)` appears next to node titles and status bar shows *"Unsaved changes"* when the graph has pending modifications.
- **Mobile & Android Support** – Full touch interaction, adaptive layout, bottom sheet node library, and native Android gestures.

![Visual Node Editor](images/canvas.png)

### Social & Templates

- **User Accounts** – Register and login to save your schemas as templates.
- **Template Library** – Publish, browse and search community-created node schemas.
- **Moderation System** – Moderators approve templates and award Creator Points.
- **Creator Points (CP)** – Earn points for approved templates, unlock visual upgrades.
- **Dynamic Color Scale** – Profile and template cards glow based on the author's CP.
- **User Profiles** – Track your CP and manage your published templates.

![User Profile](images/profile.png)

---

## 🚀 Quick Start

### Live Demo

Try Amenodes online: **[https://amenoke.ru/amenodes.html](https://amenoke.ru/amenodes.html)**

### Template Library

Browse community templates: **[https://amenoke.ru/templates.html](https://amenoke.ru/templates.html)**

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/inzexg-coder/Amenodes.git
   cd Amenodes
   ```

2. Start a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

3. Open `http://localhost:8000/amenodes.html` in your browser.

---

## 🎮 User Guide

### Creating Nodes

Click the **+** button in the toolbar or right-click on an existing node's handle to open the node menu. Select a node type — it will appear on the canvas.

### Connecting Nodes

Click and drag from a colored circle (handle) on a node to another node's handle. A line with an arrow indicates the connection. Right-click on a connection line to delete it.

### Working with Nodes

- **Edit titles** – Click on any node title to rename it.
- **Mark as important** – Right-click a node and select *"Mark IMPORTANT node"* — the node gets a blue glow.
- **Delete nodes** – Click the ✕ button in the node header.
- **Drag nodes** – Click and drag the header to move nodes around.

### Saving Changes

- **Dirty indicator** – When you modify the graph (add/remove nodes, create/delete connections, move nodes, edit values), an asterisk `(*)` appears next to each node title and the status bar shows *"Unsaved changes"*.
- **Auto-save** – The graph is automatically saved to localStorage. The dirty indicator clears after auto-save.
- **Manual save** – Click **Export** to save your graph to a `.amnk` file. The dirty indicator clears after a successful export.
- **Page title indicator** – When you have unsaved changes, the page title shows `* @Amenodes` to remind you even when the tab is inactive.

### User Account & Templates

1. **Register/Login** – Click the login button in the top-right corner.
2. **Save Template** – After creating a schema, click *"Save Template"* (appears when logged in).
3. **Wait for Moderation** – Templates are reviewed by moderators. Once approved, they appear in the public library.
4. **Earn Creator Points** – Each approved template awards CP. The more CP you have, the more your profile and templates glow.
5. **Browse Library** – Filter templates by popularity, recency, or search by name.

### Mobile & Touch Controls

| Action | Gesture |
|--------|---------|
| Select a node | Tap |
| Drag a node | Long-press, then drag |
| Create a node from library | Tap a node type in the bottom sheet |
| Pan the canvas | Two-finger drag / swipe |
| Zoom | Pinch in / out |
| Delete a node | Tap the cross that appears on selection |
| Open node library | Tap the **+** button |

---

## 🧮 Node Reference

### Available Nodes

| Node | Type | Description |
|------|------|-------------|
| **Number** | `num` | A single numeric value |
| **Constant** | `num` | A named constant (e.g., π, e) |
| **Group** | `list` | Groups inputs into a list for batch processing |
| **Calc** | `num` | Arithmetic operations: add, subtract, multiply, divide, power, sqrt, quadratic sum, multiply by constant |
| **Map** | `list` | Applies a function from one input to each element of another |
| **Mean** | `num` | Computes the mean of an array or list |
| **SEM** | `num` | Computes the standard error of the mean |
| **Output** | `auto` | Displays the final result in a formatted card |

### Data Types

| Type | Description |
|------|-------------|
| `num` | Single numeric value |
| `array` | Array of numbers |
| `uncert` | Value with uncertainty: `{ value: number, error: number }` |
| `list` | List of values |
| `wlist` | List of values with weights |
| `interval` | Range `[min, max]` |

---

## 🛠️ Project Structure

```
Amenodes/
├── amenodes.html          # Main application page
├── templates.html         # Template library page
├── profile.html           # User profile page
├── moderate.html          # Moderation panel page
├── src/
│   ├── main.js            # Entry point, app initialization
│   ├── core/
│   │   ├── Graph.js       # Graph management, evaluation
│   │   ├── Node.js        # Abstract base node class
│   │   ├── Edge.js        # Edge container
│   │   ├── DataType.js    # Type system and validation
│   │   └── History.js     # Undo/redo with autosave
│   ├── nodes/
│   │   ├── NodeFactory.js # Dynamic node instantiation
│   │   ├── registry.js    # Node type registry
│   │   ├── manifest/      # Node manifest list
│   │   └── *.js           # Individual node implementations
│   ├── renderer/
│   │   ├── DomRenderer.js # DOM rendering, drag & drop
│   │   ├── EdgeRenderer.js# SVG edge drawing
│   │   └── Viewport.js    # Pan and zoom controls
│   ├── services/
│   │   ├── EventBus.js    # Pub/sub event system
│   │   ├── BenchmarkService.js # FPS benchmarking
│   │   └── PersistenceService.js # Save/load
│   ├── ui/
│   │   ├── ContextMenu.js # Right-click context menu
│   │   ├── CustomModal.js # Alert/confirm/prompt replacement
│   │   ├── EditableTitle.js# Inline title editing
│   │   ├── LanguageSwitcher.js # Language toggle
│   │   ├── NodeMenu.js    # Add-node menu
│   │   ├── OptimizationPanel.js # Performance panel
│   │   └── ToolbarController.js # Toolbar actions
│   ├── i18n/
│   │   ├── LanguageManager.js # i18n engine
│   │   └── locales/       # Translation files
│   ├── config/
│   │   └── Optimizations.js # Performance config
│   ├── scripts/
│   │   └── splash.js      # Splash screen manager
│   └── utils/
│       ├── FPSCounter.js  # FPS measurement
│       └── SymbolMapper.js# Symbol mapping utilities
├── styles/                # CSS styles
├── docs/                  # Developer documentation
└── images/                # Screenshots and assets
```

---

## 🔧 Development

### Adding a New Node Type

1. Create a new node class in `src/nodes/` extending `Node` from `core/Node.js`.
2. Define a `metadata` object:
   ```javascript
   export const metadata = {
     type: 'myNode',
     nameKey: 'nodes.myNode',
     dataType: 'num',          // 'num' | 'array' | 'uncert' | 'list' | 'wlist' | 'interval' | 'auto'
     canHaveIncomingEdges: true,
     canHaveOutgoingEdges: true,
     allowedInputTypes: [...],
     allowedOutputTypes: [...],
     icon: 'fa-icon'
   };
   ```
3. Implement the `createDOM(graph, renderer)` method.
4. Add translation files under `src/nodes/locales/en/` and `src/nodes/locales/ru/`.
5. Register the node in `src/nodes/manifest/this-manifest.js`.

### Internationalization

- **Base translations** — UI strings in `src/i18n/locales/en.js` and `ru.js`.
- **Node translations** — Node-specific strings in `src/nodes/locales/`.
- Use `t('key')` in any component to get the current language's translation.
- Language preference is saved to `localStorage`.

### Important: Relative Imports

All dynamic imports **must** use relative paths to work in preview environments:

```javascript
// ✅ Correct — works everywhere
const module = await import(`./${nodeType}.js`);
const locale = await import(`./locales/${lang}/${name}.js`);

// ❌ Wrong — breaks in preview subfolders
const module = await import(`/src/nodes/${nodeType}.js`);
```

### Key Developer Classes

| Class | File | Purpose |
|-------|------|---------|
| `Graph` | `core/Graph.js` | Nodes, edges, evaluation |
| `Node` | `core/Node.js` | Abstract base node class |
| `NodeFactory` | `nodes/NodeFactory.js` | Node creation with i18n |
| `DataType` | `core/DataType.js` | Connection type validation |
| `History` | `core/History.js` | Undo/redo with autosave |
| `Viewport` | `renderer/Viewport.js` | Pan/zoom control |
| `DomRenderer` | `renderer/DomRenderer.js` | DOM rendering, drag handling |
| `EdgeRenderer` | `renderer/EdgeRenderer.js` | SVG edge rendering |
| `LanguageManager` | `i18n/LanguageManager.js` | i18n with subscriptions |
| `BenchmarkService` | `services/BenchmarkService.js` | Performance benchmarking |
| `OptimizationPanel` | `ui/OptimizationPanel.js` | Optimization UI with toggles |

---

### Database Schema (MySQL)

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creator_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    graph_data JSON NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

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

### Commit Convention

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature or node type |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring |
| `style:` | CSS / visual changes |
| `docs:` | Documentation updates |
| `perf:` | Performance optimization |
| `i18n:` | Translation changes |
| `chore:` | Build / config changes |

---

## 📬 Contact & Support

[![Telegram](https://img.shields.io/badge/telegram-%2300acee.svg?color=1DA1F2&style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/Amenoke)
[![GitHub](https://img.shields.io/badge/github-%2300acee.svg?color=181717&style=for-the-badge&logo=github&logoColor=white)](https://github.com/inzexg-coder)
[![Email](https://img.shields.io/badge/email-%2300acee.svg?color=EA4335&style=for-the-badge&logo=gmail&logoColor=white)](mailto:amenokeakira@gmail.com)

---

**Repository:** https://github.com/inzexg-coder/Amenodes  
**Live Demo:** https://amenoke.ru/amenodes.html  
**Template Library:** https://amenoke.ru/templates.html  
**Wiki:** https://github.com/inzexg-coder/Amenodes/wiki
