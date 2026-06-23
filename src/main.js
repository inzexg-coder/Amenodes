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
window.typeSystem = typeSystem;
import { OptimizationPanel } from './ui/OptimizationPanel.js';
import { BenchmarkService } from './services/BenchmarkService.js';
import { NodeFactory } from './nodes/NodeFactory.js';

window.alert = (msg) => { modal.alert(msg); };
window.confirm = (msg) => modal.confirm(msg);
window.prompt = (msg, def) => modal.prompt(msg, def);

var PREMIUM_ACCENT = '#a78bfa';
var PREMIUM_ACCENT_DARK = '#6d28d9';
var PREMIUM_ACCENT_RGB = '167, 139, 250';
var ORANGE_ACCENT = '#ffb347';
var ORANGE_ACCENT_DARK = '#d48f30';
var ORANGE_ACCENT_RGB = '255, 179, 71';

function isPremiumTheme() {
    return localStorage.getItem('premium_purple_accent') === 'true';
}

function premiumColor(orangeVal, purpleVal) {
    return isPremiumTheme() ? purpleVal : orangeVal;
}

window.__premiumAccent = function() {
    return localStorage.getItem('premium_purple_accent') === 'true' ? '#a78bfa' : '#ffb347';
};
window.__premiumAccentRGB = function() {
    return localStorage.getItem('premium_purple_accent') === 'true' ? '167, 139, 250' : '255, 179, 71';
};

function refreshPremiumTheme() {
    var isPurple = localStorage.getItem('premium_purple_accent') === 'true';
    document.body.classList.toggle('premium-purple', isPurple);
    
    document.body.classList.toggle('premium-hover', isPurple);
    
    var edgeWave = localStorage.getItem('premium_edge_wave') === 'true';
    document.body.classList.toggle('premium-edge-wave', edgeWave);
    console.log('[Premium] Theme purple:', isPurple, 'hover:', isPurple, 'edgeWave:', edgeWave);
    
    document.body.style.transform = 'translateZ(0)';
    requestAnimationFrame(function() {
        document.body.style.transform = '';
    });
}

(function() {
    if (localStorage.getItem('premium_purple_accent') === 'true') {
        document.body.classList.add('premium-purple');
        
        var s = document.createElement('style');
        s.textContent = '.premium-force{--accent:#a78bfa;--accent-dark:#6d28d9;--accent-rgb:167,139,250;--accent-gradient:linear-gradient(135deg,#a78bfa,#7c3aed)}';
        document.head.appendChild(s);
    }
})();

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
    const savedSpeed = parseInt(localStorage.getItem("anim_speed") || "100");
    window._nodeAnimSpeed = savedSpeed;
    const sec = savedSpeed / 1000;
    document.body.style.setProperty("--transition", sec > 0 ? `all ${sec}s ease` : "none");

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
    this.renderer.inertiaEnabled = () => localStorage.getItem('premium_overshoot_bounce') === 'true';
    this.renderer.magneticNodesEnabled = () => {
      if (localStorage.getItem('amenodes_premium') !== 'true') return false;
      return localStorage.getItem('premium_magnetic_nodes') === 'true';
    };
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
    document.body.classList.remove("design-quality-extreme", "design-quality-1", "design-quality-2");
    if (percent <= 20) document.body.classList.add("design-quality-extreme");
    else if (percent <= 50) document.body.classList.add("design-quality-1");
    else if (percent <= 80) document.body.classList.add("design-quality-2");
    var as = window._nodeAnimSpeed;
    if (as === undefined) as = 100;
    var sec = as / 1000;
    var easing = "ease";
    if (localStorage.getItem('premium_overshoot_bounce') === 'true') {
      easing = "cubic-bezier(0.22, 2.2, 0.4, 1)";
    }
    document.body.style.setProperty("--transition", sec > 0 ? "all " + sec + "s " + easing : "none");
  }

  applyCanvasSettings() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    switch(this.gridStyle) {
      case 'dots':
        viewport.style.backgroundImage = `radial-gradient(circle, rgba(var(--accent-rgb), 0.15) 1px, transparent 1px)`;
        viewport.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        break;
      case 'lines':
        viewport.style.backgroundImage = `linear-gradient(to right, rgba(var(--accent-rgb), 0.1) 1px, transparent 1px),
                                          linear-gradient(to bottom, rgba(var(--accent-rgb), 0.1) 1px, transparent 1px)`;
        viewport.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        break;
      case 'cross':
        viewport.style.backgroundImage = `radial-gradient(circle, rgba(var(--accent-rgb), 0.2) 2px, transparent 2px)`;
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
    const animSpeedInput = document.getElementById("animSpeed");
    const animSpeedValue = document.getElementById("animSpeedValue");
    const currentSpeed = window._nodeAnimSpeed !== undefined ? window._nodeAnimSpeed : 100;
    if (animSpeedInput) animSpeedInput.value = currentSpeed;
    if (animSpeedValue) animSpeedValue.textContent = currentSpeed;

    const premiumTab = document.querySelector('.premium-tab');
    const premiumContent = document.querySelector('.premium-tab-content');
    const isPremium = localStorage.getItem('amenodes_premium') === 'true';
    if (premiumTab) premiumTab.style.display = isPremium ? 'block' : 'none';

    if (isPremium && localStorage.getItem('premium_purple_accent') === null) {
      localStorage.setItem('premium_purple_accent', 'true');
    }
    refreshPremiumTheme();

    const overshootCheck = document.getElementById('premiumOvershoot');
    if (overshootCheck) {
      const saved = localStorage.getItem('premium_overshoot_bounce');
      overshootCheck.checked = saved === 'true';
    }
    const purpleCheck = document.getElementById('premiumPurple');
    if (purpleCheck) {
      const saved = localStorage.getItem('premium_purple_accent');
      purpleCheck.checked = saved === 'true';
    }
    const edgeWaveCheck = document.getElementById('premiumEdgeWave');
    if (edgeWaveCheck) {
      const saved = localStorage.getItem('premium_edge_wave');
      edgeWaveCheck.checked = saved === 'true';
    }
    const magneticCheck = document.getElementById('premiumMagneticNodes');
    if (magneticCheck) {
      const saved = localStorage.getItem('premium_magnetic_nodes');
      magneticCheck.checked = saved === 'true';
    }
    const particleTrailCheck = document.getElementById('premiumParticleTrail');
    if (particleTrailCheck) {
      const saved = localStorage.getItem('premium_particle_trail');
      particleTrailCheck.checked = saved === 'true';
    }
    // Read cursor settings
    const cursorStyleEl = document.getElementById('cursorStyle');
    if (cursorStyleEl) {
      cursorStyleEl.value = localStorage.getItem('cursor_style') || 'crosshair';
    }
    const cursorSizeEl = document.getElementById('cursorSize');
    const cursorSizeLabel = document.getElementById('cursorSizeLabel');
    if (cursorSizeEl) {
      cursorSizeEl.value = localStorage.getItem('cursor_size') || '24';
      if (cursorSizeLabel) cursorSizeLabel.textContent = cursorSizeEl.value;
    }
    const cursorEffectEl = document.getElementById('cursorEffect');
    if (cursorEffectEl) {
      cursorEffectEl.value = localStorage.getItem('cursor_effect') || 'none';
    }
    this._updateDragCursor();

    // Live cursor preview on settings change
    const cursorStyleEl = document.getElementById('cursorStyle');
    const cursorSizeEl = document.getElementById('cursorSize');
    const cursorSizeLabel = document.getElementById('cursorSizeLabel');
    const cursorEffectEl = document.getElementById('cursorEffect');
    function onCursorSettingChange() {
      if (cursorSizeEl && cursorSizeLabel) cursorSizeLabel.textContent = cursorSizeEl.value;
      if (window.app && window.app._updateDragCursor) window.app._updateDragCursor();
    }
    if (cursorStyleEl) cursorStyleEl.addEventListener('change', onCursorSettingChange);
    if (cursorSizeEl) cursorSizeEl.addEventListener('input', onCursorSettingChange);
    if (cursorEffectEl) cursorEffectEl.addEventListener('change', onCursorSettingChange);

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

    const handleAnimSpeedInput = (e) => {
      const speed = e.target.value;
      if (animSpeedValue) animSpeedValue.textContent = speed;
    };

    if (animSpeedInput) {
      animSpeedInput.removeEventListener("input", handleAnimSpeedInput);
      animSpeedInput.addEventListener("input", handleAnimSpeedInput);
    }

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

    const settingsTabs = document.querySelectorAll(".settings-tab");
    const settingsTabContents = document.querySelectorAll(".settings-tab-content");
    const handleTabClick = (e) => {
      const tab = e.currentTarget;
      const tabName = tab.getAttribute("data-tab");
      settingsTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      settingsTabContents.forEach(c => {
        c.classList.remove("active");
        if (c.getAttribute("data-tab") === tabName) {
          c.classList.add("active");
        }
      });
    };
    settingsTabs.forEach(tab => {
      tab.removeEventListener("click", handleTabClick);
      tab.addEventListener("click", handleTabClick);
    });
    this.fixToggleSwitches();

    modalEl.classList.remove('hidden');
  }

  closeCanvasSettings() {
    const modalEl = document.getElementById('canvasSettingsModal');
    if (modalEl) modalEl.classList.add('hidden');
    document.body.style.overflow = '';
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
        const animSpeedInput = document.getElementById("animSpeed");
        if (animSpeedInput) {
          const speed = parseInt(animSpeedInput.value);
          window._nodeAnimSpeed = speed;
          const seconds = speed / 1000;
          var easing = "ease";
          if (localStorage.getItem('premium_overshoot_bounce') === 'true') {
            easing = "cubic-bezier(0.22, 2.2, 0.4, 1)";
          }
          document.body.style.setProperty("--transition", seconds > 0 ? `all ${seconds}s ${easing}` : "none");
          localStorage.setItem("anim_speed", speed.toString());
        }
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

        const overshootCheck = document.getElementById('premiumOvershoot');
        if (overshootCheck) {
          localStorage.setItem('premium_overshoot_bounce', overshootCheck.checked.toString());
        }
        const purpleCheck = document.getElementById('premiumPurple');
        if (purpleCheck) {
          localStorage.setItem('premium_purple_accent', purpleCheck.checked.toString());
          refreshPremiumTheme();
        }
        const edgeWaveCheck = document.getElementById('premiumEdgeWave');
        if (edgeWaveCheck) {
          localStorage.setItem('premium_edge_wave', edgeWaveCheck.checked.toString());
          refreshPremiumTheme();
        }
        const magneticCheck = document.getElementById('premiumMagneticNodes');
        if (magneticCheck) {
          localStorage.setItem('premium_magnetic_nodes', magneticCheck.checked.toString());
        }
        const particleTrailCheck = document.getElementById('premiumParticleTrail');
        if (particleTrailCheck) {
          localStorage.setItem('premium_particle_trail', particleTrailCheck.checked.toString());
        }
        const cursorStyleEl = document.getElementById('cursorStyle');
        if (cursorStyleEl) {
          localStorage.setItem('cursor_style', cursorStyleEl.value);
        }
        const cursorSizeEl = document.getElementById('cursorSize');
        if (cursorSizeEl) {
          localStorage.setItem('cursor_size', cursorSizeEl.value);
        }
        const cursorEffectEl = document.getElementById('cursorEffect');
        if (cursorEffectEl) {
          localStorage.setItem('cursor_effect', cursorEffectEl.value);
        }
        this._updateDragCursor();

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
          this.graph.clearDirty();
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
                this.graph.clearDirty();

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
      this.initDirtyIndicator();
      console.log(`[Application] Ready with ${nodeRegistry.size} node types`);
    } catch (err) {
      console.error('[Application] Failed to initialize nodes:', err);
      this.loadInitialState();
      this.renderer.render();
      this.initDirtyIndicator();
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
        item.setAttribute('data-type', nodeType.type);
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
        item.setAttribute('data-type', category.type);
        item.setAttribute('data-subnode', subnode.nameKey || '');
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

  _updateDragCursor() {
    const style = localStorage.getItem('cursor_style') || 'crosshair';
    const size = parseInt(localStorage.getItem('cursor_size') || '24');
    const effect = localStorage.getItem('cursor_effect') || 'none';

    if (style === 'crosshair') {
      document.documentElement.style.removeProperty('--drag-cursor');
      return;
    }

    // Get accent color from CSS variable
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ffb347';

    const svg = this._generateCursorSVG(style, size, effect, accent);
    const encoded = encodeURIComponent(svg);
    const hotspot = Math.floor(size / 2);
    const dataUri = "url('data:image/svg+xml," + encoded + "') " + hotspot + " " + hotspot + ", crosshair";
    document.documentElement.style.setProperty('--drag-cursor', dataUri);
  }

  _generateCursorSVG(style, size, effect, color) {
    var r = size / 2;
    var inner = Math.max(3, size / 4);
    var strokeW = Math.max(1, size / 12);
    var filterStr = '';
    var filterId = 'g';

    if (effect === 'glow') {
      filterStr = '<defs><filter id="' + filterId + '"><feGaussianBlur stdDeviation="' + (size / 16) + '" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    }

    var filterAttr = effect === 'glow' ? ' filter="url(#' + filterId + ')"' : '';

    var innerSvg = '';
    if (style === 'dot') {
      innerSvg = '<circle cx="' + r + '" cy="' + r + '" r="' + inner + '" fill="' + color + '"' + filterAttr + '/>';
    } else if (style === 'ring') {
      innerSvg = '<circle cx="' + r + '" cy="' + r + '" r="' + (inner + 2) + '" fill="none" stroke="' + color + '" stroke-width="' + strokeW + '"' + filterAttr + '/>';
    } else if (style === 'sniper') {
      innerSvg = ''
        + '<circle cx="' + r + '" cy="' + r + '" r="' + inner + '" fill="none" stroke="' + color + '" stroke-width="' + strokeW + '"' + filterAttr + '/>'
        + '<line x1="' + r + '" y1="2" x2="' + r + '" y2="' + (size - 2) + '" stroke="' + color + '" stroke-width="' + (strokeW * 0.6) + '"' + filterAttr + '/>'
        + '<line x1="2" y1="' + r + '" x2="' + (size - 2) + '" y2="' + r + '" stroke="' + color + '" stroke-width="' + (strokeW * 0.6) + '"' + filterAttr + '/>'
        + '<circle cx="' + r + '" cy="' + r + '" r="1.5" fill="' + color + '"/>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + filterStr + innerSvg + '</svg>';
  }

  initDirtyIndicator() {
    const dirtySpan = document.getElementById('dirtyIndicator');
    if (!dirtySpan) return;

    dirtySpan.style.display = 'none';

    if (this.graph && typeof this.graph.onDirtyChange === 'function') {
      this.graph.onDirtyChange((isDirty) => {
        dirtySpan.style.display = isDirty ? 'inline-flex' : 'none';

        if (isDirty) {
          if (!document.title.startsWith('* ')) {
            document.title = '* ' + document.title;
          }
        } else {
          if (document.title.startsWith('* ')) {
            document.title = document.title.substring(2);
          }
        }
      });
    }
  }

  updateNodeCount() {
    const nodeCountEl = document.getElementById('nodeCount');
    if (nodeCountEl) {
      nodeCountEl.textContent = `${this.graph.nodes.length} ${t('editor.nodeCount')}`;
    }
  }

  updateEdgeCount() {
    const edgeCountEl = document.getElementById('edgeCount');
    if (edgeCountEl) {
      edgeCountEl.textContent = `${this.graph.edges.length} ${t('editor.edgeCount')}`;
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
      this.graph.clearDirty();
    }
    event.target.value = '';
  }

  clearStorage() {
    modal.confirm(t('modal.clearStorageConfirm')).then((result) => {
      if (result) {
        localStorage.removeItem('amenodes_autosave');
        modal.alert(t('modal.storageCleared'));
        if (this.graph && this.graph.clearDirty) {
          this.graph.clearDirty();
        }
      }
    });
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMove(e));
    window.addEventListener('touchmove', (e) => this.renderer.onGlobalMove(e), { passive: false });
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUp(e));
    window.addEventListener('touchend', (e) => this.renderer.onGlobalUp(e));
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMoveEdge(e));
    window.addEventListener('touchmove', (e) => this.renderer.onGlobalMoveEdge(e), { passive: false });
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUpEdge(e));
    window.addEventListener('touchend', (e) => this.renderer.onGlobalUpEdge(e));

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
          <p>${t('editor.selectNodeToEdit')}</p>
        </div>
      `;
      return;
    }

    panel.innerHTML = `
      <div class="property-group">
        <div class="property-label">${t('editor.nodeType')}</div>
        <div class="property-value">${node.type}</div>
      </div>
      <div class="property-group">
        <div class="property-label">${t('editor.id')}</div>
        <div class="property-value">${node.id}</div>
      </div>
      <div class="property-group">
        <div class="property-label">${t('editor.position')}</div>
        <div class="property-value">X: ${Math.round(node.x)}, Y: ${Math.round(node.y)}</div>
      </div>
      <div class="property-group">
        <div class="property-label">${t('editor.connections')}</div>
        <div class="property-value">
          ${t('editor.inputs')}: ${this.graph.getIncomingEdges(node.id).length}<br>
          ${t('editor.outputs')}: ${this.graph.getOutgoingEdges(node.id).length}
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Application();
});

export default Application;
