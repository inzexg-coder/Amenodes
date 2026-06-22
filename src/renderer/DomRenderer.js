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
        // Use handle center so line starts from port center regardless of node scaling
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
    this.tempLine.setAttribute("stroke", port === 'unmapped' ? "#44aaff" : (window.__premiumAccent ? window.__premiumAccent() : "#ffaa55"));
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
    if (!this.isDraggingEdge || !this.tempLine) return;

    var cx = this.getClientX(event);
    var cy = this.getClientY(event);
    var point = this.getCanvasCoords(cx, cy);

    // Magnetic node preview (premium)
    if (this.magneticNodesEnabled()) {
      this.updateMagneticPreview(cx, cy, point, event);
    } else {
      this.tempLine.setAttribute("x2", point.x);
      this.tempLine.setAttribute("y2", point.y);
    }
  }

  updateMagneticPreview(clientX, clientY, fallbackPoint, event) {
    var MAGNET_ZONE = 40;  // px — connection preview zone

    // Find nearest node (different from source)
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

    // Clear previous magnetic node visual
    if (this.magneticNode && this.magneticNode !== nearest) {
      this.magneticNode.classList.remove('node-magnetic-glow');
      this.magneticNode.classList.remove('node-magnetic-snap');
      this.magneticNode = null;
    }

    // Reset line to free dashed, remove arrow
    this.tempLine.setAttribute("x2", fallbackPoint.x);
    this.tempLine.setAttribute("y2", fallbackPoint.y);
    this.tempLine.setAttribute("stroke-dasharray", "6,4");
    this._removeTempArrow();

    if (nearest && minDist < MAGNET_ZONE) {
      // Check data type compatibility only (not edge capability)
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
            // Compatible if both types registered and target allows this source type
            dataCompatible = srcDef && tgtDef && (tgtDef.allowedInputTypes.length === 0 || tgtDef.allowedInputTypes.includes(srcDT));
          }
        } catch(e) { console.warn('[Magnetic] type check error:', e); }
      }

      if (dataCompatible) {
        // Compatible — preview: node glows, line solid with arrow to node border
        nearest.classList.add('node-magnetic-snap');

        // Get source port canvas position
        var srcX = parseFloat(this.tempLine.getAttribute('x1'));
        var srcY = parseFloat(this.tempLine.getAttribute('y1'));

        // Convert target rect to canvas coords
        var vr = this.viewportElement.getBoundingClientRect();
        var offset = this.viewport ? this.viewport.getOffset() : { x: 0, y: 0 };
        var zoom = window.currentZoom || 1;

        var tCanvasX = (nearestRect.left - vr.left - offset.x) / zoom;
        var tCanvasY = (nearestRect.top - vr.top - offset.y) / zoom;
        var tCanvasW = nearestRect.width / zoom;
        var tCanvasH = nearestRect.height / zoom;

        // Target center in canvas coords
        var tCenterX = tCanvasX + tCanvasW / 2;
        var tCenterY = tCanvasY + tCanvasH / 2;

        // Calculate border intersection: line from src to target center, crossing target rect border
        var borderPoint = this._lineToRectBorder(srcX, srcY, tCenterX, tCenterY, tCanvasX, tCanvasY, tCanvasW, tCanvasH);

        // Update line to border point
        this.tempLine.setAttribute("stroke-dasharray", "none");
        this.tempLine.setAttribute("stroke-width", "3");
        this.tempLine.setAttribute("x2", borderPoint.x);
        this.tempLine.setAttribute("y2", borderPoint.y);

        // Arrow at midpoint between source and border
        this._addTempArrow(
          { x: srcX, y: srcY },
          { x: borderPoint.x, y: borderPoint.y }
        );

        this.magneticNode = nearest;
      } else {
        // Incompatible — just glow the node, line stays dashed
        nearest.classList.add('node-magnetic-glow');
        this.magneticNode = nearest;
      }
    }
  }

  _lineToRectBorder(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Line from (x1,y1) to (x2,y2), find intersection with rect (rx,ry,rw,rh)
    // If line starts inside rect, return the start point
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) {
      return { x: x1, y: y1 };
    }

    var dx = x2 - x1;
    var dy = y2 - y1;
    var t = Infinity;

    // Check intersection with each rect edge
    // Left edge
    if (dx !== 0) {
      var tLeft = (rx - x1) / dx;
      if (tLeft > 0 && tLeft < t) {
        var y = y1 + dy * tLeft;
        if (y >= ry && y <= ry + rh) t = tLeft;
      }
      // Right edge
      var tRight = (rx + rw - x1) / dx;
      if (tRight > 0 && tRight < t) {
        var y = y1 + dy * tRight;
        if (y >= ry && y <= ry + rh) t = tRight;
      }
    }
    // Top edge
    if (dy !== 0) {
      var tTop = (ry - y1) / dy;
      if (tTop > 0 && tTop < t) {
        var x = x1 + dx * tTop;
        if (x >= rx && x <= rx + rw) t = tTop;
      }
      // Bottom edge
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
      arrow.setAttribute("fill", window.__premiumAccent ? window.__premiumAccent() : "#ffb347");
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
      // Use magnetic target node
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
        // Connection failed — flash both nodes red briefly using inline box-shadow
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

    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgeSourcePort = null;
    this.magneticNode = null;
    this._removeTempArrow();
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
      nodeElement.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
      nodeElement.style.transform = 'scale(1.03)';
    }

    document.body.style.cursor = 'grabbing';
    event.preventDefault();
  }

  onGlobalMove(event) {
    if (this.dragNode) {
      const cx = this.getClientX(event);
      const cy = this.getClientY(event);
      const deltaX = (cx - this.dragStartX) / (window.currentZoom || 1);
      const deltaY = (cy - this.dragStartY) / (window.currentZoom || 1);

      // Touch drag threshold: wait until finger moves > 5px
      if (!this._touchDragConfirmed && event.type === 'touchmove') {
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (dist < 5) {
          // Track small movements so inertia has data even on short touch drags
          this._dragHistory.push({ x: this.dragNodeStartX + deltaX, y: this.dragNodeStartY + deltaY, t: Date.now() });
          while (this._dragHistory.length > 5) this._dragHistory.shift();
          return;
        }
        this._touchDragConfirmed = true;
        const el = this.elementCache.get(this.dragNode.id);
        if (el) {
          el.classList.remove('node-touch-active');
          el.classList.add('node-dragging');
          el.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
          el.style.transform = 'scale(1.03)';
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

      // Track velocity for inertia
      this._dragHistory.push({ x: newX, y: newY, t: Date.now() });
      while (this._dragHistory.length > 5) this._dragHistory.shift();

      if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
    }
  }
  onGlobalUp(event) {
    if (this.dragNode) {
      // Touch drag was never confirmed — treat as tap, keep touch-active (removed by timeout)
      if (this._touchDragConfirmed === false && event && event.type === 'touchend') {
        this._dragHistory = [];
        this.dragNode = null;
        return;
      }

      const dragEl = this.elementCache.get(this.dragNode.id);
      if (dragEl) {
        dragEl.classList.remove('node-dragging');
        if (!this.inertiaEnabled()) {
          // No inertia: smooth handoff from drag scale to normal/hover
          dragEl.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          dragEl.style.transform = '';
          setTimeout(function() {
            if (dragEl) dragEl.style.transition = '';
          }, 200);
        } else {
          // Inertia: keep scale during overshoot, clear transform on spring-back
          dragEl.classList.add('node-inertia');
        }
      }

      // Inertia overshoot for premium
      if (this._inertiaAnimId) { cancelAnimationFrame(this._inertiaAnimId); this._inertiaAnimId = null; }
      if (this.inertiaEnabled() && this._dragHistory.length >= 2) {
        var hist = this._dragHistory;
        var last = hist[hist.length - 1];
        var first = hist[0];
        var dt = (last.t - first.t) || 1;
        var vx = (last.x - first.x) / dt * 40;
        var vy = (last.y - first.y) / dt * 40;
        var speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 2) {
          var overshootX = Math.max(-60, Math.min(60, vx * 2.0));
          var overshootY = Math.max(-60, Math.min(60, vy * 2.0));
          var finalX = this.dragNode.x;
          var finalY = this.dragNode.y;
          // Apply overshoot
          this.dragNode.x = finalX + overshootX;
          this.dragNode.y = finalY + overshootY;
          if (dragEl) {
            dragEl.style.transition = 'none';
            dragEl.style.left = this.dragNode.x + 'px';
            dragEl.style.top = this.dragNode.y + 'px';
          }
          this.updateEdgePositions();
          // Spring back after a tiny delay (clear scale here)
          var self = this;
          var savedDragNode = this.dragNode;
          requestAnimationFrame(function() {
            if (!savedDragNode) return;
            dragEl.style.transition = 'left 0.45s cubic-bezier(0.18, 2.5, 0.3, 1), top 0.45s cubic-bezier(0.18, 2.5, 0.3, 1)';
            savedDragNode.x = finalX;
            savedDragNode.y = finalY;
            dragEl.style.left = finalX + 'px';
            dragEl.style.top = finalY + 'px';
            self.updateEdgePositions();
            // Clear inline transform so scale returns to normal during spring-back
            dragEl.style.transform = '';
            self._inertiaAnimId = setTimeout(function() {
              if (dragEl) {
                dragEl.style.transition = '';
                dragEl.style.transform = '';
                dragEl.classList.remove('node-inertia');
              }
              self._inertiaAnimId = null;
            }, 500);
          });
        } else {
          // Speed too low — still do smooth handoff
          if (dragEl) {
            dragEl.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            dragEl.style.transform = '';
            setTimeout(function() {
              if (dragEl) dragEl.style.transition = '';
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

  closeMenu() {
    if (this.contextMenu) {
      this.contextMenu.close();
    }
  }
}
