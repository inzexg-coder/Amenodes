import { Node } from '../core/Node.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'calc',
  nameKey: 'nodes.calc',
  descriptionKey: 'nodeDescriptions.calc',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-calculator',
  dataType: 'uncert',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: ['num', 'array', 'uncert'],
  allowedOutputTypes: ['num', 'array', 'auto', 'uncert', 'list', 'wlist'],
  defaultValue: null,
  isCategory: true,
  categoryName: 'errors',
  subnodes: [
    { type: 'div3', nameKey: 'calcTypes.div3', calcType: 'div3' },
    { type: 'div_sqrt12', nameKey: 'calcTypes.div_sqrt12', calcType: 'div_sqrt12' },
    { type: 'sqrt_sum_sq', nameKey: 'calcTypes.sqrt_sum_sq', calcType: 'sqrt_sum_sq' }
  ]
};

export class CalcNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'calc', x, y, title, options);
    this.calcType = options.calcType ?? 'div3';
    this.result = options.result ?? null;
    this.resultStr = options.resultStr ?? "--";
  }

  getValue() {
    return this.result instanceof Array ? this.result : (this.result !== null ? [this.result] : []);
  }

  toJSON() {
    return { ...super.toJSON(), calcType: this.calcType, result: this.result, resultStr: this.resultStr };
  }

  reevaluate(graph) {
    if (this.calcType === 'sqrt_sum_sq') {
      const paired = graph.getPairedForSqrt ? graph.getPairedForSqrt(this.id) : { ok: false, res: [] };
      if (paired && paired.ok && paired.res.length > 0) {
        this.result = paired.res;
        this.resultStr = `[${paired.res.map(v => v.toFixed(6)).join(', ')}]`;
      } else {
        this.result = null;
        this.resultStr = "--";
      }
      return;
    }
    
    const input = graph.getMergedInput(this.id);
    if (!input.length) {
      this.result = null;
      this.resultStr = "--";
      return;
    }
    
    if (this.calcType === 'div3') {
      const result = input.map(v => typeof v === 'number' ? v / 3 : null).filter(v => v !== null);
      this.result = result.length ? result : null;
      this.resultStr = result.length ? `[${result.map(v => v.toFixed(6)).join(', ')}]` : "--";
    } else if (this.calcType === 'div_sqrt12') {
      const result = input.map(v => typeof v === 'number' ? v / Math.sqrt(12) : null).filter(v => v !== null);
      this.result = result.length ? result : null;
      this.resultStr = result.length ? `[${result.map(v => v.toFixed(6)).join(', ')}]` : "--";
    }
  }

  updateDisplay() {
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
