import { EdgeRenderer } from './EdgeRenderer.js';

export class DeferredEdgeRenderer extends EdgeRenderer {
  constructor(layer) {
    super(layer);
    this.deferredEdges = [];
    this.deferredRafId = null;
    this.priorityEdges = new Set();
    this.priorityRects = new Map();
    this.isProcessingDeferred = false;
  }

  renderEdges(edges, graph, rectCache, priority = true) {
    if (priority) {
      this.priorityEdges.clear();
      this.priorityRects = rectCache;
      for (const edge of edges) {
        this.priorityEdges.add(edge.id);
        this.renderEdgeImmediate(edge, graph, rectCache);
      }
    } else {
      this.deferredEdges = edges.filter(e => !this.priorityEdges.has(e.id));
      this.scheduleDeferredRender(graph, rectCache);
    }
  }

  scheduleDeferredRender(graph, rectCache) {
    if (this.deferredRafId) {
      cancelAnimationFrame(this.deferredRafId);
    }
    
    this.deferredRafId = requestAnimationFrame(() => {
      this.processDeferredEdges(graph, rectCache);
    });
  }

  processDeferredEdges(graph, rectCache) {
    if (this.isProcessingDeferred) return;
    this.isProcessingDeferred = true;
    
    const batchSize = 20;
    let processed = 0;
    
    const processBatch = () => {
      const startTime = performance.now();
      
      while (processed < this.deferredEdges.length && (performance.now() - startTime) < 8) {
        const edge = this.deferredEdges[processed];
        this.renderEdgeImmediate(edge, graph, rectCache);
        processed++;
      }
      
      if (processed < this.deferredEdges.length) {
        requestAnimationFrame(processBatch);
      } else {
        this.cleanup();
      }
    };
    
    requestAnimationFrame(processBatch);
  }

  renderEdgeImmediate(edge, graph, rectCache) {
    const source = graph.getNode(edge.sourceId);
    const target = graph.getNode(edge.targetId);
    if (!source || !target) return;
    
    let sourceRect = rectCache.get(edge.sourceId);
    let targetRect = rectCache.get(edge.targetId);
    
    if (!sourceRect || !targetRect) {
      if (this.priorityRects.has(edge.sourceId)) {
        sourceRect = this.priorityRects.get(edge.sourceId);
      }
      if (this.priorityRects.has(edge.targetId)) {
        targetRect = this.priorityRects.get(edge.targetId);
      }
      if (!sourceRect || !targetRect) return;
    }
    
    const point1 = this.getBorderPoint(sourceRect, targetRect);
    const point2 = this.getBorderPoint(targetRect, sourceRect);
    const isBlue = edge.sourcePort === 'unmapped';
    const color = isBlue ? "#44aaff" : "#ffb347";
    
    const existingSvg = this.layer.querySelector('.edge-layer');
    let svg = existingSvg;
    if (!svg) {
      svg = this.createSvgLayer();
      this.layer.appendChild(svg);
    }
    
    const edgeId = `edge_${edge.id}`;
    const existingLine = svg.querySelector(`[data-edge-id="${edge.id}"]`);
    const existingArrow = svg.querySelector(`[data-arrow-id="${edge.id}"]`);
    
    if (existingLine) {
      existingLine.setAttribute("x1", point1.x);
      existingLine.setAttribute("y1", point1.y);
      existingLine.setAttribute("x2", point2.x);
      existingLine.setAttribute("y2", point2.y);
      if (existingArrow) {
        const midX = (point1.x + point2.x) / 2;
        const midY = (point1.y + point2.y) / 2;
        const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
        const tipX = midX + Math.cos(angle) * 6;
        const tipY = midY + Math.sin(angle) * 6;
        const backX = midX - Math.cos(angle) * 8;
        const backY = midY - Math.sin(angle) * 8;
        const perpX = -Math.sin(angle) * 5;
        const perpY = Math.cos(angle) * 5;
        const points = `${tipX},${tipY} ${backX + perpX},${backY + perpY} ${backX - perpX},${backY - perpY}`;
        existingArrow.setAttribute("points", points);
      }
    } else {
      const line = this.createLine(point1, point2, color, edge.id);
      const arrow = this.createArrow(point1, point2, color);
      arrow.setAttribute("data-arrow-id", edge.id);
      svg.appendChild(line);
      svg.appendChild(arrow);
      
      line.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (this.onEdgeRemoved) {
          const graph = this._getGraphFromEdge(edge);
          if (graph) {
            graph.removeEdge(edge.id);
            graph.reevaluateAll();
            graph.updateAllOutputs();
            this.onEdgeRemoved();
          }
        }
      });
    }
  }

  _getGraphFromEdge(edge) {
    if (typeof this._graphCache !== 'undefined') return this._graphCache;
    return null;
  }

  createSvgLayer() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add('edge-layer');
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "visible";
    return svg;
  }

  createLine(p1, p2, color, edgeId) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    line.classList.add("edge-line");
    line.setAttribute("stroke", color);
    line.style.pointerEvents = "visibleStroke";
    line.setAttribute("data-edge-id", edgeId);
    return line;
  }

  createArrow(p1, p2, color) {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const tipX = midX + Math.cos(angle) * 6;
    const tipY = midY + Math.sin(angle) * 6;
    const backX = midX - Math.cos(angle) * 8;
    const backY = midY - Math.sin(angle) * 8;
    const perpX = -Math.sin(angle) * 5;
    const perpY = Math.cos(angle) * 5;
    const points = `${tipX},${tipY} ${backX + perpX},${backY + perpY} ${backX - perpX},${backY - perpY}`;
    
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", points);
    arrow.setAttribute("fill", color);
    arrow.setAttribute("stroke", color === "#44aaff" ? "#88ccff" : "#ffda99");
    arrow.setAttribute("stroke-width", "1");
    arrow.setAttribute("stroke-linejoin", "round");
    return arrow;
  }

  getBorderPoint(fromRect, toRect) {
    const centerFrom = { x: fromRect.x + fromRect.w / 2, y: fromRect.y + fromRect.h / 2 };
    const centerTo = { x: toRect.x + toRect.w / 2, y: toRect.y + toRect.h / 2 };
    const dx = centerTo.x - centerFrom.x;
    const dy = centerTo.y - centerFrom.y;
    
    if (dx === 0 && dy === 0) {
      return { x: fromRect.x + fromRect.w / 2, y: fromRect.y + fromRect.h };
    }
    
    let t = Infinity;
    
    if (dx !== 0) {
      const tx1 = (fromRect.x - centerFrom.x) / dx;
      const tx2 = (fromRect.x + fromRect.w - centerFrom.x) / dx;
      if (tx1 > 0 && tx1 < t) {
        const y = centerFrom.y + dy * tx1;
        if (y >= fromRect.y && y <= fromRect.y + fromRect.h) t = tx1;
      }
      if (tx2 > 0 && tx2 < t) {
        const y = centerFrom.y + dy * tx2;
        if (y >= fromRect.y && y <= fromRect.y + fromRect.h) t = tx2;
      }
    }
    
    if (dy !== 0) {
      const ty1 = (fromRect.y - centerFrom.y) / dy;
      const ty2 = (fromRect.y + fromRect.h - centerFrom.y) / dy;
      if (ty1 > 0 && ty1 < t) {
        const x = centerFrom.x + dx * ty1;
        if (x >= fromRect.x && x <= fromRect.x + fromRect.w) t = ty1;
      }
      if (ty2 > 0 && ty2 < t) {
        const x = centerFrom.x + dx * ty2;
        if (x >= fromRect.x && x <= fromRect.x + fromRect.w) t = ty2;
      }
    }
    
    if (t === Infinity) t = 0;
    return { x: centerFrom.x + dx * t, y: centerFrom.y + dy * t };
  }

  setOnEdgeRemoved(callback) {
    this.onEdgeRemoved = callback;
  }

  cleanup() {
    this.deferredEdges = [];
    this.deferredRafId = null;
    this.isProcessingDeferred = false;
  }

  clear() {
    this.cleanup();
    this.priorityEdges.clear();
    this.priorityRects.clear();
    const svg = this.layer.querySelector('.edge-layer');
    if (svg) svg.remove();
  }
}
