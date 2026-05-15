import { Node } from '../core/Node.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'calc',
  nameKey: 'nodes.calc',
  descriptionKey: 'nodeDescriptions.calc',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes'
};

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
      div3: t('calcTypes.div3'),
      div_sqrt12: t('calcTypes.div_sqrt12'),
      sqrt_sum_sq: t('calcTypes.sqrt_sum_sq')
    };
    
    const updateInfo = () => {
      info.innerHTML = `<strong>${typeMap[this.calcType] || t('calcTypes.div3')}</strong><br>
                        ${t('calcTypes.result')}: ${this.resultStr}<br>
                        <span style="font-size:11px">${t('calcTypes.inputs')}: ${graph.getIncomingEdges(this.id).length}</span>`;
    };
    
    updateInfo();
    
    const unsubscribe = i18n.subscribe(() => {
      const newTypeMap = {
        div3: t('calcTypes.div3'),
        div_sqrt12: t('calcTypes.div_sqrt12'),
        sqrt_sum_sq: t('calcTypes.sqrt_sum_sq')
      };
      info.innerHTML = `<strong>${newTypeMap[this.calcType] || t('calcTypes.div3')}</strong><br>
                        ${t('calcTypes.result')}: ${this.resultStr}<br>
                        <span style="font-size:11px">${t('calcTypes.inputs')}: ${graph.getIncomingEdges(this.id).length}</span>`;
    });
    
    div.appendChild(info);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    const originalRemove = div.remove;
    div.remove = function() {
      unsubscribe();
      if (originalRemove) originalRemove.call(this);
    };
    
    return div;
  }
}
