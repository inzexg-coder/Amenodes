import { EdgeRenderer } from './EdgeRenderer.js';
import { DeferredEdgeRenderer } from './DeferredEdgeRenderer.js';
import { ContextMenu } from '../ui/ContextMenu.js';
import { throttle, rafThrottle } from '../utils/Throttle.js';
import { debounce } from '../utils/Debounce.js';
import { RectCache } from '../utils/RectCache.js';
import { ShadowSimplifier } from '../utils/ShadowSimplifier.js';
import { NumberNode } from '../nodes/NumberNode.js';
import { GroupNode } from '../nodes/GroupNode.js';
import { CalcNode } from '../nodes/CalcNode.js';
import { OutputNode } from '../nodes/OutputNode.js';
import { MapNode } from '../nodes/MapNode.js';
import { ConstantNode } from '../nodes/ConstantNode.js';
import { ConfidenceIntervalNode } from '../nodes/ConfidenceIntervalNode.js';

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
    this.rectCache = new RectCache();
    this.shadowSimplifier = new ShadowSimplifier();
    this.isDeferredEdgesEnabled = false;
    this.edgeRenderer = null;
    this.deferredEdgeRenderer = null;
    this.batchRAF = false;
    this.batchPending = false;
    this.batchNodes = new Set();
    this.batchRafId = null;
    this.debounceRender = false;
    this.debouncedRender = null;
    this.immediateRender = null;
    this.opts = {
      willChange: false,
      contain: false,
      pointerEvents: false,
      throttleMouse: false,
      passiveEvents: false,
      simplifyShadows: false,
      deferredEdges: false,
      debounceRender: false,
      lazyComputations: false,
      typedArrays: false,
      textCache: false
    };
    
    this.initEdgeRenderers();
    this.initThrottledHandlers();
  }

  initEdgeRenderers() {
    this.edgeRenderer = new EdgeRenderer(this.layer);
    this.edgeRenderer.setOnEdgeRemoved(() => {
      this.graph.reevaluateAll();
      this.graph.updateAllOutputs();
      this.render(true);
      this.save();
    });
    
    this.deferredEdgeRenderer = new DeferredEdgeRenderer(this.layer);
    this.deferredEdgeRenderer.setOnEdgeRemoved(() => {
      this.graph.reevaluateAll();
      this.graph.updateAllOutputs();
      this.render(true);
      this.save();
    });
  }

  initThrottledHandlers() {
    this.throttledGlobalMove = throttle(this.onGlobalMove.bind(this), 16);
    this.throttledGlobalMoveEdge = throttle(this.onGlobalUpEdge.bind(this), 16);
    this.rafThrottledRender = rafThrottle(() => this.renderImmediate());
  }

  setViewport(viewport) {
    this.viewport = viewport;
    window._viewport = viewport;
  }

  setHistory(history) {
    this.history = history;
    window._history = history;
  }

  save() {
    if (this.history) this.history.save();
  }

  invalidateCache(nodeId) {
    this.heightCache.delete(nodeId);
    this.elementCache.delete(nodeId);
  }

  getNodeHeight(node) {
    if (this.heightCache.has(node.id)) {
      return this.heightCache.get(node.id);
    }
    let height = node.getMinHeight();
    if (node instanceof GroupNode) {
      height = Math.max(height, 80 + node.values.length * 40);
    } else if (node instanceof MapNode) {
      height = Math.max(height, 80 + node.maps.length * 45);
    } else if (node instanceof OutputNode) {
      height = Math.max(height, 80 + node.rows.length * 35);
    }
    this.heightCache.set(node.id, height);
    return height;
  }

  isNodeVisible(node, viewportRect, offset) {
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

  renderEdges(visibleNodes, priority = true) {
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
    
    if (this.opts.deferredEdges && this.isDeferredEdgesEnabled) {
      if (priority) {
        this.deferredEdgeRenderer.renderEdges(filteredEdges, this.graph, rectCache, true);
      } else {
        this.deferredEdgeRenderer.renderEdges(filteredEdges, this.graph, rectCache, false);
      }
    } else {
      this.edgeRenderer.renderEdges(filteredEdges, this.graph, rectCache);
    }
  }

  render(immediate = false) {
    if (this.opts.debounceRender && this.debounceRender) {
      if (immediate) {
        if (this.debouncedRender) this.debouncedRender.cancel?.();
        this.renderImmediate();
      } else {
        if (!this.debouncedRender) {
          this.debouncedRender = debounce(this.renderImmediate.bind(this), 32);
          this.immediateRender = debounce(this.renderImmediate.bind(this), 0, true);
        }
        this.debouncedRender();
      }
    } else if (this.batchRAF && this.batchPending === false) {
      this.scheduleBatchRender();
    } else {
      this.renderImmediate();
    }
  }

  scheduleBatchRender() {
    if (this.batchRafId) return;
    this.batchPending = true;
    this.batchRafId = requestAnimationFrame(() => {
      this.flushBatchRender();
    });
  }

  flushBatchRender() {
    if (this.batchPending) {
      this.renderImmediate(this.batchNodes);
      this.batchNodes.clear();
      this.batchPending = false;
    }
    this.batchRafId = null;
  }

  markNodeDirty(nodeId) {
    if (this.batchRAF && this.batchPending) {
      this.batchNodes.add(nodeId);
    }
  }

  renderImmediate(dirtyNodes = null) {
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
      
      this.renderEdges(visibleNodes, true);
      if (this.opts.deferredEdges && this.isDeferredEdgesEnabled) {
        this.renderEdges(visibleNodes, false);
      }
    } else {
      this.renderAll();
    }
  }

  renderAll() {
    this.layer.innerHTML = '';
    this.elementCache.clear();
    
    for (const node of this.graph.nodes) {
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
      dot.addEventListener('mousedown', this.onHandleDown.bind(this));
      if (this.opts.passiveEvents) {
        dot.addEventListener('touchstart', this.onHandleDown.bind(this), { passive: false });
      }
      container.appendChild(dot);
    }
    
    if (unmappedPort === 'unmapped') {
      const blueHandle = document.createElement('div');
      blueHandle.className = 'node-handle handle-right node-handle-blue';
      blueHandle.style.right = '-7px';
      blueHandle.style.top = 'calc(50% + 20px)';
      blueHandle.setAttribute('data-source-id', nodeId);
      blueHandle.setAttribute('data-port', 'unmapped');
      blueHandle.addEventListener('mousedown', this.onHandleDown.bind(this));
      if (this.opts.passiveEvents) {
        blueHandle.addEventListener('touchstart', this.onHandleDown.bind(this), { passive: false });
      }
      container.appendChild(blueHandle);
    }
  }

  onHandleDown(event) {
    event.stopPropagation();
    const handle = event.target.closest('.node-handle');
    if (!handle) return;
    
    const sourceId = parseInt(handle.getAttribute('data-source-id'));
    const port = handle.getAttribute('data-port') || 'main';
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    
    const onMouseMove = (moveEvent) => {
      if (!moved && (Math.abs(moveEvent.clientX - startX) > 5 || Math.abs(moveEvent.clientY - startY) > 5)) {
        moved = true;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (this.opts.passiveEvents) {
          window.removeEventListener('touchmove', onMouseMove);
          window.removeEventListener('touchend', onMouseUp);
        }
        this.startDragEdge(sourceId, port, moveEvent.clientX, moveEvent.clientY);
      }
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (this.opts.passiveEvents) {
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);
      }
      if (!moved) this.showMenu(startX, startY, sourceId);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    if (this.opts.passiveEvents) {
      window.addEventListener('touchmove', onMouseMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
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

  onGlobalMoveEdge(event) {
    if (this.isDraggingEdge && this.tempLine) {
      const point = this.getCanvasCoords(event.clientX, event.clientY);
      this.tempLine.setAttribute("x2", point.x);
      this.tempLine.setAttribute("y2", point.y);
    }
  }

  onGlobalUpEdge(event) {
    if (!this.isDraggingEdge) return;
    
    const targetElement = document.elementsFromPoint(event.clientX, event.clientY)
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
        this.render(true);
        this.save();
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
    let rectX = rect.left, rectY = rect.top;
    
    if (this.opts.cacheBoundingRect) {
      const cached = this.rectCache.get(this.viewportElement);
      if (cached) {
        rectX = cached.left;
        rectY = cached.top;
      }
    }
    
    const offset = this.viewport ? this.viewport.getOffset() : { x: 0, y: 0 };
    const zoom = window.currentZoom || 1;
    const worldX = (clientX - rectX - offset.x) / zoom;
    const worldY = (clientY - rectY - offset.y) / zoom;
    return { x: worldX, y: worldY };
  }

  attachDragEvents() {
    document.querySelectorAll('.node').forEach(element => {
      const header = element.querySelector('.node-header, .output-header, .calc-header, .map-header, .group-header');
      if (header) {
        header.addEventListener('mousedown', this.onNodeDown.bind(this));
        if (this.opts.passiveEvents) {
          header.addEventListener('touchstart', this.onNodeDown.bind(this), { passive: false });
        }
      }
    });
  }

  onNodeDown(event) {
    if (event.button !== 0 && event.type !== 'touchstart') return;
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
    
    if (this.opts.simplifyShadows) {
      this.shadowSimplifier.startDrag(nodeElement);
    }
    
    this.dragNode = node;
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY);
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragNodeStartX = node.x;
    this.dragNodeStartY = node.y;
    
    document.body.style.cursor = 'grabbing';
    event.preventDefault();
  }

  onGlobalMove(event) {
    if (this.dragNode) {
      const clientX = event.clientX || (event.touches && event.touches[0]?.clientX);
      const clientY = event.clientY || (event.touches && event.touches[0]?.clientY);
      const deltaX = (clientX - this.dragStartX) / (window.currentZoom || 1);
      const deltaY = (clientY - this.dragStartY) / (window.currentZoom || 1);
      this.dragNode.x = this.dragNodeStartX + deltaX;
      this.dragNode.y = this.dragNodeStartY + deltaY;
      
      const element = document.querySelector(`.node[data-id='${this.dragNode.id}']`);
      if (element) {
        element.style.left = `${this.dragNode.x}px`;
        element.style.top = `${this.dragNode.y}px`;
      }
      
      if (this.opts.throttleMouse) {
        this.throttledGlobalMove(event);
      } else {
        if (this.batchRAF && this.batchPending) {
          this.markNodeDirty(this.dragNode.id);
          this.scheduleBatchRender();
        } else {
          this.render(this.opts.debounceRender ? false : true);
        }
      }
    }
  }

  onGlobalUp() {
    if (this.dragNode) {
      if (this.opts.simplifyShadows) {
        this.shadowSimplifier.endDrag();
      }
      this.save();
      this.dragNode = null;
      document.body.style.cursor = '';
      if (this.batchRAF && this.batchPending) {
        this.flushBatchRender();
      }
    }
  }

  setVirtual(enabled) {
    if (this.virtual === enabled) return;
    this.virtual = enabled;
    this.elementCache.clear();
    this.render(true);
  }

  setDeferredEdges(enabled) {
    this.isDeferredEdgesEnabled = enabled;
    this.opts.deferredEdges = enabled;
    this.render(true);
  }

  setBatchRAF(enabled) {
    this.batchRAF = enabled;
    if (!enabled && this.batchRafId) {
      cancelAnimationFrame(this.batchRafId);
      this.batchRafId = null;
      this.batchPending = false;
      this.render(true);
    }
  }

  setDebounceRender(enabled) {
    this.debounceRender = enabled;
    if (!enabled && this.debouncedRender) {
      this.debouncedRender.cancel?.();
      this.debouncedRender = null;
    }
  }

  setThrottleMouse(enabled) {
    this.opts.throttleMouse = enabled;
  }

  setPassiveEvents(enabled) {
    this.opts.passiveEvents = enabled;
  }

  setSimplifyShadows(enabled) {
    this.opts.simplifyShadows = enabled;
  }

  setRectCache(enabled) {
    this.opts.cacheBoundingRect = enabled;
    if (enabled) {
      this.rectCache.enable();
    } else {
      this.rectCache.disable();
    }
  }

  closeMenu() {
    if (this.contextMenu) {
      this.contextMenu.close();
    }
  }
}
