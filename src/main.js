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
import { Starfield } from './ui/Starfield.js';
import { MiniMap } from './ui/MiniMap.js';
import { SoundManager } from './ui/SoundManager.js';

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
    this.enableParticleFlow = localStorage.getItem('enable_particle_flow') !== 'false';
    this.enable3DTilt = localStorage.getItem('enable_3d_tilt') !== 'false';
    this.enableSoundEffects = localStorage.getItem('enable_sound_effects') === 'true';
    this.initStarfield();
    this.initRenderer();
    this.initHistory();
    this.initViewport();
    this.initTopToolbar();
    this.initMiniMap();
    this.initSoundManager();
    this.initPanels();
    this.initOptimizationPanel();
    this.initNodeMenu();
    this.initEvents();
    this.initI18n();
    this.initNodesAndStart();
  }
  initStarfield() {
    const canvas = document.getElementById('starfieldCanvas');
    if(canvas) { this.starfield = new Starfield(canvas); this.starfield.start(); }
  }
  initRenderer() {
    const viewportEl = document.getElementById('viewport');
    const canvasContainer = document.getElementById('canvasContainer');
    const nodesLayer = document.getElementById('nodesLayer');
    this.viewport = new Viewport(viewportEl, canvasContainer);
    this.renderer = new DomRenderer(this.graph, nodesLayer, viewportEl, this.eventBus);
    this.renderer.setViewport(this.viewport);
    this.renderer.setSnapToGrid(()=>this.snapToGrid, ()=>this.gridSize);
    this.renderer.setParticleFlowEnabled(this.enableParticleFlow);
    this.renderer.set3DTiltEnabled(this.enable3DTilt);
    this.viewport.onChange = () => {
      this.renderer.render();
      this.updateCoordIndicator();
      if(this.miniMap) this.miniMap.update();
    };
    this.renderer.onNodeSelect = (node) => {
      this.updatePropertiesPanel(node);
      if(this.propertiesPanel && node) this.propertiesPanel.classList.remove('hidden');
    };
    window._renderer = this.renderer;
  }
  initHistory() { this.history = new History(this.graph); this.renderer.setHistory(this.history); window._history = this.history; }
  initViewport() {
    let currentZoom = 1;
    const viewportEl = document.getElementById('viewport');
    const setZoom = (z, centerX=null, centerY=null) => {
      const oldZoom = currentZoom;
      currentZoom = Math.min(3, Math.max(0.3, z));
      window.currentZoom = currentZoom;
      if(centerX!==null && centerY!==null && oldZoom!==currentZoom) {
        const offset = this.viewport.getOffset();
        const rect = viewportEl.getBoundingClientRect();
        const worldX = (centerX - rect.left - offset.x) / oldZoom;
        const worldY = (centerY - rect.top - offset.y) / oldZoom;
        const newOffsetX = centerX - rect.left - worldX * currentZoom;
        const newOffsetY = centerY - rect.top - worldY * currentZoom;
        this.viewport.setOffset(newOffsetX, newOffsetY);
      } else { this.viewport.update(); }
      this.renderer.render();
      this.updateZoomIndicator();
      if(this.miniMap) this.miniMap.update();
    };
    viewportEl.addEventListener('wheel', (e) => {
      if(this.ctrlZoomOnly && !e.ctrlKey) return;
      e.preventDefault();
      let delta = e.deltaY > 0 ? -0.05 : 0.05;
      if(this.invertZoomDirection) delta = -delta;
      const newZoom = currentZoom * (1 + delta);
      setZoom(newZoom, e.clientX, e.clientY);
    }, { passive: false });
    viewportEl.addEventListener('contextmenu', (e)=>e.preventDefault());
    window.setZoom = setZoom;
    window.currentZoom = currentZoom;
    window.applyDesignQuality = (p)=>this.applyDesignQuality(p);
    this.applyCanvasSettings();
  }
  initTopToolbar() {
    const addBtn = document.getElementById('toolbarAddNode');
    const undoBtn = document.getElementById('toolbarUndo');
    const redoBtn = document.getElementById('toolbarRedo');
    const exportBtn = document.getElementById('toolbarExport');
    const importBtn = document.getElementById('toolbarImport');
    const settingsBtn = document.getElementById('toolbarSettings');
    const clearBtn = document.getElementById('toolbarClear');
    if(addBtn) addBtn.onclick = ()=>this.openNodeMenu();
    if(undoBtn) undoBtn.onclick = ()=>this.undo();
    if(redoBtn) redoBtn.onclick = ()=>this.redo();
    if(exportBtn) exportBtn.onclick = ()=>this.export();
    if(importBtn) importBtn.onclick = ()=>this.import();
    if(settingsBtn) settingsBtn.onclick = ()=>this.openCanvasSettings();
    if(clearBtn) clearBtn.onclick = ()=>this.clearStorage();
  }
  initMiniMap() {
    const container = document.getElementById('miniMap');
    if(container) {
      this.miniMap = new MiniMap(container, this.graph, this.viewport);
      this.miniMap.onNavigate = (x,y) => { this.viewport.setOffset(-x * window.currentZoom, -y * window.currentZoom); this.renderer.render(); };
    }
  }
  initSoundManager() {
    this.soundManager = new SoundManager();
    this.soundManager.setEnabled(this.enableSoundEffects);
    this.graph.onNodeAdded = ()=>{ if(this.enableSoundEffects) this.soundManager.play('connect'); };
    this.graph.onEdgeAdded = ()=>{ if(this.enableSoundEffects) this.soundManager.play('connect'); };
    this.graph.onEdgeRemoved = ()=>{ if(this.enableSoundEffects) this.soundManager.play('disconnect'); };
    this.graph.onNodeRemoved = ()=>{ if(this.enableSoundEffects) this.soundManager.play('delete'); };
  }
  initPanels() {
    const libraryPanel = document.getElementById('libraryPanel');
    const openLibraryBtn = document.getElementById('openLibraryBtn');
    const closeLibraryBtn = document.getElementById('closeLibraryBtn');
    if(openLibraryBtn && libraryPanel) {
      openLibraryBtn.onclick = ()=>libraryPanel.classList.remove('hidden');
      if(closeLibraryBtn) closeLibraryBtn.onclick = ()=>libraryPanel.classList.add('hidden');
    }
    this.propertiesPanel = document.getElementById('propertiesPanel');
    const closePropertiesBtn = document.getElementById('closePropertiesBtn');
    if(closePropertiesBtn && this.propertiesPanel) closePropertiesBtn.onclick = ()=>this.propertiesPanel.classList.add('hidden');
  }
  populateNodesLibrary() {
    const container = document.getElementById('nodesLibraryList');
    if(!container) return;
    const types = NodeFactory.getAvailableNodeTypes();
    const categories = types.filter(t=>t.isCategory===true);
    const regularNodes = types.filter(t=>!t.isCategory);
    container.innerHTML = '';
    if(regularNodes.length) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className='node-category';
      categoryDiv.innerHTML=`<div class="category-header"><i class="fas fa-microchip"></i><span>Core Nodes</span><i class="fas fa-chevron-down chevron"></i></div><div class="category-nodes"></div>`;
      const nodesContainer = categoryDiv.querySelector('.category-nodes');
      for(const nodeType of regularNodes) {
        const item = document.createElement('div');
        item.className='node-list-item';
        item.innerHTML=`<i class="fas ${nodeType.icon||'fa-circle'}"></i><span>${t(nodeType.nameKey)}</span>`;
        item.onclick = async ()=>{ await this.createNodeAtCenter(nodeType.type); };
        nodesContainer.appendChild(item);
      }
      const header = categoryDiv.querySelector('.category-header');
      header.onclick = ()=>{ header.classList.toggle('collapsed'); nodesContainer.classList.toggle('hidden'); };
      container.appendChild(categoryDiv);
    }
    for(const category of categories) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className='node-category';
      categoryDiv.innerHTML=`<div class="category-header"><i class="fas ${category.icon||'fa-folder'}"></i><span>${t(category.nameKey)}</span><i class="fas fa-chevron-down chevron"></i></div><div class="category-nodes"></div>`;
      const nodesContainer = categoryDiv.querySelector('.category-nodes');
      if(category.subnodes) {
        for(const subnode of category.subnodes) {
          const item = document.createElement('div');
          item.className='node-list-item';
          item.innerHTML=`<i class="fas fa-calculator"></i><span>${t(subnode.nameKey)}</span>`;
          item.onclick = async ()=>{ await this.createNodeAtCenter(category.type, subnode); };
          nodesContainer.appendChild(item);
        }
      }
      const header = categoryDiv.querySelector('.category-header');
      header.onclick = ()=>{ header.classList.toggle('collapsed'); nodesContainer.classList.toggle('hidden'); };
      container.appendChild(categoryDiv);
    }
  }
  initOptimizationPanel() {
    this.optPanel = new OptimizationPanel('optPanel',null,'closeOptPanel','applyOptimizationsBtn','rebenchBtn',this.benchmarkService,this.renderer,this.history);
    this.optPanel.setDesignQualityCallback((value)=>this.applyDesignQuality(value));
    this.optPanel.buildPanel(window.currentQualityValue||100);
    setTimeout(()=>this.runInitialBenchmark(),1000);
  }
  async runInitialBenchmark() { try { const result = await this.benchmarkService.runBenchmark(true); if(this.optPanel) { this.optPanel.updateGains(result.gains); this.optPanel.buildPanel(window.currentQualityValue||100); } } catch(e){} }
  initNodeMenu() { this.nodeMenu = new NodeMenu(this.graph, this.renderer, this.viewport); this.nodeMenu.init(); }
  openNodeMenu() { if(this.nodeMenu) this.nodeMenu.toggle(); }
  applyDesignQuality(percent) {
    window.currentQualityValue = percent;
    window._designQualitySaved = percent;
    document.body.classList.remove('design-quality-extreme','design-quality-1','design-quality-2');
    if(percent<=20) document.body.classList.add('design-quality-extreme');
    else if(percent<=50) document.body.classList.add('design-quality-1');
    else if(percent<=80) document.body.classList.add('design-quality-2');
    if(this.renderer) {
      this.renderer.setParticleFlowEnabled(percent>50 && this.enableParticleFlow);
      this.renderer.set3DTiltEnabled(percent>30 && this.enable3DTilt);
    }
    if(this.starfield) this.starfield.setIntensity(percent>30?0.6:0.2);
  }
  applyCanvasSettings() {
    const viewport = document.getElementById('viewport');
    if(!viewport) return;
    switch(this.gridStyle) {
      case 'dots': viewport.style.backgroundImage=`radial-gradient(circle, rgba(255,179,71,0.15) 1px, transparent 1px)`; viewport.style.backgroundSize=`${this.gridSize}px ${this.gridSize}px`; break;
      case 'lines': viewport.style.backgroundImage=`linear-gradient(to right, rgba(255,179,71,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,179,71,0.1) 1px, transparent 1px)`; viewport.style.backgroundSize=`${this.gridSize}px ${this.gridSize}px`; break;
      case 'cross': viewport.style.backgroundImage=`radial-gradient(circle, rgba(255,179,71,0.2) 2px, transparent 2px)`; viewport.style.backgroundSize=`${this.gridSize*2}px ${this.gridSize*2}px`; break;
      default: viewport.style.backgroundImage='none';
    }
  }
  openCanvasSettings() {
    const modalEl = document.getElementById('canvasSettingsModal');
    if(!modalEl) return;
    document.getElementById('snapToGrid').checked = this.snapToGrid;
    document.getElementById('ctrlZoomOnly').checked = this.ctrlZoomOnly;
    document.getElementById('invertZoomDirection').checked = this.invertZoomDirection;
    document.getElementById('gridSize').value = this.gridSize;
    document.getElementById('gridSizeValue').innerText = this.gridSize;
    document.getElementById('enableParticleFlow').checked = this.enableParticleFlow;
    document.getElementById('enable3DTilt').checked = this.enable3DTilt;
    document.getElementById('enableSoundEffects').checked = this.enableSoundEffects;
    const applyBtn = document.getElementById('applySettings');
    const closeModal = () => modalEl.classList.add('hidden');
    const saveSettings = () => {
      this.snapToGrid = document.getElementById('snapToGrid').checked;
      this.ctrlZoomOnly = document.getElementById('ctrlZoomOnly').checked;
      this.invertZoomDirection = document.getElementById('invertZoomDirection').checked;
      this.gridSize = parseInt(document.getElementById('gridSize').value);
      this.enableParticleFlow = document.getElementById('enableParticleFlow').checked;
      this.enable3DTilt = document.getElementById('enable3DTilt').checked;
      this.enableSoundEffects = document.getElementById('enableSoundEffects').checked;
      localStorage.setItem('canvas_grid_style', this.gridStyle);
      localStorage.setItem('canvas_grid_size', this.gridSize);
      localStorage.setItem('canvas_snap_to_grid', this.snapToGrid);
      localStorage.setItem('ctrl_zoom_only', this.ctrlZoomOnly);
      localStorage.setItem('invert_zoom_direction', this.invertZoomDirection);
      localStorage.setItem('enable_particle_flow', this.enableParticleFlow);
      localStorage.setItem('enable_3d_tilt', this.enable3DTilt);
      localStorage.setItem('enable_sound_effects', this.enableSoundEffects);
      if(this.renderer) {
        this.renderer.setSnapToGrid(()=>this.snapToGrid, ()=>this.gridSize);
        this.renderer.setParticleFlowEnabled(this.enableParticleFlow);
        this.renderer.set3DTiltEnabled(this.enable3DTilt);
      }
      if(this.soundManager) this.soundManager.setEnabled(this.enableSoundEffects);
      this.applyCanvasSettings();
      if(this.renderer) this.renderer.render();
      closeModal();
    };
    applyBtn.onclick = saveSettings;
    document.getElementById('closeSettingsModal').onclick = closeModal;
    document.getElementById('cancelSettings').onclick = closeModal;
    modalEl.classList.remove('hidden');
  }
  async initNodesAndStart() {
    try {
      await loadAllNodes();
      typeSystem.initFromNodeRegistry(nodeRegistry);
      this.updateUITitles();
      this.populateNodesLibrary();
      this.loadInitialState();
      this.renderer.render();
      this.initDirtyIndicator();
    } catch(err) { console.error(err); this.loadInitialState(); this.renderer.render(); this.initDirtyIndicator(); }
  }
  loadInitialState() {
    const loaded = this.persistenceService.loadFromStorage();
    this.updateNodeCount();
    this.updateEdgeCount();
    if(!loaded && this.graph.nodes.length===0) { const splash = document.getElementById('splashOverlay'); if(splash) splash.style.display='flex'; }
    else { const splash = document.getElementById('splashOverlay'); const app = document.getElementById('appContainer'); if(splash && app) { splash.style.display='none'; app.classList.remove('hidden'); } }
    if(this.miniMap) this.miniMap.update();
  }
  initDirtyIndicator() {
    const dirtySpan = document.getElementById('dirtyIndicator');
    if(!dirtySpan) return;
    if(this.graph && typeof this.graph.onDirtyChange==='function') {
      this.graph.onDirtyChange((isDirty)=>{ dirtySpan.style.display=isDirty?'inline-flex':'none'; document.title=isDirty?'* @Amenodes':'@Amenodes'; });
    }
  }
  updateNodeCount() { const el=document.getElementById('nodeCount'); if(el) el.textContent=this.graph.nodes.length; }
  updateEdgeCount() { const el=document.getElementById('edgeCount'); if(el) el.textContent=this.graph.edges.length; }
  updateZoomIndicator() { const el=document.getElementById('zoomIndicator'); if(el) el.textContent=`${Math.round((window.currentZoom||1)*100)}%`; }
  updateCoordIndicator() { const offset=this.viewport.getOffset(); const el=document.getElementById('coordIndicator'); if(el) el.textContent=`${Math.round(offset.x)}, ${Math.round(offset.y)}`; }
  async createNodeAtCenter(type, subnode=null) {
    const rect=document.getElementById('viewport').getBoundingClientRect();
    const offset=this.viewport.getOffset();
    const zoom=window.currentZoom||1;
    let x=(rect.width/2 - offset.x)/zoom -140;
    let y=(rect.height/2 - offset.y)/zoom -40;
    if(this.snapToGrid) { x=Math.round(x/this.gridSize)*this.gridSize; y=Math.round(y/this.gridSize)*this.gridSize; }
    const options={x,y};
    if(subnode) Object.assign(options,subnode);
    const node = await NodeFactory.createNode(type,options);
    if(node) { this.graph.addNode(node); this.finishNodeCreation(); }
  }
  finishNodeCreation() { this.graph.reevaluateAll(); this.graph.updateAllOutputs(); this.renderer.render(); this.history.save(); this.updateNodeCount(); this.updateEdgeCount(); if(this.miniMap) this.miniMap.update(); }
  undo() { this.history.undo(); this.renderer.render(); this.history.autoSave(); this.updateNodeCount(); this.updateEdgeCount(); if(this.miniMap) this.miniMap.update(); }
  redo() { this.history.redo(); this.renderer.render(); this.history.autoSave(); this.updateNodeCount(); this.updateEdgeCount(); if(this.miniMap) this.miniMap.update(); }
  export() { this.persistenceService.exportToFile(); }
  import() { document.getElementById('fileInput').click(); }
  async handleFileImport(event) {
    if(!event.target.files.length) return;
    const file=event.target.files[0];
    const success=await this.persistenceService.importFromFile(file);
    if(success) { this.renderer.render(); this.history.save(); this.updateNodeCount(); this.updateEdgeCount(); this.graph.clearDirty(); if(this.miniMap) this.miniMap.update(); }
    event.target.value='';
  }
  clearStorage() { modal.confirm(t('modal.clearStorageConfirm')).then((result)=>{ if(result) { localStorage.removeItem('amenodes_autosave'); modal.alert(t('modal.storageCleared')); if(this.graph) this.graph.clearDirty(); } }); }
  initEvents() {
    window.addEventListener('mousemove',(e)=>this.renderer.onGlobalMove(e));
    window.addEventListener('mouseup',(e)=>this.renderer.onGlobalUp(e));
    window.addEventListener('mousemove',(e)=>this.renderer.onGlobalMoveEdge(e));
    window.addEventListener('mouseup',(e)=>this.renderer.onGlobalUpEdge(e));
    window.addEventListener('keydown',(e)=>{
      if(e.key==='Escape') this.renderer.closeMenu();
      if(e.key==='Delete' && this.renderer.contextMenu?.currentSourceId) {
        const nodeId=this.renderer.contextMenu.currentSourceId;
        if(nodeId) { this.graph.removeNode(nodeId); this.renderer.render(); this.history.save(); this.updateNodeCount(); this.updateEdgeCount(); if(this.miniMap) this.miniMap.update(); }
      }
    });
    const fileInput=document.getElementById('fileInput');
    if(fileInput) fileInput.onchange=(e)=>this.handleFileImport(e);
  }
  initI18n() { i18n.subscribe(()=>{ this.updateUITitles(); this.populateNodesLibrary(); if(this.renderer) this.renderer.render(); }); this.updateUITitles(); }
  updateUITitles() { document.title='@Amenodes'; if(this.graph) { this.graph.reevaluateAll(); this.graph.updateAllOutputs(); } if(this.renderer) this.renderer.render(); }
  updatePropertiesPanel(node) {
    const container=document.getElementById('propertiesPanelContent');
    if(!container) return;
    if(!node) { container.innerHTML=`<div class="empty-property"><i class="fas fa-hand-pointer"></i><p>${t('editor.selectNodeToEdit')}</p></div>`; return; }
    container.innerHTML=`<div class="property-group"><div class="property-label">${t('editor.nodeType')}</div><div class="property-value">${node.type}</div></div><div class="property-group"><div class="property-label">${t('editor.id')}</div><div class="property-value">${node.id}</div></div><div class="property-group"><div class="property-label">${t('editor.position')}</div><div class="property-value">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</div></div><div class="property-group"><div class="property-label">${t('editor.connections')}</div><div class="property-value">${t('editor.inputs')}: ${this.graph.getIncomingEdges(node.id).length}<br>${t('editor.outputs')}: ${this.graph.getOutgoingEdges(node.id).length}</div></div>`;
  }
}
document.addEventListener('DOMContentLoaded',()=>{ window.app = new Application(); });
export default Application;
