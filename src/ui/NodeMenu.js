import { NodeFactory } from '../nodes/NodeFactory.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class NodeMenu {
  constructor(graph, renderer, viewport) {
    this.graph = graph;
    this.renderer = renderer;
    this.viewport = viewport;
    this.menuElement = null;
    this.button = null;
    this.isOpen = false;
  }

  init() {
    this.createButton();
  }

  createButton() {
    const toolbar = document.querySelector('.toolbar div:first-child');
    if (!toolbar) return;
    
    this.button = document.createElement('button');
    this.button.id = 'nodeMenuBtn';
    this.button.innerHTML = '<i class="fas fa-plus"></i>';
    this.button.title = t('toolbar.addNode');
    this.button.onclick = () => this.toggle();
    toolbar.appendChild(this.button);
    
    i18n.subscribe(() => {
      if (this.button) this.button.title = t('toolbar.addNode');
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.menuElement) this.close();
    
    const types = NodeFactory.getAvailableNodeTypes();
    if (!types.length) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'node-menu-overlay';
    
    const panel = document.createElement('div');
    panel.className = 'node-menu-panel';
    
    const header = document.createElement('div');
    header.className = 'node-menu-header';
    header.innerHTML = `
      <h3>${t('nodeMenu.title')}</h3>
      <button class="node-menu-close"><i class="fas fa-times"></i></button>
    `;
    panel.appendChild(header);
    
    const list = document.createElement('div');
    list.className = 'node-menu-list';
    
    for (const nodeType of types) {
      const card = document.createElement('div');
      card.className = 'node-menu-card';
      card.setAttribute('data-type', nodeType.type);
      
      const name = document.createElement('div');
      name.className = 'node-menu-card-name';
      name.innerHTML = `<i class="fas fa-cube"></i> ${t(nodeType.nameKey)}`;
      
      const desc = document.createElement('div');
      desc.className = 'node-menu-card-desc';
      desc.textContent = t(nodeType.descriptionKey);
      
      const meta = document.createElement('div');
      meta.className = 'node-menu-card-meta';
      meta.innerHTML = `
        <span><i class="fas fa-user"></i> ${nodeType.author || 'Amenoke'}</span>
        <a href="${nodeType.github || '#'}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
          <i class="fab fa-github"></i> GitHub
        </a>
      `;
      
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(meta);
      
      card.onclick = () => {
        this.createNode(nodeType.type);
        this.close();
      };
      
      list.appendChild(card);
    }
    
    panel.appendChild(list);
    overlay.appendChild(panel);
    
    overlay.onclick = (e) => {
      if (e.target === overlay) this.close();
    };
    
    header.querySelector('.node-menu-close').onclick = () => this.close();
    
    document.body.appendChild(overlay);
    this.menuElement = overlay;
    this.isOpen = true;
  }

  createNode(type) {
    const viewportRect = document.getElementById('viewport').getBoundingClientRect();
    const offset = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    
    const centerX = (viewportRect.width / 2 - offset.x) / zoom - 140;
    const centerY = (viewportRect.height / 2 - offset.y) / zoom - 40;
    
    const node = NodeFactory.createNode(type, { x: centerX, y: centerY });
    this.graph.addNode(node);
    this.graph.reevaluateAll();
    this.graph.updateAllOutputs();
    this.renderer.render();
    this.renderer.save();
  }

  close() {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.isOpen = false;
  }
}
