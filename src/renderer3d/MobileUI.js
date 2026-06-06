/**
 * MobileUI - Bottom toolbar and touch-friendly interface
 */
export class MobileUI {
  constructor(app, scene3d, graph) {
    this.app = app;
    this.scene = scene3d;
    this.graph = graph;
    this.container = null;
    this.nodeMenuVisible = false;
  }

  createDOM() {
    // Create bottom toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'mobile-toolbar';
    toolbar.innerHTML = `
      <button class="mobile-btn" id="mAddNode" title="Add Node">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
      <button class="mobile-btn" id="mConnections" title="Connections">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="18" cy="12" r="3"/>
          <circle cx="12" cy="18" r="3"/>
          <line x1="9" y1="7" x2="15" y2="11"/>
          <line x1="9" y1="9" x2="13" y2="16"/>
        </svg>
      </button>
      <button class="mobile-btn" id="mAutoRotate" title="Auto Rotate">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </button>
      <button class="mobile-btn" id="mExport" title="Export">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    `;
    document.body.appendChild(toolbar);
    this.container = toolbar;

    // Create node type menu (initially hidden)
    const nodeMenu = document.createElement('div');
    nodeMenu.className = 'mobile-node-menu hidden';
    nodeMenu.id = 'mobileNodeMenu';
    nodeMenu.innerHTML = this._getNodeTypesHTML();
    document.body.appendChild(nodeMenu);

    // Create connection mode indicator
    const connIndicator = document.createElement('div');
    connIndicator.className = 'mobile-conn-mode hidden';
    connIndicator.id = 'mConnIndicator';
    connIndicator.textContent = '● Tap source, then target node';
    document.body.appendChild(connIndicator);

    // Action sheet created in _setupHiddenMenu()

    this._bindEvents();
  }

  _getNodeTypesHTML() {
    return `
      <div class="node-menu-header">Choose Node Type</div>
      <div class="node-types-grid">
        <button class="type-btn" data-type="number">
          <span class="type-icon" style="color:#9060ff">✦</span>
          <span class="type-name">Number</span>
        </button>
        <button class="type-btn" data-type="constant">
          <span class="type-icon" style="color:#8060ff">◆</span>
          <span class="type-name">Constant</span>
        </button>
        <button class="type-btn" data-type="calc">
          <span class="type-icon" style="color:#e040a0">⚡</span>
          <span class="type-name">Calculator</span>
        </button>
        <button class="type-btn" data-type="mean">
          <span class="type-icon" style="color:#d040b0">μ</span>
          <span class="type-name">Mean</span>
        </button>
        <button class="type-btn" data-type="sem">
          <span class="type-icon" style="color:#c040c0">σ</span>
          <span class="type-name">SEM</span>
        </button>
        <button class="type-btn" data-type="output">
          <span class="type-icon" style="color:#4090ff">◎</span>
          <span class="type-name">Output</span>
        </button>
        <button class="type-btn" data-type="map">
          <span class="type-icon" style="color:#40d090">⊞</span>
          <span class="type-name">Map</span>
        </button>
        <button class="type-btn" data-type="group">
          <span class="type-icon" style="color:#30b080">⊟</span>
          <span class="type-name">Group</span>
        </button>
      </div>
    `;
  }

  _bindEvents() {
    // Add Node
    document.getElementById('mAddNode').addEventListener('click', () => {
      this._toggleNodeMenu();
    });

    // Toggle Connections
    let connectMode = false;
    let connectSource = null;
    document.getElementById('mConnections').addEventListener('click', () => {
      connectMode = !connectMode;
      document.getElementById('mConnIndicator').classList.toggle('hidden', !connectMode);
      if (!connectMode) {
        connectSource = null;
        document.getElementById('mConnIndicator').textContent = '● Tap source, then target node';
      }
      this.scene.controls.enableRotate = !connectMode;
    });

    // Auto Rotate toggle
    document.getElementById('mAutoRotate').addEventListener('click', () => {
      this.scene.toggleAutoRotate();
      const btn = document.getElementById('mAutoRotate');
      btn.classList.toggle('active');
    });

    // Export
    document.getElementById('mExport').addEventListener('click', () => {
      this.app.export();
    });

    // Hidden menu: long-press on status badge triggers it
    // (handled separately below)



    // Node type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this._addNodeOfType(type);
        this._hideNodeMenu();
      });
    });

    // Close node menu on overlay click
    document.getElementById('mobileNodeMenu').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this._hideNodeMenu();
      }
    });



    // Hidden action sheet (opened via long-press on status badge)
    // Create it but don't attach to any visible button
    this._setupHiddenMenu();

    // Connect mode handler (tap two nodes)
    this.scene.eventBus.on('nodeSelect', (node) => {
      if (connectMode) {
        if (!connectSource) {
          connectSource = node.id;
          document.getElementById('mConnIndicator').textContent = '● Now tap target node';
        } else if (connectSource !== node.id) {
          const edge = this.graph.addEdge(connectSource, node.id);
          if (edge) {
            this.graph.reevaluateAll();
            this.scene.refresh();
          }
          connectSource = null;
          connectMode = false;
          document.getElementById('mConnIndicator').classList.add('hidden');
          this.scene.controls.enableRotate = true;
        }
      }
    });
  }

  _toggleNodeMenu() {
    const menu = document.getElementById('mobileNodeMenu');
    this.nodeMenuVisible = !this.nodeMenuVisible;
    menu.classList.toggle('hidden', !this.nodeMenuVisible);
  }

  _hideNodeMenu() {
    document.getElementById('mobileNodeMenu').classList.add('hidden');
    this.nodeMenuVisible = false;
  }

  _setupHiddenMenu() {
    // Create action sheet (hidden, triggered by long-press)
    const sheet = document.createElement('div');
    sheet.className = 'mobile-action-sheet hidden';
    sheet.id = 'mActionSheet';
    sheet.innerHTML = `
      <div class="action-sheet-content">
        <button class="action-btn" data-action="import">📂 Import</button>
        <button class="action-btn" data-action="clear">🗑️ Clear Canvas</button>
        <button class="action-btn" data-action="screenshot">📸 Screenshot</button>
        <button class="action-btn" data-action="settings">⚙️ Settings</button>
        <button class="action-btn" data-action="close">Cancel</button>
      </div>
    `;
    document.body.appendChild(sheet);

    // Long-press on status badge to open hidden menu
    const statusEl = document.getElementById('mNodeCount');
    if (statusEl) {
      let pressTimer = null;
      statusEl.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          document.getElementById('mActionSheet').classList.remove('hidden');
        }, 600);
      }, { passive: true });
      statusEl.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      }, { passive: true });
      statusEl.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
      }, { passive: true });
    }

    // Close on overlay click
    sheet.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        sheet.classList.add('hidden');
      }
    });

    // Action buttons inside sheet
    sheet.addEventListener('click', (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      sheet.classList.add('hidden');
      switch (action) {
        case 'import':
          this.app.import();
          break;
        case 'clear':
          if (confirm('Clear all nodes?')) {
            this.graph.nodes = [];
            this.graph.edges = [];
            this.graph.map.clear();
            this.graph.nextId = 1;
            this.graph.setDirty(true);
            this.scene.refresh();
            this.app.updateNodeCount();
            this.app.updateEdgeCount();
          }
          break;
        case 'screenshot':
          this._takeScreenshot();
          break;
        case 'settings':
          this.app.openSettings();
          break;
        case 'close':
          break;
      }
    });
  }

  _addNodeOfType(type) {
    // Dynamic import since NodeFactory is not available at class init
    import('../nodes/NodeFactory.js').then(({ NodeFactory }) => {
      const node = NodeFactory.createNode(type, 0, 0,
        type.charAt(0).toUpperCase() + type.slice(1));
      if (node) {
        this.graph.addNode(node);
        this.graph.reevaluateAll();
        this.scene.addNode(node);
        this.app.updateNodeCount();
        this.app.updateEdgeCount();
        this.app.history.save();
      }
    });
  }

  async _takeScreenshot() {
    const canvas = this.scene.renderer.domElement;
    const link = document.createElement('a');
    link.download = 'amenodes-screenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  updateCounts() {
    const countEl = document.getElementById('mNodeCount');
    if (countEl) {
      countEl.textContent = `${this.graph.nodes.length}`;
    }
  }
}

