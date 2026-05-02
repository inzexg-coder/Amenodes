import { Node } from '../core/Node.js';
import { EditableTitle } from '../ui/EditableTitle.js';
import { replaceSymbols } from '../utils/SymbolMapper.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class OutputNode extends Node {
  constructor(id, x, y, title, rows) {
    super(id, 'output', x, y, title);
    this.rows = rows ?? [{ param: t('status.noConnections'), value: "—" }];
  }

  getValue() {
    const incoming = this.graph ? this.graph.getIncomingEdges(this.id) : [];
    if (!incoming.length) return [];
    const all = [];
    for (const edge of incoming) {
      const source = this.graph.getNode(edge.sourceId);
      if (!source) continue;
      const value = this.graph.getSourceValue(source, edge.sourcePort);
      if (Array.isArray(value)) all.push(...value);
      else if (value != null && !isNaN(value)) all.push(value);
    }
    return all;
  }

  toJSON() {
    return { ...super.toJSON(), rows: this.rows.map(r => ({ ...r })) };
  }

  getMinHeight() {
    return Math.max(80, 80 + this.rows.length * 35);
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'output-header');
    const tableDiv = document.createElement('div');
    tableDiv.className = 'data-table';
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const paramTh = document.createElement('th');
    paramTh.textContent = t('common.parameter');
    const valueTh = document.createElement('th');
    valueTh.textContent = t('common.value');
    headerRow.appendChild(paramTh);
    headerRow.appendChild(valueTh);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    this.rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      
      const tdParam = document.createElement('td');
      const paramEditor = new EditableTitle(row.param, (newParam) => {
        this.rows[idx].param = newParam;
        renderer.save();
      });
      paramEditor.displaySpan.style.minWidth = '160px';
      paramEditor.displaySpan.style.display = 'inline-block';
      tdParam.appendChild(paramEditor.getElement());
      
      const tdValue = document.createElement('td');
      const valueInput = document.createElement('input');
      valueInput.value = replaceSymbols(row.value);
      valueInput.disabled = true;
      tdValue.appendChild(valueInput);
      
      tr.appendChild(tdParam);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableDiv.appendChild(table);
    div.appendChild(tableDiv);
    
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    const unsubscribe = i18n.subscribe(() => {
      paramTh.textContent = t('common.parameter');
      valueTh.textContent = t('common.value');
    });
    
    const originalRemove = div.remove;
    div.remove = function() {
      unsubscribe();
      if (originalRemove) originalRemove.call(this);
    };
    
    return div;
  }
}
