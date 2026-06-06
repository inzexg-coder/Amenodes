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
    import('../nodes/NodeFactory.js').then(async ({ NodeFactory }) => {
      try {
        const node = await NodeFactory.createNode(type, {
          x: 0, y: 0,
          title: type.charAt(0).toUpperCase() + type.slice(1)
        });
        if (node) {
          this.graph.addNode(node);
          this.graph.reevaluateAll();
          this.scene.addNode(node);
          this.app.updateNodeCount();
          this.app.updateEdgeCount();
          this.app.history.save();
        }
      } catch (e) {
        console.error('Failed to create node:', e);
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
    const type = node.type;
    const parts = [];
    
    // Value display (common)
    try {
      const val = node.getValue();
      if (val && val.length > 0) {
        const valStr = val.map(x => typeof x === 'number' ? x.toFixed(4) : String(x)).join(', ');
        parts.push('<div class="info-row"><span class="info-label">Value</span><span class="info-value">' + valStr.slice(0, 50) + '</span></div>');
      } else {
        parts.push('<div class="info-row"><span class="info-label">Value</span><span class="info-value dim">—</span></div>');
      }
    } catch(e) {
      parts.push('<div class="info-row"><span class="info-label">Value</span><span class="info-value dim">—</span></div>');
    }
    
    // Connection count
    const inEdges = this.graph.getIncomingEdges ? this.graph.getIncomingEdges(node.id).length : 0;
    const outEdges = this.graph.getOutgoingEdges ? this.graph.getOutgoingEdges(node.id).length : 0;
    parts.push('<div class="info-row"><span class="info-label">Connections</span><span class="info-value">IN: ' + inEdges + ' OUT: ' + outEdges + '</span></div>');
    
    // Type-specific controls
    if (type === 'number' || type === 'constant') {
      const currentVal = node.value !== undefined ? node.value : 0;
      parts.push('<div class="info-field">');
      parts.push('<label class="info-label">Value</label>');
      parts.push('<input class="info-input" id="cfgValue" type="number" step="any" value="' + currentVal + '" />');
      parts.push('</div>');
    }
    else if (type === 'calc') {
      const operations = [
        { id: 'div3', label: '÷3' },
        { id: 'div_sqrt12', label: '÷√12' },
        { id: 'quadratic_sum', label: '√Σx²' },
        { id: 'multiply_by_constant', label: '× k (2in)' },
        { id: 'sqrt_sum_sq', label: '√(a²+b²)' }
      ];
      parts.push('<div class="info-field">');
      parts.push('<label class="info-label">Operation</label>');
      parts.push('<div class="info-btn-group">');
      for (const op of operations) {
        const active = node.operation === op.id ? ' active' : '';
        parts.push('<button class="cfg-btn' + active + '" data-op="' + op.id + '">' + op.label + '</button>');
      }
      parts.push('</div></div>');
      // Result
      if (node.resultStr && node.resultStr !== '--') {
        parts.push('<div class="info-row"><span class="info-label">Result</span><span class="info-value">' + node.resultStr.slice(0, 50) + '</span></div>');
      }
    }
    else if (type === 'group') {
      const vals = node.values || [];
      parts.push('<div class="info-field">');
      parts.push('<label class="info-label">Values (' + vals.length + ')</label>');
      parts.push('<div class="info-list" id="cfgGroupList">');
      for (let i = 0; i < vals.length; i++) {
        const v = vals[i];
        parts.push('<div class="info-list-item">');
        parts.push('<span class="info-list-idx">#' + (i+1) + '</span>');
        parts.push('<input class="info-input-sm" id="cfgGVal_' + i + '" type="number" step="any" value="' + (v.val ?? 0) + '" placeholder="val" />');
        parts.push('<input class="info-input-sm" id="cfgGName_' + i + '" type="text" value="' + (v.name ?? '') + '" placeholder="name" style="flex:0.6" />');
        parts.push('<button class="info-list-del" id="cfgGDel_' + i + '">✕</button>');
        parts.push('</div>');
      }
      parts.push('</div>');
      parts.push('<button class="cfg-btn cfg-btn-add" id="cfgGroupAdd">+ Add Value</button>');
      parts.push('</div>');
    }
    else if (type === 'map') {
      const maps = node.maps || [];
      parts.push('<div class="info-field">');
      parts.push('<label class="info-label">Mappings (' + maps.length + ')</label>');
      parts.push('<div class="info-list" id="cfgMapList">');
      for (let i = 0; i < maps.length; i++) {
        const m = maps[i];
        parts.push('<div class="info-list-item">');
        parts.push('<span class="info-list-idx">#' + (i+1) + '</span>');
        parts.push('<input class="info-input-sm" id="cfgMX_' + i + '" type="number" step="any" value="' + (m.x ?? 0) + '" placeholder="from" style="flex:0.8" />');
        parts.push('<span style="color:rgba(160,140,220,0.3)">→</span>');
        parts.push('<input class="info-input-sm" id="cfgMY_' + i + '" type="number" step="any" value="' + (m.y ?? 0) + '" placeholder="to" style="flex:0.8" />');
        parts.push('<button class="info-list-del" id="cfgMDel_' + i + '">✕</button>');
        parts.push('</div>');
      }
      parts.push('</div>');
      parts.push('<button class="cfg-btn cfg-btn-add" id="cfgMapAdd">+ Add Mapping</button>');
      parts.push('</div>');
      // Unmapped mode
      parts.push('<div class="info-field">');
      parts.push('<label class="info-label">Unmapped Mode</label>');
      parts.push('<div class="info-btn-group">');
      const umodes = ['passthrough', 'drop'];
      for (const um of umodes) {
        const active = (node.unmappedMode || 'passthrough') === um ? ' active' : '';
        parts.push('<button class="cfg-btn' + active + '" data-umode="' + um + '">' + um + '</button>');
      }
      parts.push('</div></div>');
    }
    else if (type === 'output') {
      try {
        const val = node.getValue();
        if (val && val.length > 0) {
          parts.push('<div class="info-field"><div class="info-output-display">' + val.map(x => typeof x === 'number' ? x.toFixed(6) : String(x)).join('<br>') + '</div></div>');
        }
      } catch(e) {}
    }
    else if (type === 'mean' || type === 'sem') {
      try {
        const val = node.getValue();
        if (val && val.length > 0) {
          parts.push('<div class="info-row"><span class="info-label">Result</span><span class="info-value">' + val.map(x => typeof x === 'number' ? x.toFixed(6) : String(x)).join(', ') + '</span></div>');
        }
      } catch(e) {}
    }
    
    return parts.join('\n');
  }
  
  _bindNodeConfig(node) {
    this._configNode = node;
    const type = node.type;
    
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
        this.scene.refresh();
        this.graph.setDirty(true);
      };
    }
    
    // Number/Constant value
    const valInput = document.getElementById('cfgValue');
    if (valInput) {
      valInput.onchange = () => {
        node.value = parseFloat(valInput.value) || 0;
        this.graph.reevaluateAll();
        this.scene.refresh();
        this.graph.setDirty(true);
      };
    }
    
    // Calc operation
    const opBtns = document.querySelectorAll('[data-op]');
    opBtns.forEach(btn => {
      btn.onclick = () => {
        node.operation = btn.dataset.op;
        opBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.graph.reevaluateAll();
        this.scene.refresh();
        this.graph.setDirty(true);
      };
    });
    
    // Map unmapped mode
    document.querySelectorAll('[data-umode]').forEach(btn => {
      btn.onclick = () => {
        node.unmappedMode = btn.dataset.umode;
        document.querySelectorAll('[data-umode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.graph.reevaluateAll();
        this.scene.refresh();
        this.graph.setDirty(true);
      };
    });
    
    // Map add
    const mapAdd = document.getElementById('cfgMapAdd');
    if (mapAdd) {
      mapAdd.onclick = () => {
        if (!node.maps) node.maps = [];
        node.maps.push({ x: 0, y: 0 });
        this._showNodeConfig(node);
        this.graph.setDirty(true);
      };
    }
    
    // Map edits
    if (node.maps) {
      node.maps.forEach((m, idx) => {
        const xInp = document.getElementById('cfgMX_' + idx);
        if (xInp) {
          xInp.onchange = () => {
            node.maps[idx].x = parseFloat(xInp.value) || 0;
            this.graph.reevaluateAll();
            this.scene.refresh();
            this.graph.setDirty(true);
          };
        }
        const yInp = document.getElementById('cfgMY_' + idx);
        if (yInp) {
          yInp.onchange = () => {
            node.maps[idx].y = parseFloat(yInp.value) || 0;
            this.graph.reevaluateAll();
            this.scene.refresh();
            this.graph.setDirty(true);
          };
        }
        const delBtn = document.getElementById('cfgMDel_' + idx);
        if (delBtn) {
          delBtn.onclick = () => {
            node.maps.splice(idx, 1);
            this._showNodeConfig(node);
            this.graph.reevaluateAll();
            this.scene.refresh();
            this.graph.setDirty(true);
          };
        }
      });
    }
    
    // Group values
    const groupAdd = document.getElementById('cfgGroupAdd');
    if (groupAdd) {
      groupAdd.onclick = () => {
        if (!node.values) node.values = [];
        node.values.push({ val: 0, name: '' });
        this._showNodeConfig(node);
        this.graph.setDirty(true);
      };
    }
    
    // Group value changes
    if (node.values) {
      node.values.forEach((v, idx) => {
        const valInp = document.getElementById('cfgGVal_' + idx);
        if (valInp) {
          valInp.onchange = () => {
            node.values[idx].val = parseFloat(valInp.value) || 0;
            this.graph.reevaluateAll();
            this.scene.refresh();
            this.graph.setDirty(true);
          };
        }
        const nameInp = document.getElementById('cfgGName_' + idx);
        if (nameInp) {
          nameInp.onchange = () => {
            node.values[idx].name = nameInp.value;
            this.graph.setDirty(true);
          };
        }
        const delBtn = document.getElementById('cfgGDel_' + idx);
        if (delBtn) {
          delBtn.onclick = () => {
            node.values.splice(idx, 1);
            this._showNodeConfig(node);
            this.graph.reevaluateAll();
            this.scene.refresh();
            this.graph.setDirty(true);
          };
        }
      });
    }
  }
  
  updateCounts() {
    const countEl = document.getElementById('mNodeCount');
    if (countEl) {
      countEl.textContent = `${this.graph.nodes.length}`;
    }
  }
}

