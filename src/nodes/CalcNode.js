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
  isCategory: false
};

export class CalcNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'calc', x, y, title, options);
    this.operation = options.operation ?? options.calcType ?? 'div3';
    this.result = options.result ?? null;
    this.resultStr = options.resultStr ?? "--";
    this.graph = null;
  }

  getValue() {
    if (this.result === null) return [];
    if (Array.isArray(this.result)) return this.result;
    return [this.result];
  }

  getOutputValue(port = 'main', visited = new Set(), graph = null) {
    return this.getValue();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      result: this.result,
      resultStr: this.resultStr
    };
  }

  onAttach(graph) {
    this.graph = graph;
  }

  onDetach() {
    this.graph = null;
  }

  reevaluate(graph) {
    const incomingEdges = graph.getIncomingEdges(this.id);
    const mergedInput = graph.getMergedInput(this.id);

    if (this.operation === 'multiply_by_constant') {
      if (incomingEdges.length !== 2) {
        this.result = null;
        this.resultStr = "--";
        return;
      }

      let dataArray = null;
      let multiplier = null;

      for (const edge of incomingEdges) {
        const source = graph.getNode(edge.sourceId);
        if (!source) continue;
        const val = graph.getSourceValue(source, edge.sourcePort);
        if (Array.isArray(val) && val.length > 0) {
          dataArray = val;
        } else if (typeof val === 'number' && !isNaN(val)) {
          multiplier = val;
        } else if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'number') {
          multiplier = val[0];
        }
      }

      if (!dataArray || multiplier === null) {
        this.result = null;
        this.resultStr = "--";
        return;
      }

      const result = dataArray.map(v => (typeof v === 'number' && !isNaN(v)) ? v * multiplier : null)
                              .filter(v => v !== null);
      if (result.length === 0) {
        this.result = null;
        this.resultStr = "--";
      } else {
        this.result = result;
        this.resultStr = `[${result.map(v => v.toFixed(6)).join(', ')}]`;
      }
      return;
    }

    if (this.operation === 'sqrt_sum_sq') {
      const pairs = [];
      for (let i = 0; i < incomingEdges.length; i += 2) {
        if (i + 1 < incomingEdges.length) {
          const edge1 = incomingEdges[i];
          const edge2 = incomingEdges[i + 1];
          const source1 = graph.getNode(edge1.sourceId);
          const source2 = graph.getNode(edge2.sourceId);
          if (!source1 || !source2) {
            pairs.push(null);
            continue;
          }
          let val1 = graph.getSourceValue(source1, edge1.sourcePort);
          let val2 = graph.getSourceValue(source2, edge2.sourcePort);
          if (Array.isArray(val1)) val1 = val1.length ? val1[0] : null;
          if (Array.isArray(val2)) val2 = val2.length ? val2[0] : null;
          if (typeof val1 === 'number' && typeof val2 === 'number' && !isNaN(val1) && !isNaN(val2)) {
            pairs.push(Math.sqrt(val1 * val1 + val2 * val2));
          } else {
            pairs.push(null);
          }
        }
      }
      const valid = pairs.filter(v => v !== null);
      if (valid.length === 0) {
        this.result = null;
        this.resultStr = "--";
      } else {
        this.result = valid;
        this.resultStr = `[${valid.map(v => v.toFixed(6)).join(', ')}]`;
      }
      return;
    }

    if (!mergedInput.length) {
      this.result = null;
      this.resultStr = "--";
      return;
    }

    switch (this.operation) {
      case 'div3': {
        const res = mergedInput.map(v => (typeof v === 'number' && !isNaN(v)) ? v / 3 : null)
                               .filter(v => v !== null);
        if (res.length === 0) {
          this.result = null;
          this.resultStr = "--";
        } else {
          this.result = res;
          this.resultStr = `[${res.map(v => v.toFixed(6)).join(', ')}]`;
        }
        break;
      }

      case 'div_sqrt12': {
        const res = mergedInput.map(v => (typeof v === 'number' && !isNaN(v)) ? v / Math.sqrt(12) : null)
                               .filter(v => v !== null);
        if (res.length === 0) {
          this.result = null;
          this.resultStr = "--";
        } else {
          this.result = res;
          this.resultStr = `[${res.map(v => v.toFixed(6)).join(', ')}]`;
        }
        break;
      }

      case 'quadratic_sum': {
        let sumSq = 0;
        let hasValid = false;
        for (const v of mergedInput) {
          if (typeof v === 'number' && !isNaN(v)) {
            sumSq += v * v;
            hasValid = true;
          }
        }
        if (!hasValid) {
          this.result = null;
          this.resultStr = "--";
        } else {
          const qs = Math.sqrt(sumSq);
          this.result = [qs];
          this.resultStr = qs.toFixed(6);
        }
        break;
      }

      default:
        this.result = null;
        this.resultStr = "--";
        break;
    }
  }

  updateDisplay(graph) {
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'calc-header');
    const content = document.createElement('div');
    content.className = 'calc-result';
    content.style.padding = '8px';

    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.marginBottom = '8px';
    select.style.background = '#1f2a44';
    select.style.color = '#ffefcf';
    select.style.border = '1px solid #4a6a8a';
    select.style.borderRadius = '6px';
    select.style.padding = '4px';

    const operations = ['div3', 'div_sqrt12', 'sqrt_sum_sq', 'quadratic_sum', 'multiply_by_constant'];
    for (const op of operations) {
      const option = document.createElement('option');
      option.value = op;
      option.textContent = t(`calcTypes.${op}`);
      if (this.operation === op) option.selected = true;
      select.appendChild(option);
    }

    select.onchange = () => {
      this.operation = select.value;
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };

    const infoDiv = document.createElement('div');
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.marginTop = '4px';

    const updateInfo = () => {
      const opName = t(`calcTypes.${this.operation}`);
      const inputsCount = graph.getIncomingEdges(this.id).length;
      infoDiv.innerHTML = `
        <strong>${opName}</strong><br>
        ${t('calcTypes.result')}: ${this.resultStr}<br>
        <span style="font-size:10px; color:#8899bb;">${t('calcTypes.inputs')}: ${inputsCount}</span>
      `;
    };
    updateInfo();

    const unsubscribe = i18n.subscribe(() => {
      for (const option of select.options) {
        option.textContent = t(`calcTypes.${option.value}`);
      }
      updateInfo();
    });

    content.appendChild(select);
    content.appendChild(infoDiv);
    div.appendChild(content);

    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);

    const originalRemove = div.remove;
    div.remove = () => {
      unsubscribe();
      if (originalRemove) originalRemove.call(div);
    };

    return div;
  }
}
