import { NodeFactory } from '../nodes/NodeFactory.js';
import { t } from '../i18n/LanguageManager.js';

export class SplashManager {
  constructor(app) {
    this.app = app;
    this.splashOverlay = document.getElementById('splashOverlay');
    this.appContainer = document.getElementById('appContainer');
    this.canvasSettingsModal = document.getElementById('canvasSettingsModal');
    this.gridStyle = 'dots';
    this.snapToGrid = false;
    this.gridSize = 20;
    this.backgroundColor = 'radial-gradient(circle at 20% 30%, #1a1e2c, #0a0c14)';
  }

  init() {
    const newBtn = document.getElementById('newCanvasBtn');
    const loadBtn = document.getElementById('loadCanvasBtn');
    const settingsBtn = document.getElementById('splashSettingsBtn');
    
    if (newBtn) newBtn.onclick = () => this.newCanvas();
    if (loadBtn) loadBtn.onclick = () => this.loadCanvas();
    if (settingsBtn) settingsBtn.onclick = () => this.openCanvasSettings();
    
    const closeBtn = document.getElementById('closeSettingsModal');
    const cancelBtn = document.getElementById('cancelSettings');
    const applyBtn = document.getElementById('applySettings');
    
    if (closeBtn) closeBtn.onclick = () => this.closeCanvasSettings();
    if (cancelBtn) cancelBtn.onclick = () => this.closeCanvasSettings();
    if (applyBtn) applyBtn.onclick = () => this.applyCanvasSettings();
    
    document.querySelectorAll('.color-preset').forEach(preset => {
      preset.onclick = () => {
        const bg = preset.getAttribute('data-bg');
        if (bg) this.backgroundColor = bg;
      };
    });
    
    const gridStyleSelect = document.getElementById('gridStyleSelect');
    const snapToGridCheck = document.getElementById('snapToGrid');
    const gridSizeInput = document.getElementById('gridSize');
    
    if (gridStyleSelect) gridStyleSelect.onchange = (e) => this.gridStyle = e.target.value;
    if (snapToGridCheck) snapToGridCheck.onchange = (e) => this.snapToGrid = e.target.checked;
    if (gridSizeInput) gridSizeInput.onchange = (e) => this.gridSize = parseInt(e.target.value) || 20;
  }
  
  newCanvas() {
    this.hideSplash();
    if (this.app && this.app.graph) {
      this.app.graph.nodes = [];
      this.app.graph.edges = [];
      this.app.graph.map.clear();
      this.app.graph.nextId = 1;
      this.app.graph.nextEdgeId = 1;
      
      if (this.app.viewport) {
        this.app.viewport.setOffset(0, 0);
        window.setZoom(1);
      }
      
      if (window.applyDesignQuality) {
        window.applyDesignQuality(100);
      }
      
      if (this.app.renderer) {
        this.app.renderer.render();
      }
      
      localStorage.removeItem('amenodes_autosave');
    }
  }
  
  loadCanvas() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.onchange = async (e) => {
        if (e.target.files.length) {
          const file = e.target.files[0];
          const success = await this.app.persistenceService.importFromFile(file);
          if (success) {
            this.hideSplash();
            if (this.app.renderer) {
              this.app.renderer.render();
              this.app.history.save();
            }
          }
        }
        fileInput.value = '';
      };
      fileInput.click();
    }
  }
  
  openCanvasSettings() {
    if (this.canvasSettingsModal) {
      const gridStyleSelect = document.getElementById('gridStyleSelect');
      const snapToGridCheck = document.getElementById('snapToGrid');
      const gridSizeInput = document.getElementById('gridSize');
      
      if (gridStyleSelect) gridStyleSelect.value = this.gridStyle;
      if (snapToGridCheck) snapToGridCheck.checked = this.snapToGrid;
      if (gridSizeInput) gridSizeInput.value = this.gridSize;
      
      this.canvasSettingsModal.classList.remove('hidden');
    }
  }
  
  closeCanvasSettings() {
    if (this.canvasSettingsModal) {
      this.canvasSettingsModal.classList.add('hidden');
    }
  }
  
  applyCanvasSettings() {
    const viewport = document.getElementById('viewport');
    if (viewport) {
      viewport.style.background = this.backgroundColor;
    }
    
    // Apply grid style
    this.applyGridStyle();
    
    this.closeCanvasSettings();
  }
  
  applyGridStyle() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    
    viewport.style.backgroundImage = '';
    viewport.style.backgroundSize = '';
    
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
  
  hideSplash() {
    if (this.splashOverlay) {
      this.splashOverlay.style.opacity = '0';
      setTimeout(() => {
        this.splashOverlay.style.display = 'none';
        if (this.appContainer) {
          this.appContainer.classList.remove('hidden');
        }
      }, 300);
    }
  }
}
