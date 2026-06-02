import { NodeFactory } from '../nodes/NodeFactory.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class ContextMenu {
  constructor(graph, renderer, history, viewport) {
    this.graph = graph;
    this.renderer = renderer;
    this.history = history;
    this.viewport = viewport;
    this.currentMenu = null;
    this.currentSourceId = null;
  }

  show(x, y, sourceId) {
    this.close();
    
    this.currentSourceId = sourceId;
    
    const menu = document.createElement('div');
    menu.className = 'node-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    const sourceNode = this.graph.getNode(sourceId);
    
    this.addMenuItem(menu, t('contextMenu.markImportant'), () => this.toggleImportant(sourceNode, true));
    this.addMenuItem(menu, t('contextMenu.unmarkImportant'), () => this.toggleImportant(sourceNode, false));
    
    document.body.appendChild(menu);
    this.currentMenu = menu;
    
    setTimeout(() => {
      const closeHandler = (ev) => {
        if (!menu.contains(ev.target)) {
          this.close();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 10);
  }

  addMenuItem(menu, text, onClick) {
    const item = document.createElement('div');
    item.className = 'node-menu-item';
    item.textContent = text;
    item.onclick = () => {
      onClick();
      this.close();
    };
    menu.appendChild(item);
  }

  toggleImportant(node, important) {
    if (node) {
      node.important = important;
      this.renderer.updateNodeClass(node);
      this.renderer.render();
      this.history.save();
    }
  }

  close() {
    if (this.currentMenu) {
      this.currentMenu.remove();
      this.currentMenu = null;
    }
    this.currentSourceId = null;
  }
}
