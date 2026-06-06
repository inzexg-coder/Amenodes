import { Node } from '../core/Node.js';
import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'group',
  nameKey: 'nodes.group',
  descriptionKey: 'nodeDescriptions.group',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-layer-group',
  dataType: 'array',
  canHaveIncomingEdges: false,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [],
  defaultValue: []
  visual3d: { color: 0x30b080, size: 0.55, dendrites: 6, glow: '#33bb88' },
};

export class GroupNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'group', x, y, title, options);
    this.values = options.vals ?? [{ name: `${t('common.value')} 1`, val: 0 }];
  }

  getValue() {
    if (!this.values || !Array.isArray(this.values)) {
      return [];
    }
    return this.values.map(v => typeof v.val === 'number' ? v.val : parseFloat(v.val))
      .filter(v => !isNaN(v));
  }

  toJSON() {
    return { ...super.toJSON(), vals: this.values?.map(v => ({ ...v })) ?? [] };
  }

  getMinHeight() {
    const valuesCount = this.values?.length ?? 1;
    return Math.max(80, 80 + valuesCount * 40);
  }

  bindConfig(doc, node, app) {
    var groupAdd = doc.getElementById('cfgGroupAdd');
    if (groupAdd) groupAdd.onclick = function() {
      if (!node.values) node.values = [];
      node.values.push({ val: 0, name: '' });
      app.mobileUI._showNodeConfig(node);
      app.graph.setDirty(true);
    };
    if (node.values) {
      node.values.forEach(function(v, idx) {
        var valInp = doc.getElementById('cfgGVal_' + idx);
        if (valInp) valInp.onchange = function() { node.values[idx].val = parseFloat(this.value) || 0; app.graph.reevaluateAll(); app.scene.refresh(); app.graph.setDirty(true); };
        var nameInp = doc.getElementById('cfgGName_' + idx);
        if (nameInp) nameInp.onchange = function() { node.values[idx].name = this.value; app.graph.setDirty(true); };
        var delBtn = doc.getElementById('cfgGDel_' + idx);
        if (delBtn) delBtn.onclick = function() { node.values.splice(idx, 1); app.mobileUI._showNodeConfig(node); app.graph.reevaluateAll(); app.scene.refresh(); app.graph.setDirty(true); };
      });
    }
  }

  getConfigHTML() {
    var vals = this.values || [];
    var html = '<div class="info-field"><label class="info-label">Values (' + vals.length + ')</label><div class="info-list" id="cfgGroupList">';
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i];
      html += '<div class="info-list-item">';
      html += '<span class="info-list-idx">#' + (i+1) + '</span>';
      html += '<input class="info-input-sm" id="cfgGVal_' + i + '" type="number" step="any" value="' + (v.val ?? 0) + '" placeholder="val" />';
      html += '<input class="info-input-sm" id="cfgGName_' + i + '" type="text" value="' + (v.name ?? '') + '" placeholder="name" style="flex:0.6" />';
      html += '<button class="info-list-del" id="cfgGDel_' + i + '">✕</button>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="cfg-btn cfg-btn-add" id="cfgGroupAdd">+ Add Value</button>';
    html += '</div>';
    return html;
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'group-header');
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'group-items';
    
    if (!this.values || !this.values.length) {
      this.values = [{ name: `${t('common.value')} 1`, val: 0 }];
    }
    
    const update = () => {
      renderer.invalidateCache(this.id);
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
      if (graph && graph.setDirty) graph.setDirty(true);
    };

    itemsContainer.innerHTML = '';
    
    this.values.forEach((val, idx) => {
      const row = document.createElement('div');
      row.className = 'group-row';
      
      const nameEditor = new EditableTitle(val.name, (newName) => {
        this.values[idx].name = newName;
        update();
      });
      nameEditor.displaySpan.style.width = '90px';
      nameEditor.displaySpan.style.display = 'inline-block';
      
      const valueInput = document.createElement('input');
      valueInput.type = 'number';
      valueInput.value = val.val;
      valueInput.step = "any";
      valueInput.className = 'group-row-value';
      valueInput.onchange = () => {
        this.values[idx].val = parseFloat(valueInput.value) || 0;
        update();
      };
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.style.cssText = 'background:none;border:none;color:#ffaa88;cursor:pointer';
      if (this.values.length > 1) {
        removeBtn.onclick = () => {
          this.values.splice(idx, 1);
          update();
        };
      } else {
        removeBtn.disabled = true;
        removeBtn.style.opacity = '0.5';
      }
      
      row.appendChild(nameEditor.getElement());
      row.appendChild(valueInput);
      row.appendChild(removeBtn);
      itemsContainer.appendChild(row);
    });
    
    const addBtn = document.createElement('button');
    addBtn.textContent = t('group.addValue');
    addBtn.className = 'add-value-btn';
    addBtn.onclick = () => {
      const newValueName = `${t('common.value')} ${this.values.length + 1}`;
      this.values.push({ name: newValueName, val: 0 });
      update();
    };
    itemsContainer.appendChild(addBtn);
    
    div.appendChild(itemsContainer);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    const unsubscribe = i18n.subscribe(() => {
      addBtn.textContent = t('group.addValue');
    });
    
    const originalRemove = div.remove;
    div.remove = function() {
      unsubscribe();
      if (originalRemove) originalRemove.call(this);
    };
    
    return div;
  }
}
