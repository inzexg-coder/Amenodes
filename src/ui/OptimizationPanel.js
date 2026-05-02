import { OPTIMIZATIONS } from '../config/Optimizations.js';

export class OptimizationPanel {
  constructor(panelId, toggleBtnId, closeBtnId, applyBtnId, rebenchBtnId, benchmarkService, renderer, history) {
    this.panel = document.getElementById(panelId);
    this.toggleBtn = document.getElementById(toggleBtnId);
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
    this.toggleBtn.onclick = () => this.panel.classList.toggle('hidden');
    this.closeBtn.onclick = () => this.panel.classList.add('hidden');
    this.applyBtn.onclick = () => this.apply();
    this.rebenchBtn.onclick = async () => {
      this.panel.classList.add('hidden');
      const result = await this.benchmarkService.runBenchmark(true);
      this.currentGains = result.gains;
      this.buildPanel(window.currentQualityValue || 100);
      this.panel.classList.remove('hidden');
    };
  }

  setDesignQualityCallback(callback) {
    this.onQualityChangeCallback = callback;
  }

  buildPanel(currentQualityValue) {
    const container = document.getElementById('optListContainer');
    if (!container) return;
    container.innerHTML = '';
    
    OPTIMIZATIONS.forEach((opt, idx) => {
      const item = document.createElement('div');
      item.className = 'opt-item';
      const disabled = opt.type !== 'slider' && !opt.impl;
      if (disabled) item.classList.add('opt-item-disabled');
      else item.classList.add('opt-item-enabled');
      
      if (opt.type === 'slider') {
        const info = this.createSliderInfo(opt, currentQualityValue);
        item.appendChild(info);
      } else {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `opt_${idx}`;
        checkbox.checked = this.optState[idx];
        if (disabled) checkbox.disabled = true;
        checkbox.onchange = (e) => { this.optState[idx] = e.target.checked; };
        
        const info = this.createOptInfo(opt, idx);
        item.appendChild(checkbox);
        item.appendChild(info);
      }
      container.appendChild(item);
    });
  }

  createSliderInfo(opt, currentValue) {
    const info = document.createElement('div');
    info.className = 'opt-info';
    info.innerHTML = `
      <div class="opt-title">${opt.name}</div>
      <div class="opt-desc">${opt.desc}</div>
      <div class="opt-pros">${opt.pros}</div>
      <div class="opt-cons">${opt.cons}</div>
    `;
    
    const sliderDiv = document.createElement('div');
    sliderDiv.style.display = 'flex';
    sliderDiv.style.alignItems = 'center';
    sliderDiv.style.gap = '8px';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = opt.min;
    slider.max = opt.max;
    slider.step = opt.step;
    slider.value = currentValue;
    slider.style.flex = '1';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'quality-value';
    valueSpan.innerText = currentValue + '%';
    
    slider.oninput = (e) => {
      const newValue = parseInt(e.target.value);
      if (this.onQualityChangeCallback) this.onQualityChangeCallback(newValue);
      valueSpan.innerText = newValue + '%';
      const modeMsg = newValue <= 20 ? " (ЭКСТРЕМАЛЬНЫЙ)" : (newValue <= 50 ? " (Низкое)" : (newValue <= 80 ? " (Среднее)" : " (Высокое)"));
      const fpsDiv = info.querySelector('.opt-fps');
      if (fpsDiv) {
        fpsDiv.innerHTML = `Текущее качество: ${newValue}%${modeMsg}<br>Упрощён на ${100 - newValue}%`;
      } else {
        const newFpsDiv = document.createElement('div');
        newFpsDiv.className = 'opt-fps';
        newFpsDiv.innerHTML = `Текущее качество: ${newValue}%${modeMsg}<br>Упрощён на ${100 - newValue}%`;
        info.appendChild(newFpsDiv);
      }
    };
    
    sliderDiv.appendChild(slider);
    sliderDiv.appendChild(valueSpan);
    info.appendChild(sliderDiv);
    
    const fpsDiv = document.createElement('div');
    fpsDiv.className = 'opt-fps';
    fpsDiv.innerHTML = `Текущее качество: ${currentValue}%`;
    info.appendChild(fpsDiv);
    
    return info;
  }

  createOptInfo(opt, idx) {
    const info = document.createElement('div');
    info.className = 'opt-info';
    const gain = this.currentGains[idx] || 0;
    const gainText = gain > 0 ? `+${gain}%` : (gain === 0 ? '0%' : 'не измерено');
    info.innerHTML = `
      <div class="opt-title">${opt.name}</div>
      <div class="opt-desc">${opt.desc}</div>
      <div class="opt-pros">${opt.pros}</div>
      <div class="opt-cons">${opt.cons}</div>
      <div class="opt-fps">Прирост FPS: ${gainText}</div>
    `;
    return info;
  }

  apply() {
    const state = this.optState;
    
    if (state[0]) this.renderer.setVirtual(true);
    else this.renderer.setVirtual(false);
    
    const canvasContainer = document.getElementById('canvasContainer');
    if (state[1]) canvasContainer.style.transform = 'translate3d(0,0,0)';
    else canvasContainer.style.transform = '';
    
    this.renderer.opts.willChange = state[5];
    this.renderer.opts.contain = state[9];
    this.renderer.opts.pointerEvents = state[12];
    
    this.renderer.applyOptStyles = function(el) {
      if (this.opts.willChange) el.style.willChange = 'left, top';
      else el.style.willChange = '';
      if (this.opts.contain) el.style.contain = 'layout paint';
      else el.style.contain = '';
    };
    
    if (state[15]) this.history.maxSize = 20;
    else this.history.maxSize = 50;
    
    this.renderer.render();
    this.panel.classList.add('hidden');
  }

  updateGains(gains) {
    this.currentGains = gains;
  }

  getState() {
    return this.optState;
  }
}
