import { NodeFactory } from '../nodes/NodeFactory.js';
import { i18n, t } from '../i18n/LanguageManager.js';
import { modal } from './CustomModal.js';

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
      const filtered = types.filter(type => 
        t(type.nameKey).toLowerCase().includes(query) ||
        t(type.descriptionKey).toLowerCase().includes(query) ||
        (type.author && type.author.toLowerCase().includes(query))
      );
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
    
    for (const nodeType of types) {
      const card = document.createElement('div');
      card.className = 'node-menu-card';
      card.setAttribute('data-type', nodeType.type);
      
      const icon = this.getNodeIcon(nodeType.type);
      
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
      
      card.querySelector('.node-menu-card-add').onclick = (e) => {
        e.stopPropagation();
        this.createNode(nodeType.type);
        this.close();
      };
      
      card.onclick = () => {
        this.createNode(nodeType.type);
        this.close();
      };
      
      container.appendChild(card);
    }
  }

  getNodeIcon(type) {
    const icons = {
      number: 'fa-hashtag',
      constant: 'fa-infinity',
      group: 'fa-layer-group',
      calc: 'fa-calculator',
      output: 'fa-chart-line',
      map: 'fa-map',
      confidenceInterval: 'fa-chart-simple'
    };
    return icons[type] || 'fa-circle';
  }

  createNode(type) {
    const rect = document.getElementById('viewport').getBoundingClientRect();
    const offset = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    
    const centerX = (rect.width / 2 - offset.x) / zoom;
    const centerY = (rect.height / 2 - offset.y) / zoom;
    
    let node;
    switch(type) {
      case 'number':
        node = NodeFactory.createNumberAt(centerX - 100, centerY - 40);
        break;
      case 'constant':
        modal.prompt('Enter value:', '0').then(value => {
          if (value !== null) {
            const num = parseFloat(value);
            const finalValue = isNaN(num) ? 0 : num;
            node = NodeFactory.createConstantAt(centerX - 100, centerY - 40, finalValue);
            this.graph.addNode(node);
            this.graph.reevaluateAll();
            this.graph.updateAllOutputs();
            this.renderer.render();
            if (this.renderer.history) this.renderer.save();
          }
        });
        return;
      case 'group':
        node = NodeFactory.createGroupAt(centerX - 120, centerY - 40);
        break;
      case 'calc':
        node = NodeFactory.createCalcAt(centerX - 100, centerY - 40, 'div3', t('calcTypes.div3'));
        break;
      case 'output':
        node = NodeFactory.createOutputAt(centerX - 100, centerY - 40);
        break;
      case 'map':
        node = NodeFactory.createMapAt(centerX - 120, centerY - 40);
        break;
      case 'confidenceInterval':
        node = NodeFactory.createConfidenceIntervalAt(centerX - 100, centerY - 40);
        break;
      default:
        return;
    }
    
    if (node && type !== 'constant') {
      this.graph.addNode(node);
      this.graph.reevaluateAll();
      this.graph.updateAllOutputs();
      this.renderer.render();
      if (this.renderer.history) this.renderer.save();
    }
  }

  close() {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.isOpen = false;
  }
}
