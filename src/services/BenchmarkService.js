export class BenchmarkService {
  constructor(graph, fpsCounter, optimizations) {
    this.graph = graph;
    this.fpsCounter = fpsCounter;
    this.optimizations = optimizations;
    this.benchmarking = false;
    this.realGains = new Array(optimizations.length).fill(0);
    this.baselineFPS = 0;
  }

  async runBenchmark(notify = true) {
    if (this.benchmarking) return { gains: this.realGains, baseline: this.baselineFPS };
    this.benchmarking = true;
    
    const statusEl = document.getElementById('benchmarkStatus');
    if (notify && statusEl) statusEl.style.display = 'block';
    
    const savedState = this.captureState();
    
    this.resetToBaseline();
    
    if (notify && statusEl) statusEl.innerHTML = 'Измерение базовой...';
    await this.sleep(500);
    this.baselineFPS = await this.fpsCounter.measure(1500);
    if (notify && statusEl) statusEl.innerHTML = `Базовый FPS: ${this.baselineFPS}`;
    await this.sleep(800);
    
    for (let i = 0; i < this.optimizations.length; i++) {
      const opt = this.optimizations[i];
      if (opt.type === 'slider') continue;
      if (notify && statusEl) statusEl.innerHTML = `Тест: ${opt.name}... (${i + 1}/${this.optimizations.length})`;
      
      if (!opt.impl) {
        this.realGains[i] = 0;
        continue;
      }
      
      this.applyOptimizationByIndex(i, true);
      await this.sleep(100);
      const fps = await this.fpsCounter.measure(1000);
      const gain = Math.round(((fps - this.baselineFPS) / this.baselineFPS) * 100);
      this.realGains[i] = Math.max(0, gain);
      if (notify && statusEl) statusEl.innerHTML = `${opt.name}: +${this.realGains[i]}% -> ${fps} FPS`;
      
      this.applyOptimizationByIndex(i, false);
      await this.sleep(100);
    }
    
    this.restoreState(savedState);
    
    if (notify && statusEl) {
      statusEl.innerHTML = `Тест завершён. Базовый FPS: ${this.baselineFPS}`;
      setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 3000);
    }
    
    this.benchmarking = false;
    return { gains: this.realGains, baseline: this.baselineFPS };
  }

  captureState() {
    return {
      virtual: window._rendererVirtual,
      willChange: window._rendererWillChange,
      contain: window._rendererContain,
      pointerEvents: window._rendererPointerEvents,
      historyMax: window._historyMaxSize,
      transform: document.getElementById('canvasContainer').style.transform
    };
  }

  resetToBaseline() {
    this.setVirtual(false);
    this.setWillChange(false);
    this.setContain(false);
    this.setPointerEvents(false);
    this.setHistoryMax(50);
    document.getElementById('canvasContainer').style.transform = '';
  }

  restoreState(state) {
    this.setVirtual(state.virtual);
    this.setWillChange(state.willChange);
    this.setContain(state.contain);
    this.setPointerEvents(state.pointerEvents);
    this.setHistoryMax(state.historyMax);
    document.getElementById('canvasContainer').style.transform = state.transform || '';
    if (window._renderer && window._renderer.render) window._renderer.render();
  }

  applyOptimizationByIndex(index, enable) {
    switch(index) {
      case 0: this.setVirtual(enable); break;
      case 1: this.setGpuTransform(enable); break;
      case 5: this.setWillChange(enable); break;
      case 9: this.setContain(enable); break;
      case 12: this.setPointerEvents(enable); break;
      case 15: this.setHistoryMax(enable ? 20 : 50); break;
    }
  }

  setVirtual(enabled) {
    window._rendererVirtual = enabled;
    if (window._renderer && window._renderer.setVirtual) window._renderer.setVirtual(enabled);
  }

  setGpuTransform(enabled) {
    const container = document.getElementById('canvasContainer');
    if (enabled) container.style.transform = 'translate3d(0,0,0)';
    else container.style.transform = '';
  }

  setWillChange(enabled) {
    window._rendererWillChange = enabled;
    if (window._renderer && window._renderer.opts) window._renderer.opts.willChange = enabled;
  }

  setContain(enabled) {
    window._rendererContain = enabled;
    if (window._renderer && window._renderer.opts) window._renderer.opts.contain = enabled;
  }

  setPointerEvents(enabled) {
    window._rendererPointerEvents = enabled;
    if (window._renderer && window._renderer.opts) window._renderer.opts.pointerEvents = enabled;
  }

  setHistoryMax(max) {
    window._historyMaxSize = max;
    if (window._history) window._history.maxSize = max;
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  getGains() {
    return this.realGains;
  }
}
