import { Node } from '../core/Node.js';
import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n } from '../i18n/LanguageManager.js';

export class GroupNode extends Node {
  constructor(id, x, y, title, values) {
    super(id, 'group', x, y, title);
    this.values = values ?? [{ name: `${i18n.t('common.value')} 1`, val: 0 }];
  }

  getValue() {
    return this.values.map(v => typeof v.val === 'number' ? v.val : parseFloat(v.val))
      .filter(v => !isNaN(v));
  }

  toJSON() {
    return { ...super.toJSON(), vals: this.values.map(v => ({ ...v })) };
  }

  getMinHeight() {
    return Math.max(80, 80 + this.values.length * 40);
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'group-header');
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'group-items';
    
    const update = () => {
      renderer.invalidateCache(this.id);
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };

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
      }
      
      row.appendChild(nameEditor.getElement());
      row.appendChild(valueInput);
      row.appendChild(removeBtn);
      itemsContainer.appendChild(row);
    });
    
    const addBtn = document.createElement('button');
    addBtn.textContent = i18n.t('group.addValue');
    addBtn.className = 'add-value-btn';
    addBtn.onclick = () => {
      const newValueName = `${i18n.t('common.value')} ${this.values.length + 1}`;
      this.values.push({ name: newValueName, val: 0 });
      update();
    };
    itemsContainer.appendChild(addBtn);
    
    div.appendChild(itemsContainer);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    const unsubscribe = i18n.subscribe(() => {
      addBtn.textContent = i18n.t('group.addValue');
    });
    
    const originalRemove = div.remove;
    div.remove = function() {
      unsubscribe();
      if (originalRemove) originalRemove.call(this);
    };
    
    return div;
  }
}
