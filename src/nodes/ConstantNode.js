import { Node } from '../core/Node.js';

console.log('[ConstantNode] Module loading');

export class ConstantNode extends Node {
  constructor(id, x, y, title, value) {
    console.log('[ConstantNode] ===== CONSTRUCTOR CALLED =====');
    console.log('[ConstantNode] Args:', { id, x, y, title, value });
    
    super(id, 'constant', x, y, title);
    this.value = value ?? 0;
    this.isConstant = true;
    
    console.log('[ConstantNode] After assignment:', {
      id: this.id,
      type: this.type,
      value: this.value,
      title: this.title
    });
  }

  getValue() {
    console.log('[ConstantNode] getValue called for id', this.id, 'returning:', [this.value]);
    return [this.value];
  }

  toJSON() {
    const json = { ...super.toJSON(), val: this.value };
    console.log('[ConstantNode] toJSON called:', json);
    return json;
  }

  createDOM(graph, renderer) {
    console.log('[ConstantNode] createDOM for id', this.id, 'value:', this.value);
    
    const div = this.createBaseDiv(graph, renderer);
    const content = document.createElement('div');
    content.className = 'empty-node-content';

    const valueDisplay = document.createElement('div');
    valueDisplay.textContent = this.value;
    valueDisplay.style.cssText = `
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      font-family: monospace;
      background: #0f1222;
      border: 1px solid #4a6a8a;
      border-radius: 8px;
      padding: 8px;
      color: #ffaa55;
      cursor: pointer;
    `;
    
    valueDisplay.onclick = (e) => {
      e.stopPropagation();
      console.log('[ConstantNode] Value display clicked, current value:', this.value);
      const newValue = prompt('Введите новое значение:', this.value);
      console.log('[ConstantNode] Prompt returned:', newValue);
      if (newValue !== null) {
        const parsed = parseFloat(newValue);
        if (!isNaN(parsed)) {
          this.value = parsed;
          valueDisplay.textContent = this.value;
          console.log('[ConstantNode] Value updated to:', this.value);
          graph.reevaluateAll();
          renderer.render();
          renderer.save();
        }
      }
    };
    
    content.appendChild(valueDisplay);
    div.appendChild(content);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    this.addClickHandler(div, renderer);
    return div;
  }

  addClickHandler(div, renderer) {
    div.onclick = (e) => {
      if (e.target.closest('.node-handle') || e.target.closest('input') || 
          e.target.closest('button') || e.target.closest('.title-editable')) return;
      e.stopPropagation();
      document.querySelectorAll('.node').forEach(el => el.classList.remove('node-temp-selected'));
      div.classList.add('node-temp-selected');
      setTimeout(() => div.classList.remove('node-temp-selected'), 800);
    };
  }
}

console.log('[ConstantNode] Module loaded');
