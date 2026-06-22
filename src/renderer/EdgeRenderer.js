export class EdgeRenderer {
  constructor(layer) {
    this.layer = layer;
    this.onEdgeRemoved = null;
    this.highlightedEdgeId = null;
    this.longPressTimer = null;
    this.ignoreNextClick = false;
  }

  renderEdges(edges, graph, rectCache) {
    const oldSvg = this.layer.querySelector('.edge-layer');
    if (oldSvg) oldSvg.remove();

    const svg = this.createSvgLayer();
    this.layer.appendChild(svg);

    for (const edge of edges) {
      const source = graph.getNode(edge.sourceId);
      const target = graph.getNode(edge.targetId);
      if (!source || !target) continue;

      const sourceRect = rectCache.get(edge.sourceId);
      const targetRect = rectCache.get(edge.targetId);
      if (!sourceRect || !targetRect) continue;

      const point1 = this.getBorderPoint(sourceRect, targetRect);
      const point2 = this.getBorderPoint(targetRect, sourceRect);
      const isBlue = edge.sourcePort === 'unmapped';
      const color = isBlue ? "#44aaff" : (window.__premiumAccent ? window.__premiumAccent() : "#ffb347");

      const lineGroup = this.createLine(point1, point2, color, edge.id);
      const arrow = this.createArrow(point1, point2, color);

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.classList.add('edge-group');
      if (isBlue) group.classList.add('edge-blue');
      group.setAttribute('data-edge-id', edge.id);
      group.appendChild(lineGroup);
      group.appendChild(arrow);
      svg.appendChild(group);

      group.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.clearHighlight();
        this.removeEdge(edge, graph);
      });

      group.addEventListener('click', (ev) => {
        ev.stopPropagation();
        
        group.classList.add('edge-wave');
        setTimeout(function() { group.classList.remove('edge-wave'); }, 700);
        this.clearHighlight();
      });

      group.addEventListener('touchstart', (ev) => {
        ev.stopPropagation();
        
        group.classList.add('edge-wave');
        setTimeout(function() { group.classList.remove('edge-wave'); }, 700);
        this.longPressTimer = setTimeout(() => {
          this.ignoreNextClick = true;
          this.clearHighlight();
          this.removeEdge(edge, graph);
          this.longPressTimer = null;
        }, 700);
      }, { passive: true });

      group.addEventListener('touchmove', () => {
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }, { passive: true });

      group.addEventListener('touchend', () => {
        if (this.longPressTimer) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }, { passive: true });

      if (this.highlightedEdgeId === edge.id) {
        group.classList.add('edge-highlighted');
      }
    }
  }

  setHighlight(edgeId) {
    this.clearHighlight();
    this.highlightedEdgeId = edgeId;
    const group = this.layer.querySelector(`g[data-edge-id="${edgeId}"]`);
    if (group) group.classList.add('edge-highlighted');
  }

  clearHighlight() {
    if (this.highlightedEdgeId) {
      const prev = this.layer.querySelector(`g[data-edge-id="${this.highlightedEdgeId}"]`);
      if (prev) prev.classList.remove('edge-highlighted');
      this.highlightedEdgeId = null;
    }
  }

  updateHitbox(lineGroup, p1, p2) {
    const hitbox = lineGroup ? lineGroup.querySelector('.edge-hitbox') : null;
    const line = lineGroup ? lineGroup.querySelector('.edge-line') : null;
    if (hitbox) {
      hitbox.setAttribute('x1', p1.x);
      hitbox.setAttribute('y1', p1.y);
      hitbox.setAttribute('x2', p2.x);
      hitbox.setAttribute('y2', p2.y);
    }
    if (line) {
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
    }
  }

  updatePositions(edges, graph, rectCache) {
    const svg = this.layer.querySelector('.edge-layer');
    if (!svg) return;

    for (const edge of edges) {
      const source = graph.getNode(edge.sourceId);
      const target = graph.getNode(edge.targetId);
      if (!source || !target) continue;

      const sourceRect = rectCache.get(edge.sourceId);
      const targetRect = rectCache.get(edge.targetId);
      if (!sourceRect || !targetRect) continue;

      const group = svg.querySelector(`g[data-edge-id="${edge.id}"]`);
      if (!group) continue;

      const point1 = this.getBorderPoint(sourceRect, targetRect);
      const point2 = this.getBorderPoint(targetRect, sourceRect);

      if (!isFinite(point1.x) || !isFinite(point1.y) || !isFinite(point2.x) || !isFinite(point2.y)) continue;
      const lineGroup = group.querySelector('.edge-line-group');
      const arrow = group.querySelector('.edge-arrow');

      if (lineGroup) {
        this.updateHitbox(lineGroup, point1, point2);
      }

      if (arrow) {
        const midX = (point1.x + point2.x) / 2;
        const midY = (point1.y + point2.y) / 2;
        const angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
        const tipX = midX + Math.cos(angle) * 6;
        const tipY = midY + Math.sin(angle) * 6;
        const backX = midX - Math.cos(angle) * 8;
        const backY = midY - Math.sin(angle) * 8;
        const perpX = -Math.sin(angle) * 5;
        const perpY = Math.cos(angle) * 5;
        arrow.setAttribute('points', `${tipX},${tipY} ${backX + perpX},${backY + perpY} ${backX - perpX},${backY - perpY}`);
      }
    }
  }

  removeEdge(edge, graph) {
    graph.removeEdge(edge.id);
    graph.reevaluateAll();
    graph.updateAllOutputs();
    if (this.onEdgeRemoved) this.onEdgeRemoved();
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
    
    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hitbox.setAttribute("x1", p1.x);
    hitbox.setAttribute("y1", p1.y);
    hitbox.setAttribute("x2", p2.x);
    hitbox.setAttribute("y2", p2.y);
    hitbox.setAttribute("stroke-width", "14");
    hitbox.setAttribute("stroke", "transparent");
    hitbox.setAttribute("stroke-linecap", "round");
    hitbox.style.pointerEvents = "visibleStroke";
    hitbox.classList.add("edge-hitbox");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    line.classList.add("edge-line");
    line.setAttribute("stroke", color);
    line.style.pointerEvents = "none";
    line.setAttribute("data-edge-id", edgeId);
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(hitbox);
    group.appendChild(line);
    group.classList.add("edge-line-group");
    return group;
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
    arrow.setAttribute("stroke", color === "#44aaff" ? "#88ccff" : color);
    arrow.setAttribute("stroke-width", "1");
    arrow.setAttribute("stroke-linejoin", "round");
    arrow.classList.add("edge-arrow");
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
}
