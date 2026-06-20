import { Node } from '../core/Node.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'mean',
  nameKey: 'nodes.mean',
  descriptionKey: 'nodeDescriptions.mean',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-chart-line',
};

export class MeanNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'mean', x, y, title, options);
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
    if (!input.length) {
      this.result = null;
      this.resultStr = '--';
      return;
    }

    const numbers = input.filter(v => typeof v === 'number' && !isNaN(v));
    if (numbers.length === 0) {
      this.result = null;
      this.resultStr = '--';
      return;
    }

    const sum = numbers.reduce((acc, val) => acc + val, 0);
    const mean = sum / numbers.length;
    this.result = mean;
    this.resultStr = mean.toFixed(6);
  }

  updateDisplay() {
  }

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
      const validNumbers = merged.filter(v => typeof v === 'number' && !isNaN(v));
      content.innerHTML = `<strong>${this.getLocalizedTitle()}</strong><br>
                           ${t('mean.inputs')}: ${inputCount}<br>
                           ${t('mean.sampleSize')}: ${validNumbers.length}<br>
                           ${t('mean.result')}: ${this.resultStr}`;
    };

    updateInfo();

    const unsubscribe = i18n.subscribe(() => {
      updateInfo();
    });

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
