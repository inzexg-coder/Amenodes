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
    this._edgeRafPending = null;
    this.dragNodeStartY = 0;
    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgeSourcePort = null;
    this.tempLine = null;
    this.tempSvg = null;
    this._tempArrow = null;
    this.magneticNode = null;
    this.virtual = false;
    this.heightCache = new Map();
    this.elementCache = new Map();
    this.inertiaEnabled = function() { return false; };
    this.magneticNodesEnabled = function() { return false; };
    this._dragHistory = [];
    this._inertiaAnimId = null;
    this._particles = [];
    this._particleSpawnActive = false;
    this._particleAnimId = null;
    this._particleCanvas = null;
    this._particleCtx = null;
    this._touchDragConfirmed = false;
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
    this._initParticleCanvas();
    this.contextMenu = null;
    this.layer.addEventListener("click", (e) => {
      if (!e.target.closest(".edge-group")) {
        this.edgeRenderer.clearHighlight();
      }
    });
    this.viewportElement.addEventListener("mouseleave", () => {
      if (this.dragNode) {
        if (this._edgeRafPending) {
          cancelAnimationFrame(this._edgeRafPending);
          this._edgeRafPending = null;
        }
        this.updateEdgePositions();
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
      rectCache.set(node.id, {
        x: node.x,
        y: node.y,
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
    this._edgeHandlePos = Array.from(handle.classList).find(c => c.startsWith('handle-')) || 'handle-right';
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
        
        var hRect = handle.getBoundingClientRect();
        var hCx = hRect.left + hRect.width / 2;
        var hCy = hRect.top + hRect.height / 2;
        this.startDragEdge(sourceId, port, hCx, hCy);
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
    
    var _srcEl = document.querySelector('.node[data-id="' + sourceId + '"]');
    if (_srcEl) _srcEl.classList.add('edge-drawing');

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
    this.tempLine.setAttribute("class", "temp-edge-line");
    var tempLineColor = port === 'unmapped' ? '#44aaff' : (window.__premiumAccent ? window.__premiumAccent() : '#ffaa55');
    this.tempLine.style.setProperty('stroke', tempLineColor, 'important');
    this.tempLine.setAttribute("stroke-width", "3");
    this.tempLine.setAttribute("stroke-dasharray", "6,4");
    this.tempLine.setAttribute("x1", canvasCoords.x);
    this.tempLine.setAttribute("y1", canvasCoords.y);
    this.tempLine.setAttribute("x2", canvasCoords.x);
    this.tempLine.setAttribute("y2", canvasCoords.y);
    svg.appendChild(this.tempLine);

    document.body.classList.add('is-drawing-edge');
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
    if (!this.isDraggingEdge || !this.tempLine) return;

    var cx = this.getClientX(event);
    var cy = this.getClientY(event);
    var point = this.getCanvasCoords(cx, cy);

    this._updateTempLineSource();

    if (this.magneticNodesEnabled()) {
      this.updateMagneticPreview(cx, cy, point, event);
    } else {
      this.tempLine.setAttribute("x2", point.x);
      this.tempLine.setAttribute("y2", point.y);
    }
  }

  updateMagneticPreview(clientX, clientY, fallbackPoint, event) {
    var MAGNET_ZONE = 40;  

    var nodeEls = document.querySelectorAll('.node');
    var nearest = null;
    var minDist = Infinity;
    var nearestId = null;
    var nearestRect = null;

    for (var i = 0; i < nodeEls.length; i++) {
      var nodeEl = nodeEls[i];
      var nodeId = parseInt(nodeEl.getAttribute('data-id'));
      if (nodeId === this.edgeSourceId) continue;

      var r = nodeEl.getBoundingClientRect();
      var dx = Math.max(r.left - clientX, 0, clientX - r.right);
      var dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = nodeEl;
        nearestId = nodeId;
        nearestRect = r;
      }
    }

    if (this.magneticNode && (this.magneticNode !== nearest || minDist >= MAGNET_ZONE)) {
      this.magneticNode.classList.remove('node-magnetic-glow');
      this.magneticNode.classList.remove('node-magnetic-snap');
      this.magneticNode = null;
    }

    this.tempLine.setAttribute("x2", fallbackPoint.x);
    this.tempLine.setAttribute("y2", fallbackPoint.y);
    this.tempLine.setAttribute("stroke-dasharray", "6,4");
    this._removeTempArrow();

    if (nearest && minDist < MAGNET_ZONE) {
      
      var dataCompatible = false;
      if (this.graph && this.graph.map) {
        try {
          var srcNode = this.graph.map.get(this.edgeSourceId);
          var tgtNode = this.graph.map.get(nearestId);
          if (srcNode && tgtNode && window.typeSystem) {
            var srcDT = window.typeSystem.getNodeType(srcNode);
            var tgtDT = window.typeSystem.getNodeType(tgtNode);
            var srcDef = window.typeSystem.getTypeDefinition(srcDT);
            var tgtDef = window.typeSystem.getTypeDefinition(tgtDT);
            
            dataCompatible = srcDef && tgtDef && (tgtDef.allowedInputTypes.length === 0 || tgtDef.allowedInputTypes.includes(srcDT));
          }
        } catch(e) { console.warn('[Magnetic] type check error:', e); }
      }

      if (dataCompatible) {
        
        nearest.classList.add('node-magnetic-snap');

        this._updateTempLineSource();
        var srcX = parseFloat(this.tempLine.getAttribute('x1'));
        var srcY = parseFloat(this.tempLine.getAttribute('y1'));

        var vr = this.viewportElement.getBoundingClientRect();
        var offset = this.viewport ? this.viewport.getOffset() : { x: 0, y: 0 };
        var zoom = window.currentZoom || 1;

        var tCanvasX = (nearestRect.left - vr.left - offset.x) / zoom;
        var tCanvasY = (nearestRect.top - vr.top - offset.y) / zoom;
        var tCanvasW = nearestRect.width / zoom;
        var tCanvasH = nearestRect.height / zoom;

        var tCenterX = tCanvasX + tCanvasW / 2;
        var tCenterY = tCanvasY + tCanvasH / 2;

        var borderPoint = this._lineToRectBorder(srcX, srcY, tCenterX, tCenterY, tCanvasX, tCanvasY, tCanvasW, tCanvasH);

        this.tempLine.setAttribute("stroke-dasharray", "none");
        this.tempLine.setAttribute("stroke-width", "3");
        this.tempLine.setAttribute("x2", borderPoint.x);
        this.tempLine.setAttribute("y2", borderPoint.y);

        this._addTempArrow(
          { x: srcX, y: srcY },
          { x: borderPoint.x, y: borderPoint.y }
        );

        this.magneticNode = nearest;
      } else {
        
        nearest.classList.add('node-magnetic-glow');
        this.magneticNode = nearest;
      }
    }
  }

  _lineToRectBorder(x1, y1, x2, y2, rx, ry, rw, rh) {

    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) {
      return { x: x1, y: y1 };
    }

    var dx = x2 - x1;
    var dy = y2 - y1;
    var t = Infinity;

    if (dx !== 0) {
      var tLeft = (rx - x1) / dx;
      if (tLeft > 0 && tLeft < t) {
        var y = y1 + dy * tLeft;
        if (y >= ry && y <= ry + rh) t = tLeft;
      }
      
      var tRight = (rx + rw - x1) / dx;
      if (tRight > 0 && tRight < t) {
        var y = y1 + dy * tRight;
        if (y >= ry && y <= ry + rh) t = tRight;
      }
    }
    
    if (dy !== 0) {
      var tTop = (ry - y1) / dy;
      if (tTop > 0 && tTop < t) {
        var x = x1 + dx * tTop;
        if (x >= rx && x <= rx + rw) t = tTop;
      }
      
      var tBottom = (ry + rh - y1) / dy;
      if (tBottom > 0 && tBottom < t) {
        var x = x1 + dx * tBottom;
        if (x >= rx && x <= rx + rw) t = tBottom;
      }
    }

    if (t === Infinity) t = 0;
    return { x: x1 + dx * t, y: y1 + dy * t };
  }

  _addTempArrow(fromPoint, toPoint) {
    if (!this._tempArrow && this.tempSvg) {
      var arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      arrow.classList.add("temp-edge-arrow");
      var isBluePort = this.edgeSourcePort === 'unmapped';
      arrow.style.setProperty('fill', isBluePort ? '#44aaff' : (window.__premiumAccent ? window.__premiumAccent() : '#ffb347'), 'important');
      arrow.setAttribute("stroke", "none");
      this.tempSvg.appendChild(arrow);
      this._tempArrow = arrow;
    }
    if (this._tempArrow) {
      var midX = (fromPoint.x + toPoint.x) / 2;
      var midY = (fromPoint.y + toPoint.y) / 2;
      var angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
      var tipX = midX + Math.cos(angle) * 6;
      var tipY = midY + Math.sin(angle) * 6;
      var backX = midX - Math.cos(angle) * 8;
      var backY = midY - Math.sin(angle) * 8;
      var perpX = -Math.sin(angle) * 5;
      var perpY = Math.cos(angle) * 5;
      this._tempArrow.setAttribute('points',
        tipX + ',' + tipY + ' ' +
        (backX + perpX) + ',' + (backY + perpY) + ' ' +
        (backX - perpX) + ',' + (backY - perpY)
      );
    }
  }

  _removeTempArrow() {
    if (this._tempArrow) {
      this._tempArrow.remove();
      this._tempArrow = null;
    }
  }

  onGlobalUpEdge(event) {
    if (!this.isDraggingEdge) return;

    var targetId = null;

    if (this.magneticNode) {
      
      targetId = parseInt(this.magneticNode.getAttribute('data-id'));
      this.magneticNode.classList.remove('node-magnetic-glow');
      this.magneticNode.classList.remove('node-magnetic-snap');
      this.magneticNode = null;
    } else {
      var cx = this.getClientX(event);
      var cy = this.getClientY(event);
      var targetElement = document.elementsFromPoint(cx, cy)
        .find(function(el) { return el.classList && el.classList.contains('node'); });
      targetId = targetElement ? parseInt(targetElement.getAttribute('data-id')) : null;
    }
    this._removeTempArrow();

    if (this.tempSvg && this.tempLine) {
      this.tempSvg.remove();
    }
    this.tempLine = null;
    this.tempSvg = null;

    if (targetId && targetId !== this.edgeSourceId) {
      var edge = this.graph.addEdge(this.edgeSourceId, targetId, this.edgeSourcePort);
      if (edge) {
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
        if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
      } else if (targetId) {
        
        var _srcEl = document.querySelector('.node[data-id="' + this.edgeSourceId + '"]');
        var _tgtEl = document.querySelector('.node[data-id="' + targetId + '"]');
        [ _srcEl, _tgtEl ].forEach(function(el) {
          if (!el) return;
          el.style.setProperty('box-shadow', '0 0 0 4px #ff4444, 0 0 35px rgba(255,68,68,0.6)', 'important');
          el.style.setProperty('border-color', '#ff4444', 'important');
          setTimeout(function() {
            if (!el) return;
            el.style.removeProperty('box-shadow');
            el.style.removeProperty('border-color');
          }, 600);
        });
      }
    }

    if (this.edgeSourceId) {
      var _srcEl = document.querySelector('.node[data-id="' + this.edgeSourceId + '"]');
      if (_srcEl) _srcEl.classList.remove('edge-drawing');
    }
    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgeSourcePort = null;
    this.magneticNode = null;
    this._removeTempArrow();
    document.body.classList.remove('is-drawing-edge');
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
  _updateTempLineSource() {
    if (!this.edgeSourceId || !this.tempLine) return;
    var srcEl = document.querySelector('.node[data-id="' + this.edgeSourceId + '"]');
    if (!srcEl) return;
    var rect = srcEl.getBoundingClientRect();
    var vr = this.viewportElement.getBoundingClientRect();
    var offset = this.viewport ? this.viewport.getOffset() : { x: 0, y: 0 };
    var zoom = window.currentZoom || 1;

    var srcX, srcY;
    var handlePos = this._edgeHandlePos || 'handle-right';
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    if (handlePos === 'handle-top') {
      srcX = cx;
      srcY = rect.top - 7;
    } else if (handlePos === 'handle-bottom') {
      srcX = cx;
      srcY = rect.bottom + 7;
    } else if (handlePos === 'handle-left') {
      srcX = rect.left - 7;
      srcY = cy;
    } else {
      
      srcX = rect.right + 7;
      srcY = this.edgeSourcePort === 'unmapped' ? cy + 20 : cy;
    }

    srcX = (srcX - vr.left - offset.x) / zoom;
    srcY = (srcY - vr.top - offset.y) / zoom;

    this.tempLine.setAttribute("x1", srcX);
    this.tempLine.setAttribute("y1", srcY);
  }

  attachDragEvents() {
    document.querySelectorAll('.node').forEach(element => {
      const header = element.querySelector('.node-header, .output-header, .calc-header, .map-header, .group-header');
      if (header) {
        header.addEventListener("mousedown", this.onNodeDown.bind(this));
        header.addEventListener("touchstart", this.onNodeDown.bind(this), { passive: false });
      }
    });
  }

  onNodeDown(event) {
    const isTouch = event.type === 'touchstart';
    if (!isTouch && event.button !== 0 && event.button !== undefined) return;
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

    if (isTouch) {
      this._touchDragConfirmed = false;
      nodeElement.classList.add('node-touch-active');
    } else {
      nodeElement.classList.add('node-dragging');
      nodeElement.style.setProperty('transition', 'transform 0.15s ease, box-shadow 0.15s ease', 'important');
      nodeElement.style.setProperty('transform', 'scale(1.03)', 'important');
      
      nodeElement.style.setProperty('box-shadow', '0 0 0 2px var(--accent), 0 0 20px rgba(var(--accent-rgb), 0.5), 0 0 40px rgba(var(--accent-rgb), 0.3), 0 0 0 1px rgba(255,255,255,0.2)', 'important');
      document.body.classList.add('dragging');
    }

    document.body.style.cursor = 'grabbing';
    console.log('[Drag] START type=' + event.type + ' id=' + node.id + ' x=' + node.x.toFixed(0) + ' y=' + node.y.toFixed(0));
    if (this._particleTrailEnabled()) {
      this._particleSpawnActive = true;
      window.__particleAccent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#a78bfa';
      if (!this._particleAnimId) {
        this._animateParticles();
      }
    }
    event.preventDefault();
  }

  onGlobalMove(event) {
    if (this.dragNode) {
      const cx = this.getClientX(event);
      const cy = this.getClientY(event);
      const deltaX = (cx - this.dragStartX) / (window.currentZoom || 1);
      const deltaY = (cy - this.dragStartY) / (window.currentZoom || 1);

      if (!this._touchDragConfirmed && event.type === 'touchmove') {
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (dist < 5) {
          
          this._dragHistory.push({ x: this.dragNodeStartX + deltaX, y: this.dragNodeStartY + deltaY, t: Date.now() });
          while (this._dragHistory.length > 5) this._dragHistory.shift();
          return;
        }
        this._touchDragConfirmed = true;
        const el = this.elementCache.get(this.dragNode.id);
        if (el) {
          el.classList.remove('node-touch-active');
          el.classList.add('node-dragging');
          console.log('[Drag] touch .node-dragging ADDED, box-shadow:', getComputedStyle(el).boxShadow);
          el.style.setProperty('transition', 'transform 0.15s ease, box-shadow 0.15s ease', 'important');
          el.style.setProperty('transform', 'scale(1.03)', 'important');
          el.style.setProperty('box-shadow', '0 0 0 2px var(--accent), 0 0 20px rgba(var(--accent-rgb), 0.5), 0 0 40px rgba(var(--accent-rgb), 0.3), 0 0 0 1px rgba(255,255,255,0.2)', 'important');
          document.body.classList.add('dragging');
        }
      }

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

      if (!this._edgeRafPending) {
        this._edgeRafPending = requestAnimationFrame(() => {
          this._edgeRafPending = null;
          this.updateEdgePositions();
        });
      }

      this._dragHistory.push({ x: newX, y: newY, t: Date.now() });

      if (this._particleSpawnActive && this.dragNode) {
        this._spawnDragParticles(newX, newY);
      }
      while (this._dragHistory.length > 5) this._dragHistory.shift();

      if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
    }
  }
  onGlobalUp(event) {
    if (this.dragNode) {
      
      if (this._touchDragConfirmed === false && event && event.type === 'touchend') {
        this._dragHistory = [];
        this.dragNode = null;
        return;
      }

      const dragEl = this.elementCache.get(this.dragNode.id);
      this._particleSpawnActive = false;
      document.body.classList.remove('dragging');
      if (dragEl) {
        dragEl.classList.remove('node-dragging');
        dragEl.style.removeProperty('box-shadow');
        if (!this.inertiaEnabled()) {
          
          dragEl.style.setProperty('transition', 'transform 0.2s ease, box-shadow 0.2s ease', 'important');
          dragEl.style.removeProperty('transform');
          setTimeout(function() {
            if (dragEl) dragEl.style.removeProperty('transition');
          }, 200);
        } else {
          
          dragEl.classList.add('node-inertia');
        }
      }

      if (this._inertiaAnimId) { cancelAnimationFrame(this._inertiaAnimId); this._inertiaAnimId = null; }
      var _inertiaEnabled = this.inertiaEnabled();
      var _histLen = this._dragHistory.length;
      if (_inertiaEnabled) console.log('[Inertia] enabled=' + _inertiaEnabled + ' history=' + _histLen + ' dragNode=' + (this.dragNode ? this.dragNode.id : 'null') + ' dragEl=' + (dragEl ? 'found' : 'null'));
      if (_inertiaEnabled && _histLen >= 2) {
        var hist = this._dragHistory;
        var last = hist[hist.length - 1];
        var prev = hist.length >= 2 ? hist[hist.length - 2] : hist[0];
        var dt = (last.t - prev.t) || 1;
        var vx = (last.x - prev.x) / dt * 40;
        var vy = (last.y - prev.y) / dt * 40;
        var speed = Math.sqrt(vx * vx + vy * vy);
        console.log('[Inertia] speed=' + speed.toFixed(2) + ' vx=' + vx.toFixed(2) + ' vy=' + vy.toFixed(2) + ' dt=' + dt + ' zoom=' + (window.currentZoom || 1).toFixed(2));
        console.log('[Inertia] prev.x=' + prev.x.toFixed(1) + ' last.x=' + last.x.toFixed(1) + ' prev.y=' + prev.y.toFixed(1) + ' last.y=' + last.y.toFixed(1) + ' dragNode.x=' + this.dragNode.x.toFixed(1) + ' y=' + this.dragNode.y.toFixed(1));
        console.log('[Inertia] FULL history:', hist.map(function(h){return h.x.toFixed(0)+','+h.y.toFixed(0)+'t='+h.t;}).join(' | '));
        if (speed > 2) {
          var overshootX = Math.max(-30, Math.min(30, vx * 1.0));
          var overshootY = Math.max(-30, Math.min(30, vy * 1.0));
          console.log('[Inertia] OVERSHOOT x=' + overshootX.toFixed(1) + ' y=' + overshootY.toFixed(1));
          var finalX = this.dragNode.x;
          var finalY = this.dragNode.y;
          
          this.dragNode.x = finalX + overshootX;
          this.dragNode.y = finalY + overshootY;
          if (dragEl) {
            dragEl.style.setProperty('transition', 'none', 'important');
            dragEl.style.left = this.dragNode.x + 'px';
            dragEl.style.top = this.dragNode.y + 'px';
          }
          this.updateEdgePositions();
          document.body.classList.add('inertia-active');
          
          var self = this;
          var savedDragNode = this.dragNode;
          requestAnimationFrame(function() {
            if (!savedDragNode) return;
            var _transVal = 'left 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            dragEl.style.setProperty('transition', _transVal, 'important');
            console.log('[Inertia] SPRING-BACK transition set, computed=', getComputedStyle(dragEl).transition, 'final=' + finalX.toFixed(0) + ',' + finalY.toFixed(0));
            savedDragNode.x = finalX;
            savedDragNode.y = finalY;
            dragEl.style.left = finalX + 'px';
            dragEl.style.top = finalY + 'px';
            self.updateEdgePositions();
            
            dragEl.style.removeProperty('transform');
            self._inertiaAnimId = setTimeout(function() {
              console.log('[Inertia] ANIMATION DONE — cleanup');
              if (dragEl) {
                dragEl.style.removeProperty('transition');
                dragEl.style.removeProperty('transform');
                dragEl.style.removeProperty('z-index');
                dragEl.classList.remove('node-inertia');
              }
              document.body.classList.remove('inertia-active');
              self._inertiaAnimId = null;
            }, 500);
          });
        } else {
          
          if (dragEl) {
            dragEl.style.setProperty('transition', 'transform 0.2s ease, box-shadow 0.2s ease', 'important');
            dragEl.style.removeProperty('transform');
            setTimeout(function() {
              if (dragEl) dragEl.style.removeProperty('transition');
            }, 200);
          }
        }
      }

      this._dragHistory = [];
      this.save();
      if (this._edgeRafPending) {
        cancelAnimationFrame(this._edgeRafPending);
        this._edgeRafPending = null;
      }
      this.updateEdgePositions();
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

  _isPremium() {
    return localStorage.getItem('amenodes_premium') === 'true';
  }

  _particleTrailEnabled() {
    return this._isPremium() && localStorage.getItem('premium_particle_trail') === 'true';
  }

  _initParticleCanvas() {
    if (this._particleCanvas) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'particleTrailCanvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;';
    var container = this.viewportElement;
    if (container) {
      container.appendChild(canvas);
      this._particleCanvas = canvas;
      this._particleCtx = canvas.getContext('2d');
      this._resizeParticleCanvas();
    }
  }

  _resizeParticleCanvas() {
    if (this._particleCanvas && this.viewportElement) {
      this._particleCanvas.width = this.viewportElement.clientWidth;
      this._particleCanvas.height = this.viewportElement.clientHeight;
    }
  }

  _spawnDragParticles(worldX, worldY) {
    if (!this._particleCtx || !this._particleTrailEnabled()) return;
    for (var i = 0; i < 2; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 0.3 + Math.random() * 1.2;
      var size = 2 + Math.random() * 4;
      this._particles.push({
        worldX: worldX,
        worldY: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.025,
        size: size,
        startSize: size
      });
    }
    if (this._particles.length > 200) {
      this._particles.splice(0, this._particles.length - 200);
    }
  }

  _animateParticles() {
    if (!this._particleCtx || !this._particleCanvas) return;
    this._resizeParticleCanvas();
    var ctx = this._particleCtx;
    var canvas = this._particleCanvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var zoom = window.currentZoom || 1;
    var rect = this.viewportElement.getBoundingClientRect();
    var offset = this.viewport ? this.viewport.getOffset() : { x: 0, y: 0 };

    var alive = false;
    for (var i = this._particles.length - 1; i >= 0; i--) {
      var p = this._particles[i];
      p.worldX += p.vx;
      p.worldY += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0) {
        this._particles.splice(i, 1);
        continue;
      }
      alive = true;

      var sx = p.worldX * zoom + rect.left + offset.x;
      var sy = p.worldY * zoom + rect.top + offset.y;

      var particleColor = window.__particleAccent || '#a78bfa';
      ctx.globalAlpha = p.life * 0.7;
      ctx.shadowColor = particleColor;
      ctx.shadowBlur = 6 * p.life;
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(sx - rect.left, sy - rect.top, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (alive || this._particleSpawnActive) {
      this._particleAnimId = requestAnimationFrame(this._animateParticles.bind(this));
    } else {
      this._particleAnimId = null;
    }
  }

  closeMenu() {
    if (this.contextMenu) {
      this.contextMenu.close();
    }
  }
}
