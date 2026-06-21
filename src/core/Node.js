import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n } from '../i18n/LanguageManager.js';

export class Node {
  constructor(id, type, x, y, title, options = {}) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.title = title;
    this.important = false;
    this.graph = null;
    this.originalTitle = title;
    this.titleEditor = null;
    this.unsubscribeI18n = null;
    this.dirtyIndicator = null;
    this.unsubscribeDirty = null;

    Object.assign(this, options);
  }

  getValue() {
    return [];
  }

  getOutputValue(port = 'main', visited = new Set(), graph = null) {
    return this.getValue();
  }

  canAcceptEdge(source, port = 'main') {
    const meta = this.constructor && this.constructor.metadata;
    if (meta && meta.canHaveIncomingEdges === false) {
      return { ok: false };
    }
    return { ok: true };
  }

  onAttach(graph) {
    this.graph = graph;
  }

  onDetach() {
    this.graph = null;
  }

  reevaluate(graph) {
  }

  updateDisplay(graph) {
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

  updateTitleTranslation() {
    if (this.title !== this.originalTitle) {
      return;
    }
    const newTitle = this.getLocalizedTitle();
    if (this.title !== newTitle) {
      this.title = newTitle;
      this.originalTitle = newTitle;
      if (this.titleEditor) {
        this.titleEditor.setValue(newTitle);
      }
    }
  }

  setTitle(newTitle) {
    this.title = newTitle;
    this.originalTitle = newTitle;
    if (this.titleEditor) {
      this.titleEditor.setValue(newTitle);
    }
    if (this.graph && this.graph.history) {
      this.graph.history.save();
    }
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
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '6px';

    let displayTitle = this.title;

    const self = this;

    this.titleEditor = new EditableTitle(displayTitle, (newTitle) => {
      self.title = newTitle;
      self.originalTitle = newTitle;

      graph.reevaluateAll();
      renderer.render();
      renderer.save();

      if (graph && graph.setDirty) {
        graph.setDirty(true);
      }
    });

    this.dirtyIndicator = document.createElement('span');
    this.dirtyIndicator.textContent = '*';
    this.dirtyIndicator.style.color = window.__premiumAccent ? window.__premiumAccent() : '#ffb347';
    this.dirtyIndicator.style.fontSize = '14px';
    this.dirtyIndicator.style.fontWeight = 'bold';
    this.dirtyIndicator.style.marginLeft = '4px';
    this.dirtyIndicator.style.display = 'none';
    this.dirtyIndicator.title = 'Unsaved changes';
    this.dirtyIndicator.classList.add('dirty-indicator');

    titleContainer.appendChild(this.titleEditor.getElement());
    titleContainer.appendChild(this.dirtyIndicator);

    const actions = document.createElement('div');
    actions.className = 'node-actions';
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete node';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.unsubscribeI18n) this.unsubscribeI18n();
      if (this.unsubscribeDirty) this.unsubscribeDirty();
      graph.removeNode(this.id);
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    actions.appendChild(deleteBtn);

    header.appendChild(titleContainer);
    header.appendChild(actions);
    div.appendChild(header);

    const updateDirtyIndicator = (isDirty) => {
      if (this.dirtyIndicator) {
        this.dirtyIndicator.style.display = isDirty ? 'inline' : 'none';
      }
    };

    if (graph && typeof graph.onDirtyChange === 'function') {
      this.unsubscribeDirty = graph.onDirtyChange(updateDirtyIndicator);
    }

    if (this.unsubscribeI18n) this.unsubscribeI18n();
    this.unsubscribeI18n = i18n.subscribe(() => {
      if (self.title === self.originalTitle) {
        const newTitle = self.getLocalizedTitle();
        if (self.title !== newTitle) {
          self.title = newTitle;
          self.originalTitle = newTitle;
          if (self.titleEditor) {
            self.titleEditor.setValue(newTitle);
          }
        }
      }
    });

    const originalRemove = div.remove;
    div.remove = function() {
      if (self.unsubscribeI18n) self.unsubscribeI18n();
      if (self.unsubscribeDirty) self.unsubscribeDirty();
      if (originalRemove) originalRemove.call(this);
    };

    renderer.applyOptStyles(div);

    return div;
  }

  createDOM(graph, renderer) {
    throw new Error("Implement createDOM in subclass");
  }
}
