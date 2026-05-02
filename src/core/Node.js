import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n } from '../i18n/LanguageManager.js';

export class Node {
  constructor(id, type, x, y, title) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.title = title;
    this.important = false;
    this.graph = null;
    this.originalTitle = title; 
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
      important: this.important,
      originalTitle: this.originalTitle
    };
  }

  getLocalizedTitle() {
    if (this.title !== this.originalTitle) {
      return this.title;
    }
    const translated = i18n.t(`nodes.${this.type}`);
    if (translated !== `nodes.${this.type}`) {
      return translated;
    }
    return this.title;
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

    const localizedTitle = this.getLocalizedTitle();
    const titleEditor = new EditableTitle(localizedTitle, (newTitle) => {
      this.title = newTitle;
      this.originalTitle = newTitle;
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
