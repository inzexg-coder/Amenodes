import { Node } from '../core/Node.js';
import { modal } from '../ui/CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'constant',
  nameKey: 'nodes.constant',
  descriptionKey: 'nodeDescriptions.constant',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-infinity',
};

export class ConstantNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'constant', x, y, title, options);
    this.value = options.val ?? 0;
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

  static async onCreate(graph, x, y, options = {}) {
    const value = await modal.prompt(t('modal.enterValue'), '0');
    if (value === null) return null;
    
    const numValue = parseFloat(value);
    const finalValue = isNaN(numValue) ? 0 : numValue;
    
    const defaultTitle = i18n.t('nodes.constant');
    const node = new ConstantNode(null, x, y, defaultTitle, { val: finalValue });
    
    if (graph) {
      graph.addNode(node);
    }
    
    return node;
  }
}
