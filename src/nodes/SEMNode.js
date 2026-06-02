import { Node } from '../core/Node.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'sem',
  nameKey: 'nodes.sem',
  descriptionKey: 'nodeDescriptions.sem',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-solid fa-down-left-and-up-right-to-center',
  dataType: 'num',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: ['array', 'list', 'wlist', 'num'],
  defaultValue: null
};

export class SEMNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'sem', x, y, title, options);
    this.result = null;
    this.resultStr = '--';
    this.graph = null;
  }

  getValue() {
    return this.result !== null ? [this.result] : [];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      result: this.result,
      resultStr: this.resultStr
    };
  }

  reevaluate(graph) {
    const input = graph.getMergedInput(this.id);
    if (!input.length || input.length < 2) {
      this.result = null;
      this.resultStr = '--';
      return;
    }
    const n = input.length;
    const sum = input.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    let sumSqDiff = 0;
    for (let i = 0; i < n; i++) {
      const diff = input[i] - mean;
      sumSqDiff += diff * diff;
    }
    const sem = Math.sqrt(sumSqDiff / (n * (n - 1)));
    this.result = sem;
    this.resultStr = sem.toFixed(6);
  }

  updateDisplay() {}

  onAttach(graph) {
    this.graph = graph;
  }

  onDetach() {
    this.graph = null;
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'node-header');
    const content = document.createElement('div');
    content.className = 'calc-result';
    
    const updateInfo = () => {
      const incoming = graph.getIncomingEdges(this.id);
      const inputCount = incoming.length;
      const merged = graph.getMergedInput(this.id);
      const sampleSize = merged.length;
      content.innerHTML = `<strong>${this.getLocalizedTitle()}</strong><br>
                           ${t('sem.inputs')}: ${inputCount}<br>
                           ${t('sem.sampleSize')}: ${sampleSize}<br>
                           ${t('sem.result')}: ${this.resultStr}`;
    };
    
    updateInfo();
    
    const unsubscribe = i18n.subscribe(() => updateInfo());
    
    div.appendChild(content);
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
