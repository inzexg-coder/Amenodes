import { OPTIMIZATIONS } from '../config/Optimizations.js';
import { i18n, t } from '../i18n/LanguageManager.js';

const getOptKey = (name) => {
  const map = {
    'Виртуализация': 'virtualization',
    'GPU-трансформации': 'gpuTransforms',
    'Throttle мыши': 'throttleMouse',
    'Batch-обновление RAF': 'batchRAF',
    'Кэш высоты': 'cacheHeight',
    'will-change': 'willChange',
    'Пассивные события': 'passiveEvents',
    'Упрощение теней': 'simplifyShadows',
    'Отложенные связи': 'deferredEdges',
    'CSS containment': 'cssContainment',
    'Debounce рендера': 'debounceRender',
    'Кэш getBoundingClientRect': 'cacheBoundingRect',
    'Pointer-events линий': 'pointerEventsLines',
    'Ленивые вычисления': 'lazyComputations',
    'Типизированные массивы': 'typedArrays',
    'Ограничение истории': 'limitHistory',
    'Кэш текста': 'cacheText',
    'WebGL-инстансинг': 'webglInstancing',
    'Качество дизайна': 'designQuality',
    'Скорость анимации': 'animSpeed'
  };
  return map[name] || name.replace(/\s+/g, '');
};

export class OptimizationPanel {
  constructor(panelId, toggleBtnId, closeBtnId, applyBtnId, rebenchBtnId, benchmarkService, renderer, history) {
    this.panel = document.getElementById(panelId);
    this.toggleBtn = document.getElementById(toggleBtnId);
    if (!this.toggleBtn) this.toggleBtn = document.getElementById('optToggleBtn');
    this.closeBtn = document.getElementById(closeBtnId);
    this.applyBtn = document.getElementById(applyBtnId);
    this.rebenchBtn = document.getElementById(rebenchBtnId);
    this.benchmarkService = benchmarkService;
    this.renderer = renderer;
    this.history = history;
    this.optState = new Array(OPTIMIZATIONS.length).fill(false);
    this.currentGains = new Array(OPTIMIZATIONS.length).fill(0);
    this.onQualityChangeCallback = null;
    this.init();
  }

  init() {
    if (this.toggleBtn) {
      this.toggleBtn.onclick = () => {
        if (this.panel) this.panel.classList.toggle('hidden');
      };
    }
    if (this.closeBtn) {
      this.closeBtn.onclick = () => {
        if (this.panel) this.panel.classList.add('hidden');
      };
    }
    if (this.rebenchBtn) {
      this.rebenchBtn.onclick = async () => {
        if (this.panel) this.panel.classList.add('hidden');
        const result = await this.benchmarkService.runBenchmark(true);
        this.currentGains = result.gains;
        this.buildPanel(window.currentQualityValue || 100);
        if (this.panel) this.panel.classList.remove('hidden');
      };
    }
    i18n.subscribe(() => {
      this.buildPanel(window.currentQualityValue || 100);
    });
  }

  setDesignQualityCallback(callback) {
    this.onQualityChangeCallback = callback;
  }

  buildPanel(currentQualityValue) {
    const container = document.getElementById('optListContainer');
    if (!container) return;
    container.innerHTML = '';

    const implementedOpts = [];
    const pendingOpts = [];

    for (let idx = 0; idx < OPTIMIZATIONS.length; idx++) {
      const opt = OPTIMIZATIONS[idx];
      if (opt.type === 'slider') {
        implementedOpts.push({ opt, idx });
      } else if (opt.impl) {
        implementedOpts.push({ opt, idx });
      } else {
        pendingOpts.push({ opt, idx });
      }
    }

    const isMobileView = window.innerWidth <= 768;

    if (implementedOpts.length > 0) {
      if (isMobileView) {
        for (const { opt, idx } of implementedOpts) {
          if (opt.type === 'slider' && opt.name === 'Скорость анимации') {
            this.createAnimSpeedItem(container, opt);
          } else if (opt.type === 'slider') {
            this.createSliderItem(container, opt, currentQualityValue);
          }
        }
      } else {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'opt-category';
        categoryDiv.textContent = t('optimizations.available');
        container.appendChild(categoryDiv);
        
        for (const { opt, idx } of implementedOpts) {
          if (opt.type === 'slider' && opt.name === 'Скорость анимации') {
            this.createAnimSpeedItem(container, opt);
          } else if (opt.type === 'slider') {
            this.createSliderItem(container, opt, currentQualityValue);
          } else {
            this.createSwitchItem(container, opt, idx);
          }
        }
      }
    }

    if (!isMobileView && pendingOpts.length > 0) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'opt-category';
      categoryDiv.textContent = t('optimizations.comingSoon');
      container.appendChild(categoryDiv);
      
      for (const { opt, idx } of pendingOpts) {
        this.createPendingItem(container, opt, idx);
      }
    }
  }

  createAnimSpeedItem(container, opt) {
    const item = document.createElement('div');
    item.className = 'opt-item';
    
    const info = document.createElement('div');
    info.className = 'opt-info';
    
    const optKey = getOptKey(opt.name);
    const optName = t(`optimizations.${optKey}`) || opt.name;
    const optDesc = t(`optimizations.${optKey}Desc`) || opt.desc;
    const optPros = t(`optimizations.${optKey}Pros`) || opt.pros;
    const optCons = t(`optimizations.${optKey}Cons`) || opt.cons;
    
    const currentSpeed = window._nodeAnimSpeed !== undefined ? window._nodeAnimSpeed : (opt.default || 300);
    
    info.innerHTML = `
      <div class="opt-title">${optName}</div>
      <div class="opt-desc">${optDesc}</div>
      <div class="opt-pros">${optPros}</div>
      <div class="opt-cons">${optCons}</div>
    `;
    
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'opt-slider-row';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = opt.min;
    slider.max = opt.max;
    slider.step = opt.step;
    slider.value = currentSpeed;
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'opt-slider-value';
    valueSpan.textContent = currentSpeed + 'ms';
    
    slider.oninput = (e) => {
      const v = parseInt(e.target.value);
      valueSpan.textContent = v + 'ms';
    };
    
    slider.onchange = (e) => {
      const v = parseInt(e.target.value);
      const seconds = v / 1000;
      window._nodeAnimSpeed = v;
      document.documentElement.style.setProperty('--transition', seconds > 0 ? `all ${seconds}s ease` : 'none');
      if (this.renderer && this.renderer.render) this.renderer.render();
    };
    
    sliderDiv.appendChild(slider);
    sliderDiv.appendChild(valueSpan);
    info.appendChild(sliderDiv);
    item.appendChild(info);
    container.appendChild(item);
  }

  createSwitchItem(container, opt, idx) {
    const item = document.createElement('div');
    item.className = 'opt-item';
    
    const info = document.createElement('div');
    info.className = 'opt-info';
    
    const optKey = getOptKey(opt.name);
    const optName = t(`optimizations.${optKey}`) || opt.name;
    const optDesc = t(`optimizations.${optKey}Desc`) || opt.desc;
    const optPros = t(`optimizations.${optKey}Pros`) || opt.pros;
    const optCons = t(`optimizations.${optKey}Cons`) || opt.cons;
    
    const isEnabled = this.optState[idx];
    
    info.innerHTML = `
      <div class="opt-title">${optName}</div>
      <div class="opt-desc">${optDesc}</div>
      <div class="opt-pros">${optPros}</div>
      <div class="opt-cons">${optCons}</div>
    `;
    
    const switchEl = document.createElement('div');
    switchEl.className = `opt-switch${isEnabled ? ' opt-switch-active' : ''}`;
    switchEl.onclick = () => {
      this.optState[idx] = !this.optState[idx];
      switchEl.classList.toggle('opt-switch-active');
      this.applyOptimizationImmediately(idx, this.optState[idx]);
    };
    const handle = document.createElement('div');
    handle.className = 'opt-switch-handle';
    switchEl.appendChild(handle);
    
    item.appendChild(info);
    item.appendChild(switchEl);
    container.appendChild(item);
  }

  createSliderItem(container, opt, currentValue) {
    const item = document.createElement('div');
    item.className = 'opt-item';
    
    const info = document.createElement('div');
    info.className = 'opt-info';
    
    const optKey = getOptKey(opt.name);
    const optName = t(`optimizations.${optKey}`) || opt.name;
    const optDesc = t(`optimizations.${optKey}Desc`) || opt.desc;
    const optPros = t(`optimizations.${optKey}Pros`) || opt.pros;
    const optCons = t(`optimizations.${optKey}Cons`) || opt.cons;
    
    info.innerHTML = `
      <div class="opt-title">${optName}</div>
      <div class="opt-desc">${optDesc}</div>
      <div class="opt-pros">${optPros}</div>
      <div class="opt-cons">${optCons}</div>
    `;
    
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'opt-slider-row';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = opt.min;
    slider.max = opt.max;
    slider.step = opt.step;
    slider.value = currentValue;
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'opt-slider-value';
    valueSpan.textContent = currentValue + '%';
    
    const fpsGainSpan = document.createElement('div');
    fpsGainSpan.className = 'opt-fps';
    
    const modeSpan = document.createElement('span');
    modeSpan.className = 'opt-mode';
    
    const updateQuality = (value) => {
      valueSpan.textContent = value + '%';
      fpsGainSpan.innerHTML = '';
      modeSpan.textContent = '';
      
      const initialGain = this.currentGains[OPTIMIZATIONS.length - 1] || 0;
      const initialFpsMsg = initialGain > 0 ? `+${initialGain}% FPS` : '0% FPS';
      
      if (value > 80) {
        fpsGainSpan.innerHTML = `<i class="fas fa-chart-line"></i> ${t('optimizations.fpsGain')}: ${initialFpsMsg}`;
      } else {
        if (value <= 20) fpsGainSpan.innerHTML = `<i class="fas fa-chart-line"></i> ${t('optimizations.fpsGain')}: +300% FPS`;
        else if (value <= 50) fpsGainSpan.innerHTML = `<i class="fas fa-chart-line"></i> ${t('optimizations.fpsGain')}: +150% FPS`;
        else if (value <= 80) fpsGainSpan.innerHTML = `<i class="fas fa-chart-line"></i> ${t('optimizations.fpsGain')}: +50% FPS`;
        else fpsGainSpan.innerHTML = `<i class="fas fa-chart-line"></i> ${t('optimizations.fpsGain')}: ${initialFpsMsg}`;
      }
      
      let modeMsg = '';
      if (value <= 20) modeMsg = t('optimizations.extreme');
      else if (value <= 50) modeMsg = t('optimizations.low');
      else if (value <= 80) modeMsg = t('optimizations.medium');
      else modeMsg = t('optimizations.high');
      modeSpan.textContent = modeMsg;
    };
    
    updateQuality(currentValue);
    
    slider.oninput = (e) => {
      const newValue = parseInt(e.target.value);
      updateQuality(newValue);
    };
    
    slider.onchange = (e) => {
      const newValue = parseInt(e.target.value);
      if (this.onQualityChangeCallback) this.onQualityChangeCallback(newValue);
      window._designQualitySaved = newValue;
      if (this.renderer && this.renderer.render) this.renderer.render();
      
      // Skip benchmark on mobile
      if (window.innerWidth > 768) {
        setTimeout(async () => {
          const result = await this.benchmarkService.runBenchmark(true);
          if (result && result.gains) {
            this.currentGains = result.gains;
            updateQuality(newValue);
          }
        }, 500);
      }
      
      if (this.panel) this.panel.classList.add('hidden');
    };
    
    sliderDiv.appendChild(slider);
    sliderDiv.appendChild(valueSpan);
    info.appendChild(sliderDiv);
    info.appendChild(fpsGainSpan);
    info.appendChild(modeSpan);
    item.appendChild(info);
    container.appendChild(item);
  }

  createPendingItem(container, opt, idx) {
    const item = document.createElement('div');
    item.className = 'opt-item opt-item-disabled';
    
    const info = document.createElement('div');
    info.className = 'opt-info';
    
    const optKey = getOptKey(opt.name);
    const optName = t(`optimizations.${optKey}`) || opt.name;
    const optDesc = t(`optimizations.${optKey}Desc`) || opt.desc;
    const optPros = t(`optimizations.${optKey}Pros`) || opt.pros;
    const optCons = t(`optimizations.${optKey}Cons`) || opt.cons;
    
    info.innerHTML = `
      <div class="opt-title">${optName}</div>
      <div class="opt-desc">${optDesc}</div>
      <div class="opt-pros">${optPros}</div>
      <div class="opt-cons">${optCons}</div>
      <div class="opt-fps" style="color:#667799;">${t('optimizations.notImplemented')}</div>
    `;
    
    const switchEl = document.createElement('div');
    switchEl.className = 'opt-switch';
    switchEl.style.cursor = 'not-allowed';
    switchEl.style.opacity = '0.3';
    const handle = document.createElement('div');
    handle.className = 'opt-switch-handle';
    switchEl.appendChild(handle);
    
    item.appendChild(info);
    item.appendChild(switchEl);
    container.appendChild(item);
  }

  applyOptimizationImmediately(index, enabled) {
    switch(index) {
      case 0: this.setVirtual(enabled); break;
      case 1: this.setGpuTransform(enabled); break;
      case 5: this.setWillChange(enabled); break;
      case 9: this.setContain(enabled); break;
      case 12: this.setPointerEvents(enabled); break;
      case 15: this.setHistoryMax(enabled ? 20 : 50); break;
    }
    if (this.renderer && this.renderer.render) this.renderer.render();
  }

  setVirtual(enabled) {
    window._rendererVirtual = enabled;
    if (this.renderer && this.renderer.setVirtual) this.renderer.setVirtual(enabled);
  }

  setGpuTransform(enabled) {
    const container = document.getElementById('canvasContainer');
    if (container) {
      if (enabled) container.style.transform = 'translate3d(0,0,0)';
      else container.style.transform = '';
    }
  }

  setWillChange(enabled) {
    window._rendererWillChange = enabled;
    if (this.renderer && this.renderer.opts) this.renderer.opts.willChange = enabled;
  }

  setContain(enabled) {
    window._rendererContain = enabled;
    if (this.renderer && this.renderer.opts) this.renderer.opts.contain = enabled;
  }

  setPointerEvents(enabled) {
    window._rendererPointerEvents = enabled;
    if (this.renderer && this.renderer.opts) this.renderer.opts.pointerEvents = enabled;
  }

  setHistoryMax(max) {
    window._historyMaxSize = max;
    if (this.history) this.history.maxSize = max;
  }

  updateGains(gains) {
    this.currentGains = gains;
  }

  getState() {
    return this.optState;
  }
}
