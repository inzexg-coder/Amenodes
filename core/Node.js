import { EditableTitle } from '../ui/EditableTitle.js';

export class Node {
  constructor(id, type, x, y, title) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.title = title;
    this.important = false;
    this.graph = null;
  }

  getValue() {
    return [];
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      title: this.title,
      important: this.important
    };
  }

  createDOM(graph, renderer) {
    throw new Error("Implement createDOM in subclass");
  }

  getMinHeight() {
    return 80;
  }

  createBaseDiv(graph, renderer, headerClass = 'node-header') {
    const div = document.createElement('div');
    div.className = 'node';
    div.setAttribute('data-id', this.id);
    div.setAttribute('data-type', this.type);
    div.style.left = this.x + 'px';
    div.style.top = this.y + 'px';
    div.style.position = 'absolute';
    div.style.zIndex = '20';
    if (this.important) div.classList.add('node-important');

    const header = document.createElement('div');
    header.className = headerClass;

    const titleEditor = new EditableTitle(this.title, (newTitle) => {
      this.title = newTitle;
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    });

    const actions = document.createElement('div');
    actions.className = 'node-actions';
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      graph.removeNode(this.id);
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    actions.appendChild(deleteBtn);

    header.appendChild(titleEditor.getElement());
    header.appendChild(actions);
    div.appendChild(header);

    return div;
  }
}
