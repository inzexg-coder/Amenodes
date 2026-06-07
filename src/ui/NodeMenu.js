import { NodeFactory } from '../nodes/NodeFactory.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class NodeMenu {
  constructor(graph, renderer, viewport) {
    this.graph = graph;
    this.renderer = renderer;
    this.viewport = viewport;
    this.menuElement = null;
    this.isOpen = false;
    this.unsubscribeI18n = null;
  }

  init() {
    const addNodeBtn = document.getElementById('addNodeBtn');
    if (addNodeBtn) {
      addNodeBtn.onclick = () => this.toggle();
    }
    this.unsubscribeI18n = i18n.subscribe(() => {
      if (this.isOpen) {
        this.close();
        this.open();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  getCenterPosition() {
    const rect = document.getElementById('viewport').getBoundingClientRect();
    const offset = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    
    return {
      x: (rect.width / 2 - offset.x) / zoom - 100,
      y: (rect.height / 2 - offset.y) / zoom - 40
    };
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
      <h3><i class="fas fa-cubes"></i> ${t('nodeMenu.title')}</h3>
      <button class="node-menu-close"><i class="fas fa-times"></i></button>
    `;
    
    const searchBox = document.createElement('div');
    searchBox.className = 'node-menu-search';
    searchBox.innerHTML = `
      <i class="fas fa-search"></i>
      <input type="text" placeholder="${t('nodeMenu.search')}" id="nodeMenuSearch">
    `;
    
    const list = document.createElement('div');
    list.className = 'node-menu-list';
    
    header.querySelector('.node-menu-close').onclick = () => this.close();
    
    panel.appendChild(header);
    panel.appendChild(searchBox);
    panel.appendChild(list);
    overlay.appendChild(panel);
    
    this.renderNodeList(types, list);
    
    const searchInput = searchBox.querySelector('#nodeMenuSearch');
    searchInput.oninput = () => {
      const query = searchInput.value.toLowerCase();
      const filtered = types.filter(type => {
        const name = t(type.nameKey).toLowerCase();
        const desc = t(type.descriptionKey).toLowerCase();
        const author = (type.author || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || author.includes(query);
      });
      this.renderNodeList(filtered, list);
    };
    
    overlay.onclick = (e) => {
      if (e.target === overlay) this.close();
    };
    
    document.body.appendChild(overlay);
    this.menuElement = overlay;
    this.isOpen = true;
    
    setTimeout(() => searchInput.focus(), 100);
  }

  renderNodeList(types, container) {
    container.innerHTML = '';
    
    const categories = types.filter(t => t.isCategory === true);
    const regularNodes = types.filter(t => !t.isCategory);
    
    for (const category of categories) {
      this.renderCategoryCard(category, container);
    }
    
    for (const nodeType of regularNodes) {
      this.renderNodeCard(nodeType, container);
    }
  }

  renderCategoryCard(category, container) {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'node-menu-card node-menu-category';
    
    const icon = category.icon || 'fa-folder';
    const name = t(category.nameKey);
    const description = t(category.descriptionKey);
    
    categoryCard.innerHTML = `
      <div class="node-menu-card-icon"><i class="fas ${icon}"></i></div>
      <div class="node-menu-card-info">
        <div class="node-menu-card-name">${name}</div>
        <div class="node-menu-card-desc">${description}</div>
        <div class="node-menu-card-meta">
          <span class="node-menu-card-author"><i class="fas fa-user"></i> ${category.author || 'Amenoke'}</span>
          ${category.github ? `<a href="${category.github}" target="_blank" class="node-menu-card-github"><i class="fab fa-github"></i></a>` : ''}
        </div>
      </div>
      <div class="node-menu-card-expand"><i class="fas fa-chevron-right"></i></div>
    `;
    
    const submenuContainer = document.createElement('div');
    submenuContainer.className = 'node-menu-submenu-container';
    submenuContainer.style.display = 'none';
    
    if (category.subnodes && category.subnodes.length) {
      for (const subnode of category.subnodes) {
        const subCard = document.createElement('div');
        subCard.className = 'node-menu-subcard';
        subCard.innerHTML = `
          <div class="node-menu-subcard-icon"><i class="fas fa-microchip"></i></div>
          <div class="node-menu-subcard-info">
            <div class="node-menu-subcard-name">${t(subnode.nameKey)}</div>
          </div>
          <div class="node-menu-card-add"><i class="fas fa-plus-circle"></i></div>
        `;
        
        subCard.onclick = async (e) => {
          e.stopPropagation();
          await this.createNodeByType(category.type, subnode);
          this.close();
        };
        
        submenuContainer.appendChild(subCard);
      }
    }
    
    categoryCard.appendChild(submenuContainer);
    
    categoryCard.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = submenuContainer.style.display === 'flex';
      submenuContainer.style.display = isExpanded ? 'none' : 'flex';
      const icon = categoryCard.querySelector('.node-menu-card-expand i');
      if (icon) {
        icon.className = isExpanded ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
      }
    };
    
    container.appendChild(categoryCard);
  }

  renderNodeCard(nodeType, container) {
    const card = document.createElement('div');
    card.className = 'node-menu-card';
    card.setAttribute('data-type', nodeType.type);
    
    const icon = nodeType.icon || 'fa-circle';
    const name = t(nodeType.nameKey);
    const description = t(nodeType.descriptionKey);
    
    card.innerHTML = `
      <div class="node-menu-card-icon"><i class="fas ${icon}"></i></div>
      <div class="node-menu-card-info">
        <div class="node-menu-card-name">${name}</div>
        <div class="node-menu-card-desc">${description}</div>
        <div class="node-menu-card-meta">
          <span class="node-menu-card-author"><i class="fas fa-user"></i> ${nodeType.author || 'Amenoke'}</span>
          ${nodeType.github ? `<a href="${nodeType.github}" target="_blank" class="node-menu-card-github"><i class="fab fa-github"></i></a>` : ''}
        </div>
      </div>
      <div class="node-menu-card-add"><i class="fas fa-plus-circle"></i></div>
    `;
    
    card.querySelector('.node-menu-card-add').onclick = async (e) => {
      e.stopPropagation();
      await this.createNode(nodeType.type);
      this.close();
    };
    
    card.onclick = async () => {
      await this.createNode(nodeType.type);
      this.close();
    };
    
    container.appendChild(card);
  }

  async createNodeByType(categoryType, subnode) {
    try {
      const { x, y } = this.getCenterPosition();
      
      const options = { x, y };
      Object.assign(options, subnode);
      
      const node = await NodeFactory.createNode(categoryType, options);
      
      if (node) {
        this.graph.addNode(node);
        this.finishNodeCreation();
      }
    } catch (err) {
      console.error('[NodeMenu] Failed to create node by type:', err);
    }
  }

  async createNode(type) {
    try {
      const { x, y } = this.getCenterPosition();
      const options = { x, y };
      
      const node = await NodeFactory.createNode(type, options);
      
      if (node) {
        this.graph.addNode(node);
        this.finishNodeCreation();
      }
    } catch (err) {
      console.error('[NodeMenu] Failed to create node:', err);
    }
  }

  finishNodeCreation() {
    this.graph.reevaluateAll();
    this.graph.updateAllOutputs();
    this.renderer.render();
    if (this.renderer.history) this.renderer.save();
    const nodeCountEl = document.getElementById('nodeCount');
    if (nodeCountEl) {
      nodeCountEl.textContent = `${this.graph.nodes.length} nodes`;
    }
  }

  close() {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.isOpen = false;
  }

  destroy() {
    if (this.unsubscribeI18n) {
      this.unsubscribeI18n();
      this.unsubscribeI18n = null;
    }
    this.close();
  }
}
