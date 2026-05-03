import { Node } from '../core/Node.js';

export class ConstantNode extends Node {
  constructor(id, x, y, title, value) {
    super(id, 'constant', x, y, title);
    this.value = value ?? 0;
    this.isConstant = true;
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
    `;
    
    content.appendChild(valueDisplay);
    div.appendChild(content);
    renderer.addHandles(div, this.id, null);
    renderer.applyOptStyles(div);
    
    return div;
  }
}
