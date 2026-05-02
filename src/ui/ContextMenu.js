import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from './CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class ContextMenu {
  constructor(graph, renderer, history, viewport) {
    this.graph = graph;
    this.renderer = renderer;
    this.history = history;
    this.viewport = viewport;
    this.currentMenu = null;
    this.currentSourceId = null;
    this.currentBaseX = null;
    this.currentBaseY = null;

    i18n.subscribe(() => {
      if (this.currentMenu && this.currentSourceId !== null) {
        this.show(this.currentMenu.style.left, this.currentMenu.style.top, this.currentSourceId);
      }
    });
  }

  show(x, y, sourceId) {
    this.close();
    
    this.currentSourceId = sourceId;
    
    const menu = document.createElement('div');
    menu.className = 'node-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    const sourceNode = this.graph.getNode(sourceId);
    const baseX = sourceNode ? sourceNode.x + 280 : 500;
    const baseY = sourceNode ? sourceNode.y + 300 : 300;
    this.currentBaseX = baseX;
    this.currentBaseY = baseY;

    this.addMenuItem(menu, t('contextMenu.outputAndConnect'), () => this.createAndConnect('output', baseX, baseY, sourceId));
    
    menu.appendChild(document.createElement('hr'));
    
    const submenuContainer = this.createSubmenu(t('contextMenu.errors') + ' ▸', [
      { text: t('contextMenu.measurementError'), type: 'div3', title: t('calcTypes.div3') },
      { text: t('contextMenu.roundingError'), type: 'div_sqrt12', title: t('calcTypes.div_sqrt12') },
      { text: t('contextMenu.totalError'), type: 'sqrt_sum_sq', title: t('calcTypes.sqrt_sum_sq') }
    ], (calcType, title) => {
      const node = NodeFactory.createCalcAt(baseX + 20, baseY + 160, calcType, title);
      this.graph.addNode(node);
      this.graph.addEdge(sourceId, node.id, 'main');
      this.finishNodeCreation();
    });
    menu.appendChild(submenuContainer);
    
    this.addMenuItem(menu, t('contextMenu.mapTransform'), () => this.createAndConnect('map', baseX, baseY, sourceId));
    
    menu.appendChild(document.createElement('hr'));
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

  createSubmenu(title, items, onSelect) {
    const container = document.createElement('div');
    container.className = 'node-menu-sub';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'node-menu-item';
    titleEl.textContent = title;
    
    const submenu = document.createElement('div');
    submenu.className = 'node-menu-submenu';
    
    for (const item of items) {
      const subItem = document.createElement('div');
      subItem.className = 'node-menu-item';
      subItem.textContent = item.text;
      subItem.onclick = () => {
        onSelect(item.type, item.title);
        this.close();
      };
      submenu.appendChild(subItem);
    }
    
    container.appendChild(titleEl);
    container.appendChild(submenu);
    return container;
  }

  createAndConnect(nodeType, x, y, sourceId) {
    let node;
    switch(nodeType) {
      case 'number': node = NodeFactory.createNumberAt(x, y); break;
      case 'group': node = NodeFactory.createGroupAt(x, y); break;
      case 'output': node = NodeFactory.createOutputAt(x, y); break;
      case 'map': node = NodeFactory.createMapAt(x, y); break;
      default: return;
    }
    this.graph.addNode(node);
    this.graph.addEdge(sourceId, node.id, 'main');
    this.finishNodeCreation();
  }

  finishNodeCreation() {
    this.graph.reevaluateAll();
    this.graph.updateAllOutputs();
    this.renderer.render();
    this.history.save();
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
