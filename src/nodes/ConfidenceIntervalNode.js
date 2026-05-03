import { Node } from '../core/Node.js';
import { typeSystem, DataType } from '../core/DataType.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class ConfidenceIntervalNode extends Node {
  constructor(id, x, y, title) {
    super(id, 'confidenceInterval', x, y, title);
    this.result = null;
    this.resultStr = "--";
    this.uncertaintySource = null;
    this.multiplierSource = null;
  }

  getValue() {
    return this.result instanceof Array ? this.result : (this.result !== null ? [this.result] : []);
  }

  toJSON() {
    return { ...super.toJSON(), result: this.result, resultStr: this.resultStr };
  }

  reevaluate(graph) {
    const incoming = graph.getIncomingEdges(this.id);
    if (incoming.length !== 2) {
      this.result = null;
      this.resultStr = t('errors.requireTwoInputs');
      return;
    }

    let uncertaintyValue = null;
    let multiplierValue = null;

    for (const edge of incoming) {
      const source = graph.getNode(edge.sourceId);
      if (!source) continue;
      const sourceType = typeSystem.getNodeType(source);
      const val = graph.getSourceValue(source, edge.sourcePort, new Set());
      
      if (sourceType === DataType.UNCERT || sourceType === DataType.INTERVAL) {
        uncertaintyValue = val;
      } else if ([DataType.NUM, DataType.ARRAY, DataType.LIST, DataType.WLIST].includes(sourceType)) {
        multiplierValue = val;
      }
    }

    if (!uncertaintyValue || !multiplierValue) {
      this.result = null;
      this.resultStr = t('errors.missingUncertaintyOrNumber');
      return;
    }

    const uncArr = Array.isArray(uncertaintyValue) ? uncertaintyValue : [uncertaintyValue];
    const mulArr = Array.isArray(multiplierValue) ? multiplierValue : [multiplierValue];

    const maxLen = Math.max(uncArr.length, mulArr.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      const u = uncArr[i % uncArr.length];
      const m = mulArr[i % mulArr.length];
      if (typeof u === 'number' && typeof m === 'number') {
        result.push(u * m);
      } else {
        result.push(null);
      }
    }

    const valid = result.filter(v => v !== null);
    if (valid.length === 0) {
      this.result = null;
      this.resultStr = "--";
    } else {
      this.result = valid;
      this.resultStr = `[${valid.map(v => v.toFixed(6)).join(', ')}]`;
    }
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'confidence-header');
    const info = document.createElement('div');
    info.className = 'calc-result';

    const updateInfo = () => {
      const unc = graph.getIncomingEdges(this.id).filter(edge => {
        const src = graph.getNode(edge.sourceId);
        return src && typeSystem.getNodeType(src) === DataType.UNCERT;
      }).length;
      const mul = graph.getIncomingEdges(this.id).length - unc;
      info.innerHTML = `<strong>${t('nodes.confidenceInterval')}</strong><br>
                        ${t('confidence.uncertaintyInputs')}: ${unc}<br>
                        ${t('confidence.multiplierInputs')}: ${mul}<br>
                        ${t('calcTypes.result')}: ${this.resultStr}`;
    };
    
    updateInfo();
    const unsubscribe = i18n.subscribe(updateInfo);
    
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
