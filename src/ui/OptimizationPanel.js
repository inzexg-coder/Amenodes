import { OPTIMIZATIONS } from '../config/Optimizations.js';
import { i18n, t } from '../i18n/LanguageManager.js';

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
    
    this.applyBtn.textContent = t('optimizations.fpsGain') + ' / ' + t('common.apply');
    this.rebenchBtn.textContent = t('optimizations.fpsGain') + ' >';
  }

  createSliderInfo(opt, currentValue) {
    const info = document.createElement('div');
    info.className = 'opt-info';
    
    const optName = t(`optimizations.${opt.name.replace(/ /g, '')}`) || opt.name;
    const optDesc = t(`optimizations.${opt.name.replace(/ /g, '')}Desc`) || opt.desc;
    const optPros = t(`optimizations.${opt.name.replace(/ /g, '')}Pros`) || opt.pros;
    const optCons = t(`optimizations.${opt.name.replace(/ /g, '')}Cons`) || opt.cons;
    
    info.innerHTML = `
      <div class="opt-title">${optName}</div>
      <div class="opt-desc">${optDesc}</div>
      <div class="opt-pros">${optPros}</div>
      <div class="opt-cons">${optCons}</div>
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
      
      let modeMsg = '';
      if (newValue <= 20) modeMsg = ` (${t('optimizations.extreme')})`;
      else if (newValue <= 50) modeMsg = ` (${t('optimizations.low')})`;
      else if (newValue <= 80) modeMsg = ` (${t('optimizations.medium')})`;
      else modeMsg = ` (${t('optimizations.high')})`;
      
      const fpsDiv = info.querySelector('.opt-fps');
      if (fpsDiv) {
        fpsDiv.innerHTML = `${t('optimizations.currentQuality')}: ${newValue}%${modeMsg}<br>${t('optimizations.simplifiedBy')} ${100 - newValue}%`;
      } else {
        const newFpsDiv = document.createElement('div');
        newFpsDiv.className = 'opt-fps';
        newFpsDiv.innerHTML = `${t('optimizations.currentQuality')}: ${newValue}%${modeMsg}<br>${t('optimizations.simplifiedBy')} ${100 - newValue}%`;
        info.appendChild(newFpsDiv);
      }
    };
    
    sliderDiv.appendChild(slider);
    sliderDiv.appendChild(valueSpan);
    info.appendChild(sliderDiv);
    
    const fpsDiv = document.createElement('div');
    fpsDiv.className = 'opt-fps';
    let modeMsg = '';
    if (currentValue <= 20) modeMsg = ` (${t('optimizations.extreme')})`;
    else if (currentValue <= 50) modeMsg = ` (${t('optimizations.low')})`;
    else if (currentValue <= 80) modeMsg = ` (${t('optimizations.medium')})`;
    else modeMsg = ` (${t('optimizations.high')})`;
    fpsDiv.innerHTML = `${t('optimizations.currentQuality')}: ${currentValue}%${modeMsg}<br>${t('optimizations.simplifiedBy')} ${100 - currentValue}%`;
    info.appendChild(fpsDiv);
    
    return info;
  }

  createOptInfo(opt, idx) {
    const info = document.createElement('div');
    info.className = 'opt-info';
    
    const optName = t(`optimizations.${opt.name.replace(/ /g, '')}`) || opt.name;
    const optDesc = t(`optimizations.${opt.name.replace(/ /g, '')}Desc`) || opt.desc;
    const optPros = t(`optimizations.${opt.name.replace(/ /g, '')}Pros`) || opt.pros;
    const optCons = t(`optimizations.${opt.name.replace(/ /g, '')}Cons`) || opt.cons;
    
    const gain = this.currentGains[idx] || 0;
    const gainText = gain > 0 ? `+${gain}%` : (gain === 0 ? '0%' : t('optimizations.notMeasured'));
    
    info.innerHTML = `
      <div class="opt-title">${optName}</div>
      <div class="opt-desc">${optDesc}</div>
      <div class="opt-pros">${optPros}</div>
      <div class="opt-cons">${optCons}</div>
      <div class="opt-fps">${t('optimizations.fpsGain')}: ${gainText}</div>
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
