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
  isCategory: false,
  visual3d: { color: 0xe040a0, size: 0.6, dendrites: 7, glow: '#ff44aa' },
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

    const dropdown = document.createElement('div');
    dropdown.className = 'calc-dropdown';
    dropdown.style.position = 'relative';
    dropdown.style.width = '100%';
    dropdown.style.marginBottom = '8px';

    const toggle = document.createElement('div');
    toggle.className = 'calc-dropdown-toggle';
    toggle.style.width = '100%';
    toggle.style.padding = '8px 12px';
    toggle.style.background = 'linear-gradient(135deg, #1a1f30, #0f1222)';
    toggle.style.color = '#ffefcf';
    toggle.style.border = '1px solid rgba(255, 179, 71, 0.3)';
    toggle.style.borderRadius = '8px';
    toggle.style.fontFamily = 'monospace';
    toggle.style.fontSize = '12px';
    toggle.style.cursor = 'pointer';
    toggle.style.display = 'flex';
    toggle.style.justifyContent = 'space-between';
    toggle.style.alignItems = 'center';
    toggle.style.transition = 'all 0.2s ease';

    const selectedText = document.createElement('span');
    selectedText.className = 'selected-text';
    selectedText.textContent = t(`calcTypes.${this.operation}`);

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.style.transition = 'transform 0.2s ease';
    arrow.style.color = '#ffb347';
    arrow.style.fontSize = '10px';
    arrow.textContent = '▼';

    toggle.appendChild(selectedText);
    toggle.appendChild(arrow);

    const menu = document.createElement('div');
    menu.className = 'calc-dropdown-menu';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '0';
    menu.style.right = '0';
    menu.style.marginTop = '4px';
    menu.style.background = 'linear-gradient(135deg, #1f2a44, #12162a)';
    menu.style.border = '1px solid rgba(255, 179, 71, 0.3)';
    menu.style.borderRadius = '8px';
    menu.style.overflow = 'hidden';
    menu.style.zIndex = '100';
    menu.style.display = 'none';
    menu.style.backdropFilter = 'blur(8px)';

    const operations = ['div3', 'div_sqrt12', 'sqrt_sum_sq', 'quadratic_sum', 'multiply_by_constant'];
    const items = [];

    for (const op of operations) {
      const item = document.createElement('div');
      item.className = 'calc-dropdown-item';
      item.style.padding = '8px 12px';
      item.style.fontFamily = 'monospace';
      item.style.fontSize = '12px';
      item.style.color = '#ffefcf';
      item.style.cursor = 'pointer';
      item.style.transition = 'all 0.1s ease';
      if (this.operation === op) {
        item.classList.add('active');
        item.style.background = 'rgba(255, 179, 71, 0.3)';
        item.style.color = '#ffb347';
        item.style.borderLeft = '2px solid #ffb347';
      }
      item.textContent = t(`calcTypes.${op}`);
      item.dataset.op = op;

      item.onmouseenter = () => {
        item.style.background = 'rgba(255, 179, 71, 0.2)';
        item.style.color = '#ffb347';
      };
      item.onmouseleave = () => {
        if (this.operation === op) {
          item.style.background = 'rgba(255, 179, 71, 0.3)';
          item.style.color = '#ffb347';
        } else {
          item.style.background = '';
          item.style.color = '#ffefcf';
        }
      };
      item.onclick = (e) => {
        e.stopPropagation();
        this.operation = op;
        selectedText.textContent = t(`calcTypes.${op}`);
        for (const i of items) {
          i.classList.remove('active');
          i.style.background = '';
          i.style.color = '#ffefcf';
          i.style.borderLeft = '';
        }
        item.classList.add('active');
        item.style.background = 'rgba(255, 179, 71, 0.3)';
        item.style.color = '#ffb347';
        item.style.borderLeft = '2px solid #ffb347';
        dropdown.classList.remove('open');
        menu.style.display = 'none';
        arrow.style.transform = '';
        graph.reevaluateAll();
        renderer.render();
        renderer.save();
        updateInfo();
      };
      menu.appendChild(item);
      items.push(item);
    }

    toggle.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        dropdown.classList.remove('open');
        menu.style.display = 'none';
        arrow.style.transform = '';
      } else {
        dropdown.classList.add('open');
        menu.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
      }
    };

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);

    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        menu.style.display = 'none';
        arrow.style.transform = '';
      }
    };
    document.addEventListener('click', closeDropdown);

    const infoDiv = document.createElement('div');
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.marginTop = '8px';
    infoDiv.style.padding = '8px';
    infoDiv.style.background = 'rgba(0,0,0,0.3)';
    infoDiv.style.borderRadius = '6px';

    const updateInfo = () => {
      const inputsCount = graph.getIncomingEdges(this.id).length;
      infoDiv.innerHTML = `
        <strong>${t('calcTypes.result')}:</strong> ${this.resultStr}<br>
        <span style="font-size:10px; color:#8899bb;">${t('calcTypes.inputs')}: ${inputsCount}</span>
      `;
    };
    updateInfo();

    const unsubscribe = i18n.subscribe(() => {
      selectedText.textContent = t(`calcTypes.${this.operation}`);
      for (const item of items) {
        item.textContent = t(`calcTypes.${item.dataset.op}`);
      }
      updateInfo();
    });

    content.appendChild(dropdown);
    content.appendChild(infoDiv);
    div.appendChild(content);

    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);

    const originalRemove = div.remove;
    div.remove = () => {
      unsubscribe();
      document.removeEventListener('click', closeDropdown);
      if (originalRemove) originalRemove.call(div);
    };

    return div;
  }

  bindConfig(doc, node, app) {
    doc.querySelectorAll('[data-op]').forEach(function(btn) {
      btn.onclick = function() {
        node.operation = this.dataset.op;
        doc.querySelectorAll('[data-op]').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        app.graph.reevaluateAll();
        app.scene.refresh();
        app.graph.setDirty(true);
      };
    });
  }
}
