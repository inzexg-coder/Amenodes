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

    // Long-press Export for Import
    (() => {
      const btn = document.getElementById('mExport');
      let timer = null;
      btn.addEventListener('touchstart', () => {
        timer = setTimeout(() => {
          timer = null;
          document.getElementById('fileInput').click();
        }, 600);
      }, { passive: true });
      btn.addEventListener('touchend', () => {
        if (timer) { clearTimeout(timer); timer = null; }
      }, { passive: true });
      btn.addEventListener('touchmove', () => {
        if (timer) { clearTimeout(timer); timer = null; }
      }, { passive: true });
    })();

    // Long-press node count for Clear Canvas
    (() => {
      const el = document.getElementById('mNodeCount');
      let timer = null;
      const action = () => {
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
      };
      el.addEventListener('touchstart', () => {
        timer = setTimeout(() => {
          timer = null;
          action();
        }, 800);
      }, { passive: true });
      el.addEventListener('touchend', () => {
        if (timer) { clearTimeout(timer); timer = null; }
      }, { passive: true });
      el.addEventListener('touchmove', () => {
        if (timer) { clearTimeout(timer); timer = null; }
      }, { passive: true });
    })();

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

    // Node selection: show config, or handle connection
    this.scene.eventBus.on('nodeSelect', (node) => {
      if (connectMode) {
        if (!connectSource) {
          connectSource = node.id;
          document.getElementById('mConnIndicator').textContent = '● Now tap target node';
        } else if (connectSource !== node.id) {
          var result = this.graph._tryEdge(connectSource, node.id);
          if (result && result.ok) {
            // Edge created
            this.graph.reevaluateAll();
            this.scene.refresh();
          } else {
            // Show error on indicator
            var ind = document.getElementById('mConnIndicator');
            if (ind) { 
              ind.textContent = '✗ ' + (result ? result.message : 'Cannot connect');
              ind.style.color = '#ff6b7a';
              setTimeout(function() { 
                ind.style.color = ''; 
                ind.textContent = '● Tap source, then target node';
              }, 2500);
            }
            // Keep connect mode active so they can retry
            return;
          }
          connectSource = null;
          connectMode = false;
          document.getElementById('mConnIndicator').classList.add('hidden');
          this.scene.controls.enableRotate = true;
        }
      } else {
        this._showNodeConfig(node);
      }
    });
    // Deselect = hide config
    this.scene.eventBus.on('nodeDeselect', () => {
      const panel = document.getElementById('nodeInfo');
      if (panel && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
        this._configNode = null;
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
    var self = this;
    import('../nodes/NodeFactory.js').then(async function(m) {
      var NodeFactory = m.NodeFactory;
      try {
        var node = await NodeFactory.createNode(type, {
          x: 0, y: 0,
          title: type.charAt(0).toUpperCase() + type.slice(1)
        });
        if (node) {
          self.graph.addNode(node);
          self.graph.reevaluateAll();
          self.scene.refresh();
          self.app.updateNodeCount();
          self.app.updateEdgeCount();
          self.app.history.save();
          // Flash feedback
          var badge = document.getElementById('mNodeCount');
          if (badge) { badge.style.color = '#b090ff'; setTimeout(function() { badge.style.color = ''; }, 300); }
        } else {
          _showErr('NodeFactory returned null');
        }
      } catch (e) {
        console.error('Failed to create node:', e);
        _showErr(e.message || String(e));
      }
    }).catch(function(e) {
      console.error('Import failed:', e);
      _showErr('Import: ' + (e.message || String(e)));
    });
    function _showErr(msg) {
      var badge = document.getElementById('mNodeCount');
      if (badge) { badge.textContent = msg.slice(0, 40); badge.style.color = '#ff6b7a'; }
    }
  }

  async _takeScreenshot() {
    const canvas = this.scene.renderer.domElement;
    const link = document.createElement('a');
    link.download = 'amenodes-screenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ---- Node config panel (shown on tap) ----
  _showNodeConfig(node) {
    const panel = document.getElementById('nodeInfo');
    if (!panel) return;
    
    // Fill header
    document.getElementById('infoTitle').textContent = node.title || node.type || 'Node';
    document.getElementById('infoType').textContent = node.type || '-';
    
    // Build dynamic config body
    const body = document.getElementById('infoConfigBody');
    if (!body) return;
    body.innerHTML = this._getNodeConfigHTML(node);
    
    // Bind dynamic controls
    this._bindNodeConfig(node);
    
    panel.classList.remove('hidden');
  }
  
  _hideNodeConfig() {
    const panel = document.getElementById('nodeInfo');
    if (panel) panel.classList.add('hidden');
    this._configNode = null;
  }
  
  _getNodeConfigHTML(node) {
    // Use node's own getConfigHTML method if available
    if (typeof node.getConfigHTML === 'function') {
      try {
        return node.getConfigHTML();
      } catch(e) {
        console.warn('getConfigHTML error:', e);
      }
    }
    // Fallback: show basic info
    var html = '';
    try {
      var val = node.getValue();
      if (val && val.length > 0) {
        var valStr = val.map(function(x) { return typeof x === 'number' ? x.toFixed(4) : String(x); }).join(', ');
        html += '<div class="info-row"><span class="info-label">Value</span><span class="info-value">' + valStr.slice(0, 50) + '</span></div>';
      } else {
        html += '<div class="info-row"><span class="info-label">Value</span><span class="info-value dim">—</span></div>';
      }
    } catch(e) {
      html += '<div class="info-row"><span class="info-label">Value</span><span class="info-value dim">—</span></div>';
    }
    return html;
  }
  
  _bindNodeConfig(node) {
    this._configNode = node;
    
    // Close button
    const closeBtn = document.getElementById('infoClose');
    if (closeBtn) {
      closeBtn._handler = () => this._hideNodeConfig();
      closeBtn.onclick = closeBtn._handler;
    }
    
    // Delete button
    const delBtn = document.getElementById('infoDelete');
    if (delBtn) {
      delBtn.onclick = () => {
        this.graph.removeNode(node.id);
        this.graph.reevaluateAll();
        this.scene.refresh();
        this.app.updateNodeCount();
        this._hideNodeConfig();
      };
    }
    
    // Important toggle
    const impBtn = document.getElementById('infoImportant');
    if (impBtn) {
      node.important = node.important || false;
      impBtn.textContent = node.important ? '★ Important' : '☆ Unimportant';
      impBtn.onclick = () => {
        node.important = !node.important;
        impBtn.textContent = node.important ? '★ Important' : '☆ Unimportant';
        this.graph.setDirty(true);
        // Rebuild scene and reselect this node so config stays open
        this.scene.refresh();
        this.scene._selectNode(node.id);
      };
    }
    
    // Delegate type-specific binding to node if available
    if (typeof node.bindConfig === 'function') {
      try {
        node.bindConfig(document, node, this.app);
      } catch(e) {
        console.warn('bindConfig error:', e);
      }
    }
    
    // ----- Type-agnostic fallback bindings -----
    // Number/Constant value
    const valInput = document.getElementById('cfgValue');
    if (valInput && typeof node.bindConfig !== 'function') {
      valInput.onchange = () => {
        node.value = parseFloat(valInput.value) || 0;
        this.graph.reevaluateAll();
        this.scene.refresh();
        this.graph.setDirty(true);
      };
    }
    
    // Calc operation (only if no custom bindConfig)
    if (typeof node.bindConfig !== 'function') {
      document.querySelectorAll('[data-op]').forEach(function(btn) {
        btn.onclick = function() {
          node.operation = this.dataset.op;
          document.querySelectorAll('[data-op]').forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          this._app.graph.reevaluateAll();
          this._app.scene.refresh();
          this._app.graph.setDirty(true);
        }.bind(btn);
        btn._app = this;
      }.bind(this));
    }
    
    // Map mode
    if (typeof node.bindConfig !== 'function') {
      document.querySelectorAll('[data-umode]').forEach(function(btn) {
        btn.onclick = function() {
          node.unmappedMode = this.dataset.umode;
          document.querySelectorAll('[data-umode]').forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          this._app.graph.reevaluateAll();
          this._app.scene.refresh();
          this._app.graph.setDirty(true);
        }.bind(btn);
        btn._app = this;
      }.bind(this));
      
      // Map add
      const mapAdd = document.getElementById('cfgMapAdd');
      if (mapAdd) {
        mapAdd.onclick = function() {
          if (!node.maps) node.maps = [];
          node.maps.push({ x: 0, y: 0 });
          this._showNodeConfig(node);
          this.graph.setDirty(true);
        }.bind(this);
      }
      
      // Map edits
      if (node.maps) {
        node.maps.forEach(function(m, idx) {
          var xInp = document.getElementById('cfgMX_' + idx);
          if (xInp) {
            xInp.onchange = function() {
              node.maps[idx].x = parseFloat(xInp.value) || 0;
              this._app.graph.reevaluateAll();
              this._app.scene.refresh();
              this._app.graph.setDirty(true);
            }.bind(xInp);
            xInp._app = this;
          }
          var yInp = document.getElementById('cfgMY_' + idx);
          if (yInp) {
            yInp.onchange = function() {
              node.maps[idx].y = parseFloat(yInp.value) || 0;
              this._app.graph.reevaluateAll();
              this._app.scene.refresh();
              this._app.graph.setDirty(true);
            }.bind(yInp);
            yInp._app = this;
          }
          var delBtn = document.getElementById('cfgMDel_' + idx);
          if (delBtn) {
            delBtn.onclick = function() {
              node.maps.splice(idx, 1);
              this._app._showNodeConfig(node);
              this._app.graph.setDirty(true);
            }.bind(delBtn);
            delBtn._app = this;
          }
        }, this);
      }
      
      // Group add
      const groupAdd = document.getElementById('cfgGroupAdd');
      if (groupAdd) {
        groupAdd.onclick = function() {
          if (!node.values) node.values = [];
          node.values.push({ val: 0, name: '' });
          this._showNodeConfig(node);
          this.graph.setDirty(true);
        }.bind(this);
      }
      
      // Group edits
      if (node.values) {
        node.values.forEach(function(v, idx) {
          var valInp = document.getElementById('cfgGVal_' + idx);
          if (valInp) {
            valInp.onchange = function() {
              node.values[idx].val = parseFloat(valInp.value) || 0;
              this._app.graph.reevaluateAll();
              this._app.scene.refresh();
              this._app.graph.setDirty(true);
            }.bind(valInp);
            valInp._app = this;
          }
          var nameInp = document.getElementById('cfgGName_' + idx);
          if (nameInp) {
            nameInp.onchange = function() {
              node.values[idx].name = nameInp.value;
              this._app.graph.setDirty(true);
            }.bind(nameInp);
            nameInp._app = this;
          }
          var delBtn = document.getElementById('cfgGDel_' + idx);
          if (delBtn) {
            delBtn.onclick = function() {
              node.values.splice(idx, 1);
              this._app._showNodeConfig(node);
              this._app.graph.reevaluateAll();
              this._app.scene.refresh();
              this._app.graph.setDirty(true);
            }.bind(delBtn);
            delBtn._app = this;
          }
        }, this);
      }
    }
  }
  
  updateCounts() {
    const countEl = document.getElementById('mNodeCount');
    if (countEl) {
      countEl.textContent = `${this.graph.nodes.length}`;
    }
  }
}

