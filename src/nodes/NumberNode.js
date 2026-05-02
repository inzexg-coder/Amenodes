import { Node } from '../core/Node.js';

export class NumberNode extends Node {
  constructor(id, x, y, title, value) {
    super(id, 'number', x, y, title);
    this.value = value ?? 0;
  }

  getValue() {
    return [this.value];
  }

  toJSON() {
    return { ...super.toJSON(), val: this.value };
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer);
    const content = document.createElement('div');
    content.className = 'empty-node-content';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = this.value;
    input.step = "any";
    input.onchange = () => {
      this.value = parseFloat(input.value) || 0;
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    
    content.appendChild(input);
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
