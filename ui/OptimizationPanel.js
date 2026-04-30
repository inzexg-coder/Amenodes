import { OPTIMIZATIONS } from '../config/Optimizations.js';

export class OptimizationPanel {
  constructor(containerId, toggleBtnId, closeBtnId, applyBtnId, rebenchBtnId) {
    this.panel = document.getElementById(containerId);
    this.toggleBtn = document.getElementById(toggleBtnId);
    this.closeBtn = document.getElementById(closeBtnId);
    this.applyBtn = document.getElementById(applyBtnId);
    this.rebenchBtn = document.getElementById(rebenchBtnId);
    this.optState = new Array(OPTIMIZATIONS.length).fill(false);
    this.realGains = new Array(OPTIMIZATIONS.length).fill(0);
    this.baselineFPS = 0;
    this.benchmarking = false;
    this.onApplyCallback = null;
    this.onRebenchCallback = null;
    this.onQualityChangeCallback = null;
    
    this.init();
  }

  init() {
    this.toggleBtn.onclick = () => this.panel.classList.toggle('hidden');
    this.closeBtn.onclick = () => this.panel.classList.add('hidden');
    this.applyBtn.onclick = () => {
      if (this.onApplyCallback) this.onApplyCallback(this.optState);
      this.panel.classList.add('hidden');
    };
    this.rebenchBtn.onclick = async () => {
      this.panel.classList.add('hidden');
      if (this.onRebenchCallback) await this.onRebenchCallback();
      this.panel.classList.remove('hidden');
    };
  }

  setCallbacks(onApply, onRebench, onQualityChange) {
    this.onApplyCallback = onApply;
    this.onRebenchCallback = onRebench;
    this.onQualityChangeCallback = onQualityChange;
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
        const info = document.createElement('div');
        info.className = 'opt-info';
        info.innerHTML = `
          <div class="opt-title">${opt.name}</div>
          <div class="opt-desc">${opt.desc}</div>
          <div class="opt-pros">${opt.pros}</div>
          <div class="opt-cons">${opt.cons}</div>
          <div class="opt-fps">Текущее качество: ${currentQualityValue}%</div>
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
        slider.value = currentQualityValue;
        slider.style.flex = '1';
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'quality-value';
        valueSpan.innerText = currentQualityValue + '%';
        
        slider.oninput = (e) => {
          const newValue = parseInt(e.target.value);
          if (this.onQualityChangeCallback) this.onQualityChangeCallback(newValue);
          valueSpan.innerText = newValue + '%';
          const modeMsg = newValue <= 20 ? " (ЭКСТРЕМАЛЬНЫЙ)" : (newValue <= 50 ? " (Низкое)" : (newValue <= 80 ? " (Среднее)" : " (Высокое)"));
          info.querySelector('.opt-fps').innerHTML = `Текущее качество: ${newValue}%${modeMsg}<br>Упрощён на ${100 - newValue}%`;
        };
        
        sliderDiv.appendChild(slider);
        sliderDiv.appendChild(valueSpan);
        info.appendChild(sliderDiv);
        item.appendChild(info);
      } else {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `opt_${idx}`;
        checkbox.checked = this.optState[idx];
        if (disabled) checkbox.disabled = true;
        checkbox.onchange = (e) => { this.optState[idx] = e.target.checked; };
        
        const info = document.createElement('div');
        info.className = 'opt-info';
        const gainText = this.realGains[idx] > 0 ? `+${this.realGains[idx]}%` : (this.realGains[idx] === 0 ? '0%' : 'не измерено');
        info.innerHTML = `
          <div class="opt-title">${opt.name}</div>
          <div class="opt-desc">${opt.desc}</div>
          <div class="opt-pros">${opt.pros}</div>
          <div class="opt-cons">${opt.cons}</div>
          <div class="opt-fps">Прирост FPS: ${gainText}</div>
        `;
        
        item.appendChild(checkbox);
        item.appendChild(info);
      }
      container.appendChild(item);
    });
  }

  updateGains(gains) {
    this.realGains = gains;
  }

  updateState(state) {
    this.optState = state;
  }

  getState() {
    return this.optState;
  }

  setBenchmarking(status) {
    this.benchmarking = status;
  }

  isBenchmarking() {
    return this.benchmarking;
  }

  updateBaselineFPS(fps) {
    this.baselineFPS = fps;
  }
}
