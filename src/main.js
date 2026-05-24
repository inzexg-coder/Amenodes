// main.js (restructured with welcome screen, properties panel, selection)
import { Graph } from './core/Graph.js';
import { Viewport } from './renderer/Viewport.js';
import { DomRenderer } from './renderer/DomRenderer.js';
import { History } from './core/History.js';
import { ToolbarController } from './ui/ToolbarController.js';
import { OptimizationPanel } from './ui/OptimizationPanel.js';
import { BenchmarkService } from './services/BenchmarkService.js';
import { PersistenceService } from './services/PersistenceService.js';
import { EventBus } from './services/EventBus.js';
import { FPSCounter } from './utils/FPSCounter.js';
import { OPTIMIZATIONS } from './config/Optimizations.js';
import { i18n, t } from './i18n/LanguageManager.js';
import { modal } from './ui/CustomModal.js';
import { NodeMenu } from './ui/NodeMenu.js';
import { loadAllNodes, nodeRegistry, getNodeClass } from './nodes/registry.js';
import { typeSystem } from './core/DataType.js';
import { NodeFactory } from './nodes/NodeFactory.js';

window.alert = (msg) => modal.alert(msg);
window.confirm = (msg) => modal.confirm(msg);

class Application {
  constructor() {
    this.graph = new Graph();
    this.eventBus = new EventBus();
    this.fpsCounter = new FPSCounter('fpsMeterSide');
    this.benchmarkService = new BenchmarkService(this.graph, this.fpsCounter, OPTIMIZATIONS);
    this.persistenceService = new PersistenceService(this.graph);
    this.selectedNodeId = null;

    this.initRenderer();
    this.initHistory();
    this.initViewport();
    this.initToolbar();
    this.initOptimizationPanel();
    this.initNodeMenu();
    this.initEvents();
    this.initI18n();
    this.initPropertiesUI();
    this.initCanvasSettings();
    
    this.initNodesAndStart();
  }

  initRenderer() {
    const viewportEl = document.getElementById('viewport');
    const canvasContainer = document.getElementById('canvasContainer');
    const nodesLayer = document.getElementById('nodesLayer');
    this.viewport = new Viewport(viewportEl, canvasContainer);
    this.renderer = new DomRenderer(this.graph, nodesLayer, viewportEl, this.eventBus);
    this.renderer.setViewport(this.viewport);
    this.renderer.onNodeSelected = (nodeId) => this.selectNode(nodeId);
    this.viewport.onChange = () => this.renderer.render();
    window._renderer = this.renderer;
  }

  initHistory() {
    this.history = new History(this.graph);
    this.renderer.setHistory(this.history);
  }

  initViewport() {
    let currentZoom = 1;
    const setZoom = (z) => {
      currentZoom = Math.min(3, Math.max(0.3, z));
      window.currentZoom = currentZoom;
      this.viewport.update();
      this.renderer.render();
      document.getElementById('canvasZoomSlider').value = currentZoom;
      document.getElementById('zoomValue').innerText = Math.round(currentZoom * 100) + '%';
    };
    const viewportEl = document.getElementById('viewport');
    viewportEl.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(currentZoom * (1 - e.deltaY * 0.005)); }, { passive: false });
    window.setZoom = setZoom;
    window.currentZoom = currentZoom;
    window.applyDesignQuality = (p) => this.applyDesignQuality(p);
    document.getElementById('canvasZoomSlider').oninput = (e) => setZoom(parseFloat(e.target.value));
    document.getElementById('quickRecenterBtn').onclick = () => this.viewport.setOffset(0, 0);
  }

  applyDesignQuality(percent) {
    window.currentQualityValue = percent;
    document.body.classList.remove('design-quality-extreme', 'design-quality-1', 'design-quality-2');
    if (percent <= 20) document.body.classList.add('design-quality-extreme');
    else if (percent <= 50) document.body.classList.add('design-quality-1');
    else if (percent <= 80) document.body.classList.add('design-quality-2');
  }

  initToolbar() {
    this.toolbar = new ToolbarController(this.graph, this.renderer, this.history, this.viewport, this.persistenceService);
    this.toolbar.init();
    document.getElementById('globalOptToggleBtn').onclick = () => document.getElementById('optPanel').classList.toggle('hidden');
    document.getElementById('quickNodeMenuBtn').onclick = () => this.nodeMenu?.toggle();
    document.getElementById('quickOptimizeBtn').onclick = () => document.getElementById('optPanel').classList.remove('hidden');
  }

  initOptimizationPanel() {
    this.optPanel = new OptimizationPanel('optPanel', null, 'closeOptPanel', 'applyOptimizationsBtn', 'rebenchmarkBtn', this.benchmarkService, this.renderer, this.history);
    this.optPanel.setDesignQualityCallback((v) => this.applyDesignQuality(v));
    this.optPanel.buildPanel(window.currentQualityValue || 100);
  }

  initNodeMenu() {
    this.nodeMenu = new NodeMenu(this.graph, this.renderer, this.viewport);
    this.nodeMenu.init();
  }

  initPropertiesUI() {
    document.getElementById('deleteSelectedBtn').onclick = () => {
      if (this.selectedNodeId) {
        this.graph.removeNode(this.selectedNodeId);
        this.renderer.render();
        this.history.save();
        this.selectNode(null);
      }
    };
    document.getElementById('duplicateSelectedBtn').onclick = () => {
      if (this.selectedNodeId) {
        const original = this.graph.getNode(this.selectedNodeId);
        if (original) {
          const newNode = NodeFactory.createNode(original.type, { x: original.x + 40, y: original.y + 40, title: original.title + ' copy' });
          this.graph.addNode(newNode);
          this.renderer.render();
          this.history.save();
          this.selectNode(newNode.id);
        }
      }
    };
  }

  initCanvasSettings() {
    const viewportDiv = document.getElementById('viewport');
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.onclick = () => {
        const color = opt.getAttribute('data-color');
        if (color === 'dark') viewportDiv.style.background = '#0a0c14';
        else if (color === 'light') viewportDiv.style.background = '#eef2ff';
        else viewportDiv.style.background = 'radial-gradient(circle at 20% 30%, #1a1e2c, #0a0c14)';
      };
    });
    let gridVisible = false;
    document.getElementById('toggleGridBtn').onclick = () => {
      gridVisible = !gridVisible;
      viewportDiv.style.backgroundImage = gridVisible ? 'linear-gradient(#2e385c 1px, transparent 1px), linear-gradient(90deg, #2e385c 1px, transparent 1px)' : 'none';
      viewportDiv.style.backgroundSize = gridVisible ? '40px 40px' : 'auto';
    };
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMove(e));
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUp(e));
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMoveEdge(e));
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUpEdge(e));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.renderer.closeMenu(); });
    this.eventBus.on('nodeChanged', () => this.updatePropertiesPanel());
    this.eventBus.on('graphChanged', () => this.updatePropertiesPanel());
  }

  initI18n() {
    i18n.subscribe(() => { this.updateUITitles(); this.renderer.render(); });
    this.updateUITitles();
  }

  updateUITitles() { document.title = `Amenodes`; }

  async initNodesAndStart() {
    await loadAllNodes();
    typeSystem.initFromNodeRegistry(nodeRegistry);
    const hasAutosave = localStorage.getItem('amenodes_autosave');
    if (hasAutosave) {
      this.persistenceService.loadFromStorage();
      this.renderer.render();
      this.history.save();
      this.hideWelcome();
    } else {
      this.showWelcomeScreen();
    }
    this.renderer.render();
  }

  showWelcomeScreen() {
    const overlay = document.getElementById('welcomeOverlay');
    overlay.style.display = 'flex';
    document.getElementById('welcomeNewProject').onclick = () => { this.newEmptyProject(); this.hideWelcome(); };
    document.getElementById('welcomeLoadSample').onclick = () => { this.loadExample(); this.hideWelcome(); };
    document.getElementById('welcomeImport').onclick = () => { document.getElementById('importBtn').click(); this.hideWelcome(); };
  }

  hideWelcome() { document.getElementById('welcomeOverlay').style.display = 'none'; }

  newEmptyProject() {
    this.graph.nodes = []; this.graph.edges = []; this.graph.map.clear();
    this.graph.nextId = 1; this.graph.nextEdgeId = 1;
    this.renderer.render();
    this.history.save();
    this.selectNode(null);
  }

  loadExample() {
    this.newEmptyProject();
    const NumberClass = getNodeClass('number');
    const OutputClass = getNodeClass('output');
    if (NumberClass && OutputClass) {
      const num = new NumberClass(null, 200, 200, 'Example', { val: 42 });
      const out = new OutputClass(null, 500, 200, 'Output', { rows: [] });
      this.graph.addNode(num);
      this.graph.addNode(out);
      this.graph.addEdge(num.id, out.id);
      this.renderer.render();
      this.history.save();
    }
  }

  selectNode(nodeId) {
    if (this.selectedNodeId === nodeId) return;
    this.selectedNodeId = nodeId;
    this.updatePropertiesPanel();
    if (this.renderer) this.renderer.render(); // re-render to update selection style
  }

  updatePropertiesPanel() {
    const container = document.getElementById('propertiesPanel');
    if (!container) return;
    if (!this.selectedNodeId) {
      container.innerHTML = `<div class="empty-props"><i class="fas fa-mouse-pointer"></i><p>Select a node to edit properties</p></div>`;
      return;
    }
    const node = this.graph.getNode(this.selectedNodeId);
    if (!node) return;
    
    let html = `<div class="property-row"><div class="property-label">Title</div><input class="property-input" id="propTitle" value="${escapeHtml(node.title)}"></div>`;
    html += `<div class="property-row"><div class="property-label">Type</div><div class="property-value">${node.type}</div></div>`;
    
    if (node.type === 'number') {
      html += `<div class="property-row"><div class="property-label">Value</div><input type="number" step="any" id="propNumber" class="property-input" value="${node.value}"></div>`;
    } else if (node.type === 'constant') {
      html += `<div class="property-row"><div class="property-label">Constant</div><div class="property-value">${node.value}</div></div>`;
    } else if (node.type === 'group') {
      html += `<div class="property-row"><div class="property-label">Items</div><div class="property-value">${node.values.length} values</div></div>`;
    } else if (node.type === 'map') {
      html += `<div class="property-row"><div class="property-label">Mappings</div><div class="property-value">${node.maps.length} rules</div></div>`;
    } else {
      html += `<div class="property-row"><div class="property-label">Read-only node</div><div class="property-value">edit inline</div></div>`;
    }
    container.innerHTML = html;
    const titleInput = document.getElementById('propTitle');
    if (titleInput) titleInput.onchange = (e) => { node.title = e.target.value; node.originalTitle = e.target.value; this.renderer.render(); this.history.save(); this.updatePropertiesPanel(); };
    if (node.type === 'number') {
      const numInput = document.getElementById('propNumber');
      if (numInput) numInput.onchange = (e) => { node.value = parseFloat(e.target.value); this.graph.reevaluateAll(); this.renderer.render(); this.history.save(); };
    }
  }
}

function escapeHtml(str) { return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m;}); }

document.addEventListener('DOMContentLoaded', () => { window.app = new Application(); });
export default Application;
