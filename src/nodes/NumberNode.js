import { Node } from '../core/Node.js';

export const metadata = {
  type: 'number',
  nameKey: 'nodes.number',
  descriptionKey: 'nodeDescriptions.number',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-hashtag',
  dataType: 'num',
  canHaveIncomingEdges: false,
  canHaveOutgoingEdges: true,
  allowedInputTypes: [],
  defaultValue: 0
  visual3d: { color: 0x9060ff, size: 0.55, dendrites: 5, glow: '#8866ff' },
};

export class NumberNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'number', x, y, title, options);
    this.value = options.val ?? 0;
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
    
    return div;
  }

  getConfigHTML() {
    return '<div class="info-field"><label class="info-label">Value</label><input class="info-input" id="cfgValue" type="number" step="any" value="' + (this.value ?? 0) + '" /></div>';
  }

  bindConfig(doc, node, app) {
    var inp = doc.getElementById('cfgValue');
    if (inp) inp.onchange = function() { node.value = parseFloat(this.value) || 0; app.graph.reevaluateAll(); app.scene.refresh(); app.graph.setDirty(true); };
  }
}
