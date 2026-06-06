export class EdgeRenderer {
  constructor(layer) {
    this.layer = layer;
    this.onEdgeRemoved = null;
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
      const color = isBlue ? "#44aaff" : "#ffb347";
      
      const line = this.createLine(point1, point2, color, edge.id);
      const arrow = this.createArrow(point1, point2, color);
      
      svg.appendChild(line);
      svg.appendChild(arrow);
      
      line.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        graph.removeEdge(edge.id);
        graph.reevaluateAll();
        graph.updateAllOutputs();
        if (this.onEdgeRemoved) this.onEdgeRemoved();
      });
    }
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
    
    // Add glow filters
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const lineGlow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    lineGlow.setAttribute("id", "line-glow");
    lineGlow.setAttribute("x", "-50%");
    lineGlow.setAttribute("y", "-50%");
    lineGlow.setAttribute("width", "200%");
    lineGlow.setAttribute("height", "200%");
    
    const blur1 = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blur1.setAttribute("stdDeviation", "3");
    blur1.setAttribute("result", "blur");
    lineGlow.appendChild(blur1);
    const merge1 = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const mn1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mn1.setAttribute("in", "blur");
    merge1.appendChild(mn1);
    const mn2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mn2.setAttribute("in", "SourceGraphic");
    merge1.appendChild(mn2);
    lineGlow.appendChild(merge1);
    defs.appendChild(lineGlow);
    
    const arrowGlow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    arrowGlow.setAttribute("id", "arrow-glow");
    arrowGlow.setAttribute("x", "-50%");
    arrowGlow.setAttribute("y", "-50%");
    arrowGlow.setAttribute("width", "200%");
    arrowGlow.setAttribute("height", "200%");
    
    const blur2 = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blur2.setAttribute("stdDeviation", "2");
    blur2.setAttribute("result", "blur");
    arrowGlow.appendChild(blur2);
    const merge2 = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const mn3 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mn3.setAttribute("in", "blur");
    merge2.appendChild(mn3);
    const mn4 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mn4.setAttribute("in", "SourceGraphic");
    merge2.appendChild(mn4);
    arrowGlow.appendChild(merge2);
    defs.appendChild(arrowGlow);
    
    svg.appendChild(defs);
    return svg;
  }

  createLine(p1, p2, color, edgeId) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-edge-id", edgeId);
    
    // Glow line (thick, translucent)
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "line");
    glow.setAttribute("x1", p1.x);
    glow.setAttribute("y1", p1.y);
    glow.setAttribute("x2", p2.x);
    glow.setAttribute("y2", p2.y);
    glow.setAttribute("stroke-width", "6");
    glow.setAttribute("stroke-linecap", "round");
    glow.setAttribute("stroke", color === "#44aaff" ? "rgba(68,170,255,0.2)" : "rgba(255,179,71,0.2)");
    glow.setAttribute("filter", "url(#line-glow)");
    glow.style.pointerEvents = "none";
    group.appendChild(glow);
    
    // Main line
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
    group.appendChild(line);
    
    // Bright core line (thin)
    const core = document.createElementNS("http://www.w3.org/2000/svg", "line");
    core.setAttribute("x1", p1.x);
    core.setAttribute("y1", p1.y);
    core.setAttribute("x2", p2.x);
    core.setAttribute("y2", p2.y);
    core.setAttribute("stroke-width", "1");
    core.setAttribute("stroke-linecap", "round");
    core.setAttribute("stroke", color === "#44aaff" ? "rgba(150,210,255,0.6)" : "rgba(255,220,160,0.6)");
    core.style.pointerEvents = "none";
    group.appendChild(core);
    
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
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Glow
    const glowPoints = `${tipX},${tipY} ${backX + perpX + perpX*0.3},${backY + perpY + perpY*0.3} ${backX - perpX - perpX*0.3},${backY - perpY - perpY*0.3}`;
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    glow.setAttribute("points", glowPoints);
    glow.setAttribute("fill", color === "#44aaff" ? "rgba(68,170,255,0.3)" : "rgba(255,179,71,0.3)");
    glow.setAttribute("filter", "url(#arrow-glow)");
    group.appendChild(glow);
    
    // Main arrow
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", points);
    arrow.setAttribute("fill", color);
    arrow.setAttribute("stroke", color === "#44aaff" ? "#88ccff" : "#ffda99");
    arrow.setAttribute("stroke-width", "1");
    arrow.setAttribute("stroke-linejoin", "round");
    group.appendChild(arrow);
    
    return group;
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
