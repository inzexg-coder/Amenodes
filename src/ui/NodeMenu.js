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
    var self = this;
    
    if (document.getElementById('nodeMenuBtn')) {
      return;
    }
    
    var redoBtn = document.getElementById('redoBtn');
    
    if (redoBtn) {
      this.button = document.createElement('button');
      this.button.id = 'nodeMenuBtn';
      this.button.innerHTML = '<i class="fas fa-plus"></i>';
      this.button.title = t('toolbar.addNode');
      this.button.onclick = function() { self.toggle(); };
      redoBtn.insertAdjacentElement('afterend', this.button);
    } else {
      var toolbarLeft = document.querySelector('.toolbar-left');
      if (toolbarLeft) {
        this.button = document.createElement('button');
        this.button.id = 'nodeMenuBtn';
        this.button.innerHTML = '<i class="fas fa-plus"></i>';
        this.button.title = t('toolbar.addNode');
        this.button.onclick = function() { self.toggle(); };
        toolbarLeft.appendChild(this.button);
      }
    }
    
    i18n.subscribe(function() {
      if (self.button) self.button.title = t('toolbar.addNode');
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
    
    var types = NodeFactory.getAvailableNodeTypes();
    if (!types.length) return;
    
    var overlay = document.createElement('div');
    overlay.className = 'node-menu-overlay';
    
    var panel = document.createElement('div');
    panel.className = 'node-menu-panel';
    
    var header = document.createElement('div');
    header.className = 'node-menu-header';
    header.innerHTML = '<h3><i class="fas fa-cubes"></i> ' + t('nodeMenu.title') + '</h3><button class="node-menu-close"><i class="fas fa-times"></i></button>';
    panel.appendChild(header);
    
    var list = document.createElement('div');
    list.className = 'node-menu-list';
    
    for (var i = 0; i < types.length; i++) {
      var nodeType = types[i];
      var card = document.createElement('div');
      card.className = 'node-menu-card';
      card.setAttribute('data-type', nodeType.type);
      
      var name = document.createElement('div');
      name.className = 'node-menu-card-name';
      name.innerHTML = '<i class="fas fa-cube"></i> ' + t(nodeType.nameKey);
      
      var desc = document.createElement('div');
      desc.className = 'node-menu-card-desc';
      desc.textContent = t(nodeType.descriptionKey);
      
      var meta = document.createElement('div');
      meta.className = 'node-menu-card-meta';
      meta.innerHTML = '<span><i class="fas fa-user"></i> ' + (nodeType.author || 'Amenoke') + '</span>' +
        '<a href="' + (nodeType.github || '#') + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">' +
        '<i class="fab fa-github"></i> GitHub</a>';
      
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(meta);
      
      card.onclick = (function(type) {
        return function() {
          this.createNode(type);
          this.close();
        }.bind(this);
      }.bind(this))(nodeType.type);
      
      list.appendChild(card);
    }
    
    panel.appendChild(list);
    overlay.appendChild(panel);
    
    overlay.onclick = function(e) {
      if (e.target === overlay) this.close();
    }.bind(this);
    
    header.querySelector('.node-menu-close').onclick = function() { this.close(); }.bind(this);
    
    document.body.appendChild(overlay);
    this.menuElement = overlay;
    this.isOpen = true;
  }

  createNode(type) {
    var viewportRect = document.getElementById('viewport').getBoundingClientRect();
    var offset = this.viewport.getOffset();
    var zoom = window.currentZoom || 1;
    
    var centerX = (viewportRect.width / 2 - offset.x) / zoom - 140;
    var centerY = (viewportRect.height / 2 - offset.y) / zoom - 40;
    
    var node = NodeFactory.createNode(type, { x: centerX, y: centerY });
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
