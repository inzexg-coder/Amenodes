import { Graph } from './core/Graph.js';
import { Viewport } from './renderer/Viewport.js';
import { DomRenderer } from './renderer/DomRenderer.js';
import { History } from './core/History.js';
import { NodeFactory } from './nodes/NodeFactory.js';
import { ToolbarController } from './ui/ToolbarController.js';
import { OptimizationPanel } from './ui/OptimizationPanel.js';
import { BenchmarkService } from './services/BenchmarkService.js';
import { PersistenceService } from './services/PersistenceService.js';
import { EventBus } from './services/EventBus.js';
import { FPSCounter } from './utils/FPSCounter.js';
import { OPTIMIZATIONS } from './config/Optimizations.js';

class Application {
  constructor() {
    this.graph = new Graph();
    this.eventBus = new EventBus();
    this.fpsCounter = new FPSCounter('fpsMeter');
    this.benchmarkService = new BenchmarkService(this.graph, this.fpsCounter, OPTIMIZATIONS);
    this.persistenceService = new PersistenceService(this.graph);
    
    this.initRenderer();
    this.initHistory();
    this.initViewport();
    this.initToolbar();
    this.initOptimizationPanel();
    this.initEvents();
    this.loadInitialState();
  }

  initRenderer() {
    const viewportEl = document.getElementById('viewport');
    const canvasContainer = document.getElementById('canvasContainer');
    const nodesLayer = document.getElementById('nodesLayer');
    
    this.viewport = new Viewport(viewportEl, canvasContainer);
    this.renderer = new DomRenderer(this.graph, nodesLayer, viewportEl, this.eventBus);
    this.renderer.setViewport(this.viewport);
    this.viewport.attach();
    this.viewport.onChange = () => this.renderer.render();
  }

  initHistory() {
    this.history = new History(this.graph);
    this.renderer.setHistory(this.history);
  }

  initViewport() {
    let currentZoom = 1;
    const viewportEl = document.getElementById('viewport');
    const setZoom = (z) => {
      currentZoom = Math.min(3, Math.max(0.3, z));
      window.currentZoom = currentZoom;
      this.viewport.update();
      this.renderer.render();
    };
    
    viewportEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      setZoom(currentZoom * (1 - e.deltaY * 0.005));
    }, { passive: false });
    
    window.setZoom = setZoom;
    window.currentZoom = currentZoom;
    window.applyDesignQuality = (p) => this.applyDesignQuality(p);
  }

  applyDesignQuality(percent) {
    window.currentQualityValue = percent;
    document.body.classList.remove('design-quality-extreme', 'design-quality-1', 'design-quality-2');
    if (percent <= 20) document.body.classList.add('design-quality-extreme');
    else if (percent <= 50) document.body.classList.add('design-quality-1');
    else if (percent <= 80) document.body.classList.add('design-quality-2');
  }

  initToolbar() {
    this.toolbar = new ToolbarController(
      this.graph, this.renderer, this.history, this.viewport, this.persistenceService
    );
    this.toolbar.init();
  }

  initOptimizationPanel() {
    this.optPanel = new OptimizationPanel(
      'optPanel', 'optToggleBtn', 'closeOptPanel', 'applyOptimizationsBtn', 'rebenchmarkBtn',
      this.benchmarkService, this.renderer, this.history
    );
    this.optPanel.setDesignQualityCallback((value) => this.applyDesignQuality(value));
    this.optPanel.buildPanel(window.currentQualityValue || 100);
    
    setTimeout(() => {
      this.benchmarkService.runBenchmark(true).then(({ gains, baseline }) => {
        this.optPanel.updateGains(gains);
        this.optPanel.buildPanel(window.currentQualityValue || 100);
      });
    }, 1000);
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMove(e));
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUp(e));
    window.addEventListener('mousemove', (e) => this.renderer.onGlobalMoveEdge(e));
    window.addEventListener('mouseup', (e) => this.renderer.onGlobalUpEdge(e));
  }

  loadInitialState() {
    if (!this.persistenceService.loadFromStorage()) {
      const { OutputNode } = await import('./nodes/OutputNode.js');
      const defaultOutput = new OutputNode(0, 400, 300, "Вывод результатов", []);
      this.graph.addNode(defaultOutput);
      this.renderer.render();
      this.history.save();
    } else {
      this.renderer.render();
    }
  }
}

new Application();
