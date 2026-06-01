import { Graph } from './core/Graph.js';
import { Viewport } from './renderer/Viewport.js';
import { DomRenderer } from './renderer/DomRenderer.js';
import { History } from './core/History.js';
import { PersistenceService } from './services/PersistenceService.js';
import { EventBus } from './services/EventBus.js';
import { FPSCounter } from './utils/FPSCounter.js';
import { OPTIMIZATIONS } from './config/Optimizations.js';
import { i18n, t } from './i18n/LanguageManager.js';
import { modal } from './ui/CustomModal.js';
import { NodeMenu } from './ui/NodeMenu.js';
import { loadAllNodes, nodeRegistry } from './nodes/registry.js';
import { typeSystem } from './core/DataType.js';
import { OptimizationPanel } from './ui/OptimizationPanel.js';
import { BenchmarkService } from './services/BenchmarkService.js';
import { NodeFactory } from './nodes/NodeFactory.js';

window.alert = (msg) => { modal.alert(msg); };
window.confirm = (msg) => modal.confirm(msg);
window.prompt = (msg, def) => modal.prompt(msg, def);

class Application {
  constructor() {
    this.graph = new Graph();
    this.eventBus = new EventBus();
    this.fpsCounter = new FPSCounter('fpsMeter');
    this.benchmarkService = new BenchmarkService(this.graph, this.fpsCounter, OPTIMIZATIONS);
    this.persistenceService = new PersistenceService(this.graph);
    this.gridStyle = localStorage.getItem('canvas_grid_style') || 'dots';
    this.gridSize = parseInt(localStorage.getItem('canvas_grid_size') || '20');
    this.snapToGrid = localStorage.getItem('canvas_snap_to_grid') === 'true';
    this.ctrlZoomOnly = localStorage.getItem('ctrl_zoom_only') === 'true';
    this.invertZoomDirection = localStorage.getItem('invert_zoom_direction') === 'true';

    this.initRenderer();
    this.initHistory();
    this.initViewport();
    this.initUI();
    this.initOptimizationPanel();
    this.initNodeMenu();
    this.initEvents();
    this.initI18n();
    this.initSidebar();
    
    this.initNodesAndStart();
  }

  initRenderer() {
    const viewportEl = document.getElementById('viewport');
    const canvasContainer = document.getElementById('canvasContainer');
    const nodesLayer = document.getElementById('nodesLayer');
    
    this.viewport = new Viewport(viewportEl, canvasContainer);
    this.renderer = new DomRenderer(this.graph, nodesLayer, viewportEl, this.eventBus);
    this.renderer.setViewport(this.viewport);
    this.renderer.setSnapToGrid(() => this.snapToGrid, () => this.gridSize);
    this.viewport.onChange = () => {
      this.renderer.render();
      this.updateCoordIndicator();
    };
    
    window._renderer = this.renderer;
  }

  initHistory() {
    this.history = new History(this.graph);
    this.renderer.setHistory(this.history);
    window._history = this.history;
  }

  initViewport() {
    let currentZoom = 1;
    const viewportEl = document.getElementById('viewport');
    
    const setZoom = (z, centerX = null, centerY = null) => {
      const oldZoom = currentZoom;
      currentZoom = Math.min(3, Math.max(0.3, z));
      window.currentZoom = currentZoom;
      
      if (centerX !== null && centerY !== null && oldZoom !== currentZoom) {
        const offset = this.viewport.getOffset();
        const rect = viewportEl.getBoundingClientRect();
        const worldX = (centerX - rect.left - offset.x) / oldZoom;
        const worldY = (centerY - rect.top - offset.y) / oldZoom;
        const newOffsetX = centerX - rect.left - worldX * currentZoom;
        const newOffsetY = centerY - rect.top - worldY * currentZoom;
        this.viewport.setOffset(newOffsetX, newOffsetY);
      } else {
        this.viewport.update();
      }
      
      this.renderer.render();
      this.updateZoomIndicator();
    };
    
    viewportEl.addEventListener('wheel', (e) => {
      if (this.ctrlZoomOnly && !e.ctrlKey) {
        return;
      }
      e.preventDefault();
      
      let delta = e.deltaY > 0 ? -0.05 : 0.05;
      if (this.invertZoomDirection) {
        delta = -delta;
      }
      
      const rect = viewportEl.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const newZoom = currentZoom * (1 + delta);
      setZoom(newZoom, mouseX, mouseY);
    }, { passive: false });
    
    viewportEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    window.setZoom = setZoom;
    window.currentZoom = currentZoom;
    window.applyDesignQuality = (p) => this.applyDesignQuality(p);
    this.applyCanvasSettings();
  }

  applyDesignQuality(percent) {
    window.currentQualityValue = percent;
    window._designQualitySaved = percent;
    document.body.classList.remove('design-quality-extreme', 'design-quality-1', 'design-quality-2');
    if (percent <= 20) document.body.classList.add('design-quality-extreme');
    else if (percent <= 50) document.body.classList.add('design-quality-1');
    else if (percent <= 80) document.body.classList.add('design-quality-2');
  }

  applyCanvasSettings() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    
    switch(this.gridStyle) {
      case 'dots':
        viewport.style.backgroundImage = `radial-gradient(circle, rgba(255, 179, 71, 0.15) 1px, transparent 1px)`;
        viewport.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        break;
      case 'lines':
        viewport.style.backgroundImage = `linear-gradient(to right, rgba(255, 179, 71, 0.1) 1px, transparent 1px),
                                          linear-gradient(to bottom, rgba(255, 179, 71, 0.1) 1px, transparent 1px)`;
        viewport.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        break;
      case 'cross':
        viewport.style.backgroundImage = `radial-gradient(circle, rgba(255, 179, 71, 0.2) 2px, transparent 2px)`;
        viewport.style.backgroundSize = `${this.gridSize * 2}px ${this.gridSize * 2}px`;
        break;
      case 'none':
        viewport.style.backgroundImage = 'none';
        break;
    }
  }

  openCanvasSettings() {
    const modalEl = document.getElementById('canvasSettingsModal');
    if (!modalEl) return;
    
    const snapToGridCheck = document.getElementById('snapToGrid');
    const ctrlZoomCheck = document.getElementById('ctrlZoomOnly');
    const invertZoomCheck = document.getElementById('invertZoomDirection');
    const gridSizeInput = document.getElementById('gridSize');
    const gridSizeValue = document.getElementById('gridSizeValue');
    const gridPreviewCanvas = document.getElementById('gridPreviewCanvas');
    
    if (snapToGridCheck) snapToGridCheck.checked = this.snapToGrid;
    if (ctrlZoomCheck) ctrlZoomCheck.checked = this.ctrlZoomOnly;
    if (invertZoomCheck) invertZoomCheck.checked = this.invertZoomDirection;
    if (gridSizeInput) gridSizeInput.value = this.gridSize;
    if (gridSizeValue) gridSizeValue.textContent = this.gridSize;
    
    const gridStyleBtns = document.querySelectorAll('.grid-style-btn');
    gridStyleBtns.forEach(btn => {
      if (btn.getAttribute('data-grid') === this.gridStyle) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    const sizePresets = document.querySelectorAll('.grid-size-presets span');
    sizePresets.forEach(preset => {
      if (parseInt(preset.getAttribute('data-size')) === this.gridSize) {
        preset.classList.add('active');
      } else {
        preset.classList.remove('active');
      }
    });
    
    if (gridPreviewCanvas) {
      gridPreviewCanvas.setAttribute('data-preview', this.gridStyle);
      gridPreviewCanvas.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
    }
    
    const handleStyleClick = (e) => {
      const btn = e.currentTarget;
      const gridVal = btn.getAttribute('data-grid');
      gridStyleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (gridPreviewCanvas) {
        gridPreviewCanvas.setAttribute('data-preview', gridVal);
      }
    };
    
    const handleSizePresetClick = (e) => {
      const preset = e.currentTarget;
      const size = parseInt(preset.getAttribute('data-size'));
      sizePresets.forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      if (gridSizeInput) gridSizeInput.value = size;
      if (gridSizeValue) gridSizeValue.textContent = size;
      if (gridPreviewCanvas) {
        const currentStyle = document.querySelector('.grid-style-btn.active')?.getAttribute('data-grid') || this.gridStyle;
        gridPreviewCanvas.setAttribute('data-preview', currentStyle);
        gridPreviewCanvas.style.backgroundSize = `${size}px ${size}px`;
      }
    };
    
    const handleGridSizeInput = (e) => {
      const size = e.target.value;
      if (gridSizeValue) gridSizeValue.textContent = size;
      if (gridPreviewCanvas) {
        const currentStyle = document.querySelector('.grid-style-btn.active')?.getAttribute('data-grid') || this.gridStyle;
        gridPreviewCanvas.setAttribute('data-preview', currentStyle);
        gridPreviewCanvas.style.backgroundSize = `${size}px ${size}px`;
      }
      sizePresets.forEach(p => p.classList.remove('active'));
    };
    
    gridStyleBtns.forEach(btn => {
      btn.removeEventListener('click', handleStyleClick);
      btn.addEventListener('click', handleStyleClick);
    });
    
    sizePresets.forEach(preset => {
      preset.removeEventListener('click', handleSizePresetClick);
      preset.addEventListener('click', handleSizePresetClick);
    });
    
    if (gridSizeInput) {
      gridSizeInput.removeEventListener('input', handleGridSizeInput);
      gridSizeInput.addEventListener('input', handleGridSizeInput);
    }
    
    this.fixToggleSwitches();
    
    modalEl.classList.remove('hidden');
  }

  closeCanvasSettings() {
    const modalEl = document.getElementById('canvasSettingsModal');
    if (modalEl) modalEl.classList.add('hidden');
  }

  fixToggleSwitches() {
    const toggleWrappers = document.querySelectorAll('.toggle-switch');
    toggleWrappers.forEach(wrapper => {
      const checkbox = wrapper.querySelector('input[type="checkbox"]');
      if (!checkbox) return;
      
      if (wrapper.hasAttribute('data-fixed')) return;
      
      const newWrapper = wrapper.cloneNode(true);
      wrapper.parentNode.replaceChild(newWrapper, wrapper);
      
      const newCheckbox = newWrapper.querySelector('input[type="checkbox"]');
      
      newWrapper.style.cursor = 'pointer';
      
      const toggleCheckbox = function(e) {
        if (e.target !== newCheckbox) {
          e.preventDefault();
          e.stopPropagation();
          newCheckbox.checked = !newCheckbox.checked;
          const changeEvent = new Event('change', { bubbles: true });
          newCheckbox.dispatchEvent(changeEvent);
        }
      };
      
      newWrapper.addEventListener('click', toggleCheckbox);
      newWrapper.setAttribute('data-fixed', 'true');
    });
  }

  initUI() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const exportBtn = document.getElementById('canvasExportBtn');
    const importBtn = document.getElementById('canvasImportBtn');
    const clearStorageBtn = document.getElementById('clearStorageBtn');
    const addNodeBtn = document.getElementById('addNodeBtn');
    const canvasSettingsBtn = document.getElementById('canvasSettingsBtn');
    const optToggleBtn = document.getElementById('optToggleBtn');
    const fileInput = document.getElementById('fileInput');
    const collapseLeft = document.getElementById('collapseLeftBtn');
    const collapseRight = document.getElementById('collapseRightBtn');
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const cancelSettings = document.getElementById('cancelSettings');
    const applySettings = document.getElementById('applySettings');
    const newCanvasBtn = document.getElementById('newCanvasBtn');
    const loadCanvasBtn = document.getElementById('loadCanvasBtn');
    const splashSettingsBtn = document.getElementById('splashSettingsBtn');
    const splashOverlay = document.getElementById('splashOverlay');
    const appContainer = document.getElementById('appContainer');
    
    if (undoBtn) undoBtn.onclick = () => this.undo();
    if (redoBtn) redoBtn.onclick = () => this.redo();
    if (exportBtn) exportBtn.onclick = () => this.export();
    if (importBtn) importBtn.onclick = () => this.import();
    if (clearStorageBtn) clearStorageBtn.onclick = () => this.clearStorage();
    if (addNodeBtn) addNodeBtn.onclick = () => this.openNodeMenu();
    if (canvasSettingsBtn) canvasSettingsBtn.onclick = () => this.openCanvasSettings();
    if (optToggleBtn) {
      optToggleBtn.onclick = () => {
        const panel = document.getElementById('optPanel');
        if (panel) panel.classList.toggle('hidden');
      };
    }
    if (fileInput) fileInput.onchange = (e) => this.handleFileImport(e);
    
    if (collapseLeft && leftSidebar) {
      collapseLeft.onclick = () => leftSidebar.classList.toggle('collapsed');
    }
    if (collapseRight && rightSidebar) {
      collapseRight.onclick = () => rightSidebar.classList.toggle('collapsed');
    }
    
    if (closeSettingsModal) closeSettingsModal.onclick = () => this.closeCanvasSettings();
    if (cancelSettings) cancelSettings.onclick = () => this.closeCanvasSettings();
    
    if (applySettings) {
      applySettings.onclick = () => {
        const snapToGridCheck = document.getElementById('snapToGrid');
        const ctrlZoomCheck = document.getElementById('ctrlZoomOnly');
        const invertZoomCheck = document.getElementById('invertZoomDirection');
        const gridSizeInput = document.getElementById('gridSize');
        const activeStyleBtn = document.querySelector('.grid-style-btn.active');
        
        if (snapToGridCheck) this.snapToGrid = snapToGridCheck.checked;
        if (ctrlZoomCheck) this.ctrlZoomOnly = ctrlZoomCheck.checked;
        if (invertZoomCheck) this.invertZoomDirection = invertZoomCheck.checked;
        if (gridSizeInput) this.gridSize = parseInt(gridSizeInput.value);
        if (activeStyleBtn) this.gridStyle = activeStyleBtn.getAttribute('data-grid');
        
        localStorage.setItem('canvas_grid_style', this.gridStyle);
        localStorage.setItem('canvas_grid_size', this.gridSize.toString());
        localStorage.setItem('canvas_snap_to_grid', this.snapToGrid.toString());
        localStorage.setItem('ctrl_zoom_only', this.ctrlZoomOnly.toString());
        localStorage.setItem('invert_zoom_direction', this.invertZoomDirection.toString());
        
        if (this.renderer) {
          this.renderer.setSnapToGrid(() => this.snapToGrid, () => this.gridSize);
        }
        
        this.applyCanvasSettings();
        if (this.renderer) this.renderer.render();
        
        this.closeCanvasSettings();
      };
    }
    
    this.fixToggleSwitches();
    
    if (newCanvasBtn) {
      newCanvasBtn.onclick = () => {
        if (this.graph) {
          this.graph.nodes = [];
          this.graph.edges = [];
          this.graph.map.clear();
          this.graph.nextId = 1;
          this.graph.nextEdgeId = 1;
          
          if (this.viewport) {
            this.viewport.setOffset(0, 0);
            window.setZoom(1);
          }
          
          if (window.applyDesignQuality) {
            window.applyDesignQuality(100);
          }
          
          if (this.renderer) {
            this.renderer.render();
          }
          
          this.updateNodeCount();
          this.updateEdgeCount();
        }
        
        if (splashOverlay && appContainer) {
          splashOverlay.style.opacity = '0';
          setTimeout(() => {
            splashOverlay.style.display = 'none';
            appContainer.classList.remove('hidden');
          }, 300);
        }
      };
    }
    
    if (loadCanvasBtn) {
      loadCanvasBtn.onclick = () => {
        const input = document.getElementById('fileInput');
        if (input) {
          input.onchange = async (e) => {
            if (e.target.files.length && this.persistenceService) {
              const file = e.target.files[0];
              const success = await this.persistenceService.importFromFile(file);
              if (success) {
                if (this.renderer) {
                  this.renderer.render();
                  if (this.history) this.history.save();
                }
                this.updateNodeCount();
                this.updateEdgeCount();
                
                if (splashOverlay && appContainer) {
                  splashOverlay.style.opacity = '0';
                  setTimeout(() => {
                    splashOverlay.style.display = 'none';
                    appContainer.classList.remove('hidden');
                  }, 300);
                }
              }
            }
            input.value = '';
          };
          input.click();
        }
      };
    }
    
    if (splashSettingsBtn) {
      splashSettingsBtn.onclick = () => this.openCanvasSettings();
    }
    
    if (splashOverlay && appContainer && this.graph && this.graph.nodes.length === 0) {
    } else if (splashOverlay && appContainer) {
      splashOverlay.style.display = 'none';
      appContainer.classList.remove('hidden');
    }
  }

  initOptimizationPanel() {
    this.optPanel = new OptimizationPanel(
      'optPanel', null, 'closeOptPanel', 'applyOptimizationsBtn', 'rebenchBtn',
      this.benchmarkService, this.renderer, this.history
    );
    this.optPanel.setDesignQualityCallback((value) => this.applyDesignQuality(value));
    this.optPanel.buildPanel(window.currentQualityValue || 100);
    
    setTimeout(() => {
      this.runInitialBenchmark();
    }, 1000);
  }

  async runInitialBenchmark() {
    try {
      const result = await this.benchmarkService.runBenchmark(true);
      if (this.optPanel) {
        this.optPanel.updateGains(result.gains);
        this.optPanel.buildPanel(window.currentQualityValue || 100);
      }
    } catch (e) {
      console.warn('Initial benchmark failed:', e);
    }
  }

  initNodeMenu() {
    this.nodeMenu = new NodeMenu(this.graph, this.renderer, this.viewport);
    this.nodeMenu.init();
  }

  openNodeMenu() {
    if (this.nodeMenu) {
      this.nodeMenu.toggle();
    }
  }

  async initNodesAndStart() {
    try {
      await loadAllNodes();
      typeSystem.initFromNodeRegistry(nodeRegistry);
      this.updateUITitles();
      this.populateNodesLibrary();
      this.loadInitialState();
      this.renderer.render();
      console.log(`[Application] Ready with ${nodeRegistry.size} node types`);
    } catch (err) {
      console.error('[Application] Failed to initialize nodes:', err);
      this.loadInitialState();
      this.renderer.render();
    }
  }
  
  populateNodesLibrary() {
    const container = document.getElementById('nodesLibraryList');
    if (!container) return;
    
    const types = NodeFactory.getAvailableNodeTypes();
    const categories = types.filter(t => t.isCategory === true);
    const regularNodes = types.filter(t => !t.isCategory);
    
    container.innerHTML = '';
    
    if (regularNodes.length) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'node-category';
      categoryDiv.innerHTML = `
        <div class="category-header">
          <i class="fas fa-microchip"></i>
          <span>Core Nodes</span>
          <i class="fas fa-chevron-down chevron"></i>
        </div>
        <div class="category-nodes"></div>
      `;
      
      const nodesContainer = categoryDiv.querySelector('.category-nodes');
      for (const nodeType of regularNodes) {
        const item = document.createElement('div');
        item.className = 'node-list-item';
        item.innerHTML = `
          <i class="fas ${nodeType.icon || 'fa-circle'}"></i>
          <span>${t(nodeType.nameKey)}</span>
        `;
        item.onclick = async () => {
          await this.createNodeAtCenter(nodeType.type);
        };
        nodesContainer.appendChild(item);
      }
      
      const header = categoryDiv.querySelector('.category-header');
      header.onclick = () => {
        header.classList.toggle('collapsed');
        nodesContainer.classList.toggle('hidden');
      };
      
      container.appendChild(categoryDiv);
    }
    
    for (const category of categories) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'node-category';
      categoryDiv.innerHTML = `
        <div class="category-header">
          <i class="fas ${category.icon || 'fa-folder'}"></i>
          <span>${t(category.nameKey)}</span>
          <i class="fas fa-chevron-down chevron"></i>
        </div>
        <div class="category-nodes"></div>
      `;
      
      const nodesContainer = categoryDiv.querySelector('.category-nodes');
      if (category.subnodes) {
        for (const subnode of category.subnodes) {
          const item = document.createElement('div');
          item.className = 'node-list-item';
          item.innerHTML = `
            <i class="fas fa-calculator"></i>
            <span>${t(subnode.nameKey)}</span>
          `;
          item.onclick = async () => {
            await this.createNodeAtCenter(category.type, subnode);
          };
          nodesContainer.appendChild(item);
        }
      }
      
      const header = categoryDiv.querySelector('.category-header');
      header.onclick = () => {
        header.classList.toggle('collapsed');
        nodesContainer.classList.toggle('hidden');
      };
      
      container.appendChild(categoryDiv);
    }
  }
  
  snapToGridValue(value) {
    if (!this.snapToGrid) return value;
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  async createNodeAtCenter(type, subnode = null) {
    const viewportRect = document.getElementById('viewport').getBoundingClientRect();
    const offset = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    
    let x = (viewportRect.width / 2 - offset.x) / zoom - 140;
    let y = (viewportRect.height / 2 - offset.y) / zoom - 40;
    
    x = this.snapToGridValue(x);
    y = this.snapToGridValue(y);
    
    const options = { x, y };
    if (subnode) Object.assign(options, subnode);
    
    const node = await NodeFactory.createNode(type, options);
    
    if (node) {
      this.graph.addNode(node);
      this.finishNodeCreation();
    }
  }
  
  finishNodeCreation() {
    this.graph.reevaluateAll();
    this.graph.updateAllOutputs();
    this.renderer.render();
    this.history.save();
    this.updateNodeCount();
    this.updateEdgeCount();
  }
  
  loadInitialState() {
    const loaded = this.persistenceService.loadFromStorage();
    this.updateNodeCount();
    this.updateEdgeCount();
    
    if (!loaded && this.graph.nodes.length === 0) {
      const splashOverlay = document.getElementById('splashOverlay');
      if (splashOverlay && splashOverlay.style.display !== 'none') {
      } else if (splashOverlay) {
        splashOverlay.style.display = 'flex';
        splashOverlay.style.opacity = '1';
      }
    } else {
      const splashOverlay = document.getElementById('splashOverlay');
      const appContainer = document.getElementById('appContainer');
      if (splashOverlay && appContainer) {
        splashOverlay.style.display = 'none';
        appContainer.classList.remove('hidden');
      }
    }
  }
  
  updateNodeCount() {
    const nodeCountEl = document.getElementById('nodeCount');
    if (nodeCountEl) {
      nodeCountEl.textContent = `${this.graph.nodes.length} nodes`;
    }
  }
  
  updateEdgeCount() {
    const edgeCountEl = document.getElementById('edgeCount');
    if (edgeCountEl) {
      edgeCountEl.textContent = `${this.graph.edges.length} connections`;
    }
  }
  
  updateZoomIndicator() {
    const zoomIndicator = document.getElementById('zoomIndicator');
    if (zoomIndicator) {
      const percent = Math.round((window.currentZoom || 1) * 100);
      zoomIndicator.textContent = `${percent}%`;
    }
  }
  
  updateCoordIndicator() {
    const indicator = document.getElementById('coordIndicator');
    if (indicator && this.viewport) {
      const offset = this.viewport.getOffset();
      indicator.textContent = `X: ${Math.round(offset.x)} | Y: ${Math.round(offset.y)}`;
    }
  }

  undo() {
    this.history.undo();
    this.renderer.render();
    this.history.autoSave();
    this.updateNodeCount();
    this.updateEdgeCount();
  }

  redo() {
    this.history.redo();
    this.renderer.render();
    this.history.autoSave();
    this.updateNodeCount();
    this.updateEdgeCount();
  }

  export() {
    this.persistenceService.exportToFile();
  }

  import() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
  }

  async handleFileImport(event) {
    if (!event.target.files.length) return;
    const file = event.target.files[0];
    const success = await this.persistenceService.importFromFile(file);
    if (success) {
      this.renderer.render();
      this.history.save();
      this.updateNodeCount();
      this.updateEdgeCount();
      this.updateZoomIndicator();
    }
    event.target.value = '';
  }

  clearStorage() {
    modal.confirm(t('modal.clearStorageConfirm')).then((result) => {
      if (result) {
        localStorage.removeItem('amenodes_autosave');
        modal.alert(t('modal.storageCleared'));
      }
    });
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMove(e));
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUp(e));
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMoveEdge(e));
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUpEdge(e));
    
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.renderer.closeMenu();
      }
      if (e.key === 'Delete' && this.renderer.contextMenu?.currentSourceId) {
        const nodeId = this.renderer.contextMenu.currentSourceId;
        if (nodeId) {
          this.graph.removeNode(nodeId);
          this.renderer.render();
          this.history.save();
          this.updateNodeCount();
          this.updateEdgeCount();
        }
      }
    });
    
    const originalRemoveNode = this.graph.removeNode.bind(this.graph);
    this.graph.removeNode = (id) => {
      originalRemoveNode(id);
      this.updateNodeCount();
      this.updateEdgeCount();
    };
    
    const originalAddEdge = this.graph.addEdge.bind(this.graph);
    this.graph.addEdge = (sourceId, targetId, port) => {
      const edge = originalAddEdge(sourceId, targetId, port);
      if (edge) this.updateEdgeCount();
      return edge;
    };
    
    const originalRemoveEdge = this.graph.removeEdge.bind(this.graph);
    this.graph.removeEdge = (id) => {
      originalRemoveEdge(id);
      this.updateEdgeCount();
    };
  }

  initI18n() {
    i18n.subscribe(() => {
      this.updateUITitles();
      this.populateNodesLibrary();
      if (this.renderer) {
        this.renderer.render();
      }
    });
    
    this.updateUITitles();
  }

  updateUITitles() {
    document.title = `@Amenodes`;
    
    if (this.graph) {
      this.graph.reevaluateAll();
      this.graph.updateAllOutputs();
    }
    
    if (this.renderer) {
      this.renderer.render();
    }
  }

  initSidebar() {
    this.renderer.onNodeSelect = (node) => {
      this.updatePropertiesPanel(node);
    };
  }
  
  updatePropertiesPanel(node) {
    const panel = document.getElementById('propertiesPanel');
    if (!panel) return;
    
    if (!node) {
      panel.innerHTML = `
        <div class="empty-property">
          <i class="fas fa-hand-pointer"></i>
          <p>Select a node to edit properties</p>
        </div>
      `;
      return;
    }
    
    panel.innerHTML = `
      <div class="property-group">
        <div class="property-label">Node Type</div>
        <div class="property-value">${node.type}</div>
      </div>
      <div class="property-group">
        <div class="property-label">ID</div>
        <div class="property-value">${node.id}</div>
      </div>
      <div class="property-group">
        <div class="property-label">Position</div>
        <div class="property-value">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</div>
      </div>
      <div class="property-group">
        <div class="property-label">Connections</div>
        <div class="property-value">
          Inputs: ${this.graph.getIncomingEdges(node.id).length}<br>
          Outputs: ${this.graph.getOutgoingEdges(node.id).length}
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Application();
});

export default Application;
