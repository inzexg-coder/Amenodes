import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from '../ui/CustomModal.js';
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
        this.show(parseInt(this.currentMenu.style.left), parseInt(this.currentMenu.style.top), this.currentSourceId);
      }
    });
  }

  getNodeScreenPosition(sourceNode) {
    if (sourceNode && this.viewport) {
      const offset = this.viewport.getOffset();
      const zoom = window.currentZoom || 1;
      const sourceScreenX = sourceNode.x + offset.x / zoom + 140;
      const sourceScreenY = sourceNode.y + offset.y / zoom + 40;
      return {
        x: sourceScreenX + 20,
        y: sourceScreenY + 60
      };
    }
    
    const rect = document.getElementById('viewport').getBoundingClientRect();
    return {
      x: rect.width / 2 - 140,
      y: rect.height / 2 - 40
    };
  }

  show(x, y, sourceId) {
    this.close();
    
    this.currentSourceId = sourceId;
    
    const menu = document.createElement('div');
    menu.className = 'node-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    const sourceNode = this.graph.getNode(sourceId);
    const { x: baseX, y: baseY } = this.getNodeScreenPosition(sourceNode);
    this.currentBaseX = baseX;
    this.currentBaseY = baseY;

    const allTypes = NodeFactory.getAvailableNodeTypes();
    
    const categories = allTypes.filter(t => t.isCategory === true);
    const regularNodes = allTypes.filter(t => !t.isCategory);
    
    this.addMenuItem(menu, t('contextMenu.outputAndConnect'), () => {
      this.createAndConnect('output', baseX, baseY, sourceId);
    });
    
    if (categories.length > 0 || regularNodes.length > 0) {
      menu.appendChild(document.createElement('hr'));
    }
    
    for (const category of categories) {
      const submenuItems = (category.subnodes || []).map(subnode => ({
        text: t(subnode.nameKey),
        type: category.type,
        subnode: subnode,
        title: t(subnode.nameKey)
      }));
      
      const submenuContainer = this.createSubmenu(
        t(category.nameKey) + ' ▸',
        submenuItems,
        (type, subnode, title) => {
          this.createAndConnect(type, baseX, baseY, sourceId, { title, ...subnode });
        }
      );
      menu.appendChild(submenuContainer);
    }
    
    for (const nodeType of regularNodes) {
      this.addMenuItem(menu, t(nodeType.nameKey), () => {
        this.createAndConnect(nodeType.type, baseX, baseY, sourceId);
      });
    }
    
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
        onSelect(item.type, item.subnode, item.title);
        this.close();
      };
      submenu.appendChild(subItem);
    }
    
    container.appendChild(titleEl);
    container.appendChild(submenu);
    return container;
  }

  async createAndConnect(nodeType, x, y, sourceId, extraOptions = {}) {
    const NodeClass = NodeFactory.getNodeClass(nodeType);
    let node = null;
    
    if (NodeClass && typeof NodeClass.onCreate === 'function') {
      node = await NodeClass.onCreate(this.graph, x + 20, y + 80, extraOptions);
      if (node && !this.graph.nodes.includes(node)) {
        this.graph.addNode(node);
      }
    } else {
      node = NodeFactory.createNode(nodeType, {
        x: x + 20,
        y: y + 80,
        ...extraOptions
      });
      if (node) {
        this.graph.addNode(node);
      }
    }
    
    if (node) {
      if (typeof node.getMinHeight !== 'function') {
        node.getMinHeight = function() { return 80; };
      }
      
      await this.ensureNodeReady(node);
      
      const edge = this.graph.addEdge(sourceId, node.id, 'main');
      if (edge) {
        this.graph.reevaluateAll();
        this.renderer.render();
        this.history.save();
      }
      
      this.finishNodeCreation();
    }
  }

  async ensureNodeReady(node) {
    return new Promise((resolve) => {
      const checkReady = () => {
        const typeSystem = window.app?.typeSystem || window._typeSystem;
        const nodeType = node.constructor.metadata?.dataType;
        
        if (typeSystem && nodeType && typeSystem.typeDefinitions?.has(nodeType)) {
          resolve();
        } else {
          setTimeout(checkReady, 5);
        }
      };
      
      if (node.constructor.metadata && node.constructor.metadata.dataType) {
        const typeSystem = window.app?.typeSystem || window._typeSystem;
        const dataType = node.constructor.metadata.dataType;
        
        if (typeSystem && !typeSystem.typeDefinitions?.has(dataType)) {
          typeSystem.registerType(dataType, {
            name: dataType,
            canHaveIncomingEdges: node.constructor.metadata.canHaveIncomingEdges ?? true,
            canHaveOutgoingEdges: node.constructor.metadata.canHaveOutgoingEdges ?? true,
            allowedInputTypes: node.constructor.metadata.allowedInputTypes ?? [],
            defaultValue: node.constructor.metadata.defaultValue ?? null
          });
        }
      }
      
      setTimeout(checkReady, 5);
    });
  }

  finishNodeCreation() {
    this.graph.reevaluateAll();
    this.graph.updateAllOutputs();
    this.renderer.render();
    this.history.save();
    
    const nodeCountEl = document.getElementById('nodeCount');
    if (nodeCountEl) {
      nodeCountEl.textContent = `${this.graph.nodes.length} nodes`;
    }
    const edgeCountEl = document.getElementById('edgeCount');
    if (edgeCountEl) {
      edgeCountEl.textContent = `${this.graph.edges.length} connections`;
    }
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
