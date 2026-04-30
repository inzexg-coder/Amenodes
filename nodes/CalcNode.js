import { Node } from '../core/Node.js';

export class CalcNode extends Node {
  constructor(id, x, y, title, calcType) {
    super(id, 'calc', x, y, title);
    this.calcType = calcType;
    this.result = null;
    this.resultStr = "--";
  }

  getValue() {
    return this.result instanceof Array ? this.result : (this.result !== null ? [this.result] : []);
  }

  toJSON() {
    return { ...super.toJSON(), calcType: this.calcType, result: this.result, resultStr: this.resultStr };
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'calc-header');
    const info = document.createElement('div');
    info.className = 'calc-result';
    
    const typeMap = {
      div3: 'Погрешность измерения',
      div_sqrt12: 'Погрешность округления',
      sqrt_sum_sq: 'Суммарная погрешность'
    };
    
    info.innerHTML = `<strong>${typeMap[this.calcType] || 'Погрешность'}</strong><br>
                      Результат: ${this.resultStr}<br>
                      <span style="font-size:11px">входов: ${graph.getIncomingEdges(this.id).length}</span>`;
    
    div.appendChild(info);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    this.addClickHandler(div);
    return div;
  }

  addClickHandler(div) {
    div.onclick = (e) => {
      if (e.target.closest('.node-handle') || e.target.closest('input') || 
          e.target.closest('button') || e.target.closest('.title-editable')) return;
      e.stopPropagation();
      document.querySelectorAll('.node').forEach(el => el.classList.remove('node-temp-selected'));
      div.classList.add('node-temp-selected');
      setTimeout(() => div.classList.remove('node-temp-selected'), 800);
    };
  }
}
