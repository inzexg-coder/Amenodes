import { EdgeRenderer } from './EdgeRenderer.js';
import { ContextMenu } from '../ui/ContextMenu.js';

export class DomRenderer {
  constructor(graph, layer, viewportElement, eventBus) {
    this.graph = graph;
    this.layer = layer;
    this.viewportElement = viewportElement;
    this.viewport = null;
    this.history = null;
    this.eventBus = eventBus;
    this.dragNode = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragNodeStartX = 0;
    this.dragNodeStartY = 0;
    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgeSourcePort = null;
    this.tempLine = null;
    this.tempSvg = null;
    this.virtual = false;
    this.heightCache = new Map();
    this.elementCache = new Map();
    this.getSnapEnabled = null;
    this.getGridSize = null;
    this.opts = {
      willChange: false,
      contain: false,
      pointerEvents: false
    };
    
    this.edgeRenderer = new EdgeRenderer(this.layer);
    this.edgeRenderer.setOnEdgeRemoved(() => {
      this.graph.reevaluateAll();
      this.graph.updateAllOutputs();
      this.render();
      this.save();
      if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
    });
    
    this.attachTouchFeedback();
    this.contextMenu = null;
    this.layer.addEventListener("click", (e) => {
      if (!e.target.closest(".edge-group")) {
        this.edgeRenderer.clearHighlight();
      }
    });
  }

  setViewport(viewport) {
    this.viewport = viewport;
    window._viewport = viewport;
  }

  setHistory(history) {
    this.history = history;
    window._history = history;
  }

  setSnapToGrid(getSnapEnabled, getGridSize) {
    this.getSnapEnabled = getSnapEnabled;
    this.getGridSize = getGridSize;
  }

  save() {
    if (this.history) this.history.save();
  }

  invalidateCache(nodeId) {
    this.heightCache.delete(nodeId);
    this.elementCache.delete(nodeId);
  }

  getNodeHeight(node) {
    if (!node || typeof node.getMinHeight !== 'function') {
      console.warn('Node missing getMinHeight method:', node);
      return 80;
    }
    
    if (this.heightCache.has(node.id)) {
      return this.heightCache.get(node.id);
    }
    const height = node.getMinHeight();
    this.heightCache.set(node.id, height);
    return height;
  }

  isNodeVisible(node, viewportRect, offset) {
    if (!node) return false;
    
    const nodeX = node.x + offset.x;
    const nodeY = node.y + offset.y;
    const height = this.getNodeHeight(node);
    const margin = 300;
    return !(nodeX + 280 + margin < 0 || 
             nodeX - margin > viewportRect.w || 
             nodeY + height + margin < 0 || 
             nodeY - margin > viewportRect.h);
  }

  clearTemp() {
    this.layer.querySelectorAll('svg.temp, svg.edge-layer').forEach(svg => svg.remove());
  }

  updateNodeClass(node) {
    const element = this.elementCache.get(node.id);
    if (element) {
      if (node.important) {
        element.classList.add('node-important');
      } else {
        element.classList.remove('node-important');
      }
    }
  }

  applyOptStyles(element) {
    if (this.opts.willChange) {
      element.style.willChange = 'left, top';
    } else {
      element.style.willChange = '';
    }
    if (this.opts.contain) {
      element.style.contain = 'layout paint';
    } else {
      element.style.contain = '';
    }
  }

  renderEdges(visibleNodes) {
    const nodeIds = new Set(visibleNodes.map(n => n.id));
    const filteredEdges = this.graph.edges.filter(e => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId));
    
    const rectCache = new Map();
    for (const node of visibleNodes) {
      rectCache.set(node.id, {
        x: node.x,
        y: node.y,
        w: 280,
        h: this.getNodeHeight(node)
      });
    }
    
    this.edgeRenderer.renderEdges(filteredEdges, this.graph, rectCache);
  }
  updateEdgePositions() {
    const nodeIds = new Set(this.graph.nodes.map(n => n.id));
    const filteredEdges = this.graph.edges.filter(e => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId));
    
    const rectCache = new Map();
    for (const node of this.graph.nodes) {
      const el = this.elementCache.get(node.id);
      rectCache.set(node.id, {
        x: el ? parseFloat(getComputedStyle(el).left) : node.x,
        y: el ? parseFloat(getComputedStyle(el).top) : node.y,
        w: 280,
        h: this.getNodeHeight(node)
      });
    }
    this.edgeRenderer.updatePositions(filteredEdges, this.graph, rectCache);
  }

  render() {
    this.clearTemp();
    
    if (this.virtual && this.viewport) {
      const viewportRect = this.viewport.getRect();
      const offset = this.viewport.getOffset();
      const visibleNodes = this.graph.nodes.filter(n => this.isNodeVisible(n, viewportRect, offset));
      const hiddenNodes = this.graph.nodes.filter(n => !this.isNodeVisible(n, viewportRect, offset));
      
      for (const node of hiddenNodes) {
        const element = this.elementCache.get(node.id);
        if (element && element.parentNode) element.remove();
      }
      
      for (const node of visibleNodes) {
        if (!this.elementCache.has(node.id)) {
          if (typeof node.createDOM !== 'function') {
            console.error('Node missing createDOM method:', node);
            continue;
          }
          const element = node.createDOM(this.graph, this);
          this.elementCache.set(node.id, element);
        }
        const element = this.elementCache.get(node.id);
        if (element && !element.parentNode) this.layer.appendChild(element);
        element.style.left = node.x + 'px';
        element.style.top = node.y + 'px';
        this.updateNodeClass(node);
        this.applyOptStyles(element);
      }
      
      this.renderEdges(visibleNodes);
    } else {
      this.renderAll();
    }
  }

  renderAll() {
    this.layer.innerHTML = '';
    this.elementCache.clear();
    
    for (const node of this.graph.nodes) {
      if (typeof node.createDOM !== 'function') {
        console.error('Node missing createDOM method:', node);
        continue;
      }
      const element = node.createDOM(this.graph, this);
      this.layer.appendChild(element);
      this.elementCache.set(node.id, element);
      this.updateNodeClass(node);
      this.applyOptStyles(element);
    }
    
    const rectCache = new Map();
    for (const node of this.graph.nodes) {
      rectCache.set(node.id, {
        x: node.x,
        y: node.y,
        w: 280,
        h: this.getNodeHeight(node)
      });
    }
    
    this.edgeRenderer.renderEdges(this.graph.edges, this.graph, rectCache);
    this.attachDragEvents();
  }

  addHandles(container, nodeId, unmappedPort) {
    const existingHandles = container.querySelectorAll('.node-handle');
    existingHandles.forEach(handle => handle.remove());
    
    const positions = ['top', 'right', 'bottom', 'left'];
    for (const position of positions) {
      const dot = document.createElement('div');
      dot.className = `node-handle handle-${position}`;
      dot.setAttribute('data-source-id', nodeId);
      dot.setAttribute('data-port', 'main');
      dot.addEventListener("mousedown", this.onHandleDown.bind(this));
      dot.addEventListener("touchstart", this.onHandleDown.bind(this), { passive: false });
      container.appendChild(dot);
    }
    
    if (unmappedPort === 'unmapped') {
      const blueHandle = document.createElement('div');
      blueHandle.className = 'node-handle handle-right node-handle-blue';
      blueHandle.style.right = '-7px';
      blueHandle.style.top = 'calc(50% + 20px)';
      blueHandle.setAttribute('data-source-id', nodeId);
      blueHandle.setAttribute('data-port', 'unmapped');
      blueHandle.addEventListener("mousedown", this.onHandleDown.bind(this));
      blueHandle.addEventListener("touchstart", this.onHandleDown.bind(this), { passive: false });
      container.appendChild(blueHandle);
    }
  }

  onHandleDown(event) {
    event.stopPropagation();
    const handle = event.target.closest('.node-handle');
    if (!handle) return;
    
    const sourceId = parseInt(handle.getAttribute('data-source-id'));
    const port = handle.getAttribute('data-port') || 'main';
    const startX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const startY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
    let moved = false;
    const isTouch = event.type === 'touchstart';
    
    const onMove = (moveEvent) => {
      const cx = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX) || 0;
      const cy = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY) || 0;
      if (!moved && (Math.abs(cx - startX) > 5 || Math.abs(cy - startY) > 5)) {
        moved = true;
        cleanup();
        this.startDragEdge(sourceId, port, cx, cy);
      }
    };
    
    const onEnd = () => {
      cleanup();
      if (!moved) this.showMenu(startX, startY, sourceId);
    };
    
    const cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    if (isTouch) {
      event.preventDefault();
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    }
  }

  startDragEdge(sourceId, port, clientX, clientY) {
    if (this.isDraggingEdge) return;
    this.isDraggingEdge = true;
    this.edgeSourceId = sourceId;
    this.edgeSourcePort = port;
    
    const canvasCoords = this.getCanvasCoords(clientX, clientY);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add('temp');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '100';
    svg.style.overflow = 'visible';
    this.layer.appendChild(svg);
    this.tempSvg = svg;
    
    this.tempLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.tempLine.setAttribute("stroke", port === 'unmapped' ? "#44aaff" : "#ffaa55");
    this.tempLine.setAttribute("stroke-width", "3");
    this.tempLine.setAttribute("stroke-dasharray", "6,4");
    this.tempLine.setAttribute("x1", canvasCoords.x);
    this.tempLine.setAttribute("y1", canvasCoords.y);
    this.tempLine.setAttribute("x2", canvasCoords.x);
    this.tempLine.setAttribute("y2", canvasCoords.y);
    svg.appendChild(this.tempLine);
    
    document.body.style.cursor = 'crosshair';
  }

  getClientX(event) {
    return event.clientX !== undefined ? event.clientX : 
      (event.touches && event.touches[0] ? event.touches[0].clientX : 
      (event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].clientX : 0));
  }

  getClientY(event) {
    return event.clientY !== undefined ? event.clientY : 
      (event.touches && event.touches[0] ? event.touches[0].clientY : 
      (event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].clientY : 0));
  }

  onGlobalMoveEdge(event) {
    if (this.isDraggingEdge && this.tempLine) {
      const point = this.getCanvasCoords(this.getClientX(event), this.getClientY(event));
      this.tempLine.setAttribute("x2", point.x);
      this.tempLine.setAttribute("y2", point.y);
    }
  }

  onGlobalUpEdge(event) {
    if (!this.isDraggingEdge) return;
    
    const cx = this.getClientX(event);
    const cy = this.getClientY(event);
    const targetElement = document.elementsFromPoint(cx, cy)
      .find(el => el.classList && el.classList.contains('node'));
    const targetId = targetElement ? parseInt(targetElement.getAttribute('data-id')) : null;
    
    if (this.tempSvg && this.tempLine) {
      this.tempSvg.remove();
    }
    this.tempLine = null;
    this.tempSvg = null;
    
    if (targetId && targetId !== this.edgeSourceId) {
      const edge = this.graph.addEdge(this.edgeSourceId, targetId, this.edgeSourcePort);
      if (edge) {
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
        if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
      }
    }
    
    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgeSourcePort = null;
    document.body.style.cursor = '';
  }

  showMenu(x, y, sourceId) {
    if (!this.contextMenu) {
      this.contextMenu = new ContextMenu(this.graph, this, this.history, this.viewport);
    }
    this.contextMenu.show(x, y, sourceId);
  }

  getCanvasCoords(clientX, clientY) {
    const rect = this.viewportElement.getBoundingClientRect();
    const offset = this.viewport ? this.viewport.getOffset() : { x: 0, y: 0 };
    const zoom = window.currentZoom || 1;
    const worldX = (clientX - rect.left - offset.x) / zoom;
    const worldY = (clientY - rect.top - offset.y) / zoom;
    return { x: worldX, y: worldY };
  }

  attachDragEvents() {
    document.querySelectorAll('.node').forEach(element => {
      const header = element.querySelector('.node-header, .output-header, .calc-header, .map-header, .group-header');
      if (header) {
        header.addEventListener("mousedown", this.onNodeDown.bind(this));
      }
    });
  }

  onNodeDown(event) {
    if (event.button !== 0 && event.button !== undefined) return;
    if (event.target.closest('.node-handle') ||
        event.target.closest('.node-actions') ||
        event.target.closest('input') ||
        event.target.closest('button') ||
        event.target.closest('.title-editable')) {
      return;
    }
    
    const nodeElement = event.target.closest('.node');
    if (!nodeElement) return;
    
    const nodeId = parseInt(nodeElement.getAttribute('data-id'));
    const node = this.graph.getNode(nodeId);
    if (!node) return;
    
    this.dragNode = node;
    this.dragStartX = this.getClientX(event);
    this.dragStartY = this.getClientY(event);
    this.dragNodeStartX = node.x;
    this.dragNodeStartY = node.y;
    
    document.body.style.cursor = 'grabbing';
    event.preventDefault();
  }

  onGlobalMove(event) {
    if (this.dragNode) {
      const cx = this.getClientX(event);
      const cy = this.getClientY(event);
      const deltaX = (cx - this.dragStartX) / (window.currentZoom || 1);
      const deltaY = (cy - this.dragStartY) / (window.currentZoom || 1);
      
      let newX = this.dragNodeStartX + deltaX;
      let newY = this.dragNodeStartY + deltaY;
      
      if (this.getSnapEnabled && this.getSnapEnabled()) {
        const gridSize = this.getGridSize ? this.getGridSize() : 20;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      this.dragNode.x = newX;
      this.dragNode.y = newY;
      
      const element = this.elementCache.get(this.dragNode.id);
      if (element) {
        element.style.left = `${this.dragNode.x}px`;
        element.style.top = `${this.dragNode.y}px`;
      }
      
      this.updateEdgePositions();
      
      if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
    }
  }
  onGlobalUp() {
    if (this.dragNode) {
      this.save();
      document.body.style.cursor = "";
      this.dragNode = null;
    }
  }

  setVirtual(enabled) {
    if (this.virtual === enabled) return;
    this.virtual = enabled;
    this.elementCache.clear();
    this.render();
  }

  attachTouchFeedback() {
    let touchTimeout = null;
    this.layer.addEventListener('touchstart', (e) => {
      const nodeEl = e.target.closest('.node');
      if (nodeEl) {
        clearTimeout(touchTimeout);
        nodeEl.classList.add('node-touch-active');
      }
    }, { passive: true });
    this.layer.addEventListener('touchend', (e) => {
      const nodeEl = e.target.closest('.node');
      if (nodeEl) {
        touchTimeout = setTimeout(() => {
          nodeEl.classList.remove('node-touch-active');
        }, 150);
      }
    }, { passive: true });
    this.layer.addEventListener('touchcancel', (e) => {
      const nodeEl = e.target.closest('.node');
      if (nodeEl) {
        nodeEl.classList.remove('node-touch-active');
      }
    }, { passive: true });
  }

  closeMenu() {
    if (this.contextMenu) {
      this.contextMenu.close();
    }
  }
}
