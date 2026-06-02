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
  defaultValue: null,
  isCategory: true,
  categoryName: 'errors',
  subnodes: [
  { type: 'div3', nameKey: 'calcTypes.div3', calcType: 'div3' },
  { type: 'div_sqrt12', nameKey: 'calcTypes.div_sqrt12', calcType: 'div_sqrt12' },
  { type: 'sqrt_sum_sq', nameKey: 'calcTypes.sqrt_sum_sq', calcType: 'sqrt_sum_sq' },
  { type: 'quadratic_sum', nameKey: 'calcTypes.quadratic_sum', calcType: 'quadratic_sum' },      
  { type: 'multiply_by_constant', nameKey: 'calcTypes.multiply_by_constant', calcType: 'multiply_by_constant' } 
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
      const incoming = graph.getIncomingEdges(this.id);
      const pairs = [];
      
      for (let i = 0; i < incoming.length; i += 2) {
        if (i + 1 < incoming.length) {
          const edge1 = incoming[i];
          const edge2 = incoming[i + 1];
          const source1 = graph.getNode(edge1.sourceId);
          const source2 = graph.getNode(edge2.sourceId);
          
          if (source1 && source2) {
            const val1 = graph.getSourceValue(source1, edge1.sourcePort, new Set());
            const val2 = graph.getSourceValue(source2, edge2.sourcePort, new Set());
            
            const num1 = Array.isArray(val1) && val1.length ? val1[0] : val1;
            const num2 = Array.isArray(val2) && val2.length ? val2[0] : val2;
            
            if (typeof num1 === 'number' && typeof num2 === 'number' && !isNaN(num1) && !isNaN(num2)) {
              pairs.push(Math.sqrt(num1 * num1 + num2 * num2));
            } else {
              pairs.push(null);
            }
          } else {
            pairs.push(null);
          }
        }
      }
      
      const valid = pairs.filter(v => v !== null);
      if (valid.length > 0) {
        this.result = valid;
        this.resultStr = `[${valid.map(v => v.toFixed(6)).join(', ')}]`;
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
