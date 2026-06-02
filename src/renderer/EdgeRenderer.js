export class EdgeRenderer {
  constructor(layer, domRenderer) {
    this.layer = layer;
    this.domRenderer = domRenderer;
    this.onEdgeRemoved = null;
    this.particleFlowEnabled = false;
    this.particleAnimations = [];
  }
  setParticleFlowEnabled(enabled) {
    this.particleFlowEnabled = enabled;
    if (!enabled) this.clearParticles();
  }
  clearParticles() {
    for (const anim of this.particleAnimations) {
      if (anim.cancel) anim.cancel();
    }
    this.particleAnimations = [];
    const particles = this.layer.querySelectorAll('.edge-particle');
    particles.forEach(p => p.remove());
  }
  renderEdges(edges, graph, rectCache) {
    const oldSvg = this.layer.querySelector('.edge-layer');
    if (oldSvg) oldSvg.remove();
    const svg = this.createSvgLayer();
    this.layer.appendChild(svg);
    this.clearParticles();
    for (const edge of edges) {
      const source = graph.getNode(edge.sourceId);
      const target = graph.getNode(edge.targetId);
      if (!source || !target) continue;
      let sourceRect = rectCache.get(edge.sourceId);
      let targetRect = rectCache.get(edge.targetId);
      if (!sourceRect || !targetRect) {
        const srcEl = this.domRenderer.elementCache.get(edge.sourceId);
        const tgtEl = this.domRenderer.elementCache.get(edge.targetId);
        if (srcEl && tgtEl) {
          const srcRectDom = srcEl.getBoundingClientRect();
          const tgtRectDom = tgtEl.getBoundingClientRect();
          const offset = this.domRenderer.viewport.getOffset();
          const zoom = window.currentZoom || 1;
          sourceRect = { x: (srcRectDom.left - offset.x) / zoom, y: (srcRectDom.top - offset.y) / zoom, w: srcRectDom.width / zoom, h: srcRectDom.height / zoom };
          targetRect = { x: (tgtRectDom.left - offset.x) / zoom, y: (tgtRectDom.top - offset.y) / zoom, w: tgtRectDom.width / zoom, h: tgtRectDom.height / zoom };
        } else continue;
      }
      const p1 = this.getBorderPoint(sourceRect, targetRect);
      const p2 = this.getBorderPoint(targetRect, sourceRect);
      const cp1 = this.getControlPoint(p1, p2, 0.3);
      const cp2 = this.getControlPoint(p2, p1, 0.3);
      const isBlue = edge.sourcePort === 'unmapped';
      const color = isBlue ? "#44aaff" : "#ffb347";
      const path = this.createCurve(p1, cp1, cp2, p2, color, edge.id);
      const arrow = this.createArrowAtEnd(p1, cp1, cp2, p2, color);
      svg.appendChild(path);
      svg.appendChild(arrow);
      path.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        graph.removeEdge(edge.id);
        graph.reevaluateAll();
        graph.updateAllOutputs();
        if (this.onEdgeRemoved) this.onEdgeRemoved();
      });
      if (this.particleFlowEnabled) {
        this.animateParticlesCurve(p1, cp1, cp2, p2, color, svg);
      }
    }
  }
  getControlPoint(p1, p2, factor) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const perpX = -dy / dist * 40;
    const perpY = dx / dist * 40;
    return { x: p1.x + dx * factor + perpX, y: p1.y + dy * factor + perpY };
  }
  createCurve(p1, cp1, cp2, p2, color, edgeId) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    path.classList.add("edge-line", "edge-curve");
    path.style.pointerEvents = "visibleStroke";
    path.setAttribute("data-edge-id", edgeId);
    return path;
  }
  createArrowAtEnd(p1, cp1, cp2, p2, color) {
    const t = 0.95;
    const ax = Math.pow(1-t,3)*p1.x + 3*Math.pow(1-t,2)*t*cp1.x + 3*(1-t)*Math.pow(t,2)*cp2.x + Math.pow(t,3)*p2.x;
    const ay = Math.pow(1-t,3)*p1.y + 3*Math.pow(1-t,2)*t*cp1.y + 3*(1-t)*Math.pow(t,2)*cp2.y + Math.pow(t,3)*p2.y;
    const dt = 0.05;
    const bx = Math.pow(1-(t-dt),3)*p1.x + 3*Math.pow(1-(t-dt),2)*(t-dt)*cp1.x + 3*(1-(t-dt))*Math.pow(t-dt,2)*cp2.x + Math.pow(t-dt,3)*p2.x;
    const by = Math.pow(1-(t-dt),3)*p1.y + 3*Math.pow(1-(t-dt),2)*(t-dt)*cp1.y + 3*(1-(t-dt))*Math.pow(t-dt,2)*cp2.y + Math.pow(t-dt,3)*p2.y;
    const angle = Math.atan2(ay - by, ax - bx);
    const tipX = ax;
    const tipY = ay;
    const backX = ax - Math.cos(angle) * 8;
    const backY = ay - Math.sin(angle) * 8;
    const perpX = -Math.sin(angle) * 5;
    const perpY = Math.cos(angle) * 5;
    const points = `${tipX},${tipY} ${backX+perpX},${backY+perpY} ${backX-perpX},${backY-perpY}`;
    const arrow = document.createElementNS("http://www.w3.org/2000/svg","polygon");
    arrow.setAttribute("points", points);
    arrow.setAttribute("fill", color);
    arrow.setAttribute("stroke", color==="#44aaff"?"#88ccff":"#ffda99");
    arrow.setAttribute("stroke-width","1");
    arrow.setAttribute("stroke-linejoin","round");
    return arrow;
  }
  animateParticlesCurve(p1,cp1,cp2,p2,color,svg) {
    const duration = 2000;
    const startTime = performance.now();
    const particle = document.createElementNS("http://www.w3.org/2000/svg","circle");
    particle.setAttribute("r","3");
    particle.setAttribute("fill",color);
    particle.classList.add('edge-particle');
    svg.appendChild(particle);
    const animate = (now) => {
      const elapsed = (now - startTime) % duration;
      const t = elapsed / duration;
      const x = Math.pow(1-t,3)*p1.x + 3*Math.pow(1-t,2)*t*cp1.x + 3*(1-t)*Math.pow(t,2)*cp2.x + Math.pow(t,3)*p2.x;
      const y = Math.pow(1-t,3)*p1.y + 3*Math.pow(1-t,2)*t*cp1.y + 3*(1-t)*Math.pow(t,2)*cp2.y + Math.pow(t,3)*p2.y;
      particle.setAttribute("cx", x);
      particle.setAttribute("cy", y);
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    this.particleAnimations.push({ raf, particle, svg });
  }
  createSvgLayer() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.classList.add('edge-layer');
    svg.setAttribute("width","100%");
    svg.setAttribute("height","100%");
    svg.style.position="absolute";
    svg.style.top="0";
    svg.style.left="0";
    svg.style.pointerEvents="none";
    svg.style.overflow="visible";
    return svg;
  }
  getBorderPoint(fromRect, toRect) {
    const centerFrom = { x: fromRect.x + fromRect.w/2, y: fromRect.y + fromRect.h/2 };
    const centerTo = { x: toRect.x + toRect.w/2, y: toRect.y + toRect.h/2 };
    const dx = centerTo.x - centerFrom.x;
    const dy = centerTo.y - centerFrom.y;
    if (dx===0 && dy===0) return { x: fromRect.x+fromRect.w/2, y: fromRect.y+fromRect.h };
    let t = Infinity;
    if (dx!==0) {
      const tx1 = (fromRect.x - centerFrom.x)/dx;
      const tx2 = (fromRect.x+fromRect.w - centerFrom.x)/dx;
      if (tx1>0 && tx1<t) {
        const y = centerFrom.y + dy*tx1;
        if (y>=fromRect.y && y<=fromRect.y+fromRect.h) t = tx1;
      }
      if (tx2>0 && tx2<t) {
        const y = centerFrom.y + dy*tx2;
        if (y>=fromRect.y && y<=fromRect.y+fromRect.h) t = tx2;
      }
    }
    if (dy!==0) {
      const ty1 = (fromRect.y - centerFrom.y)/dy;
      const ty2 = (fromRect.y+fromRect.h - centerFrom.y)/dy;
      if (ty1>0 && ty1<t) {
        const x = centerFrom.x + dx*ty1;
        if (x>=fromRect.x && x<=fromRect.x+fromRect.w) t = ty1;
      }
      if (ty2>0 && ty2<t) {
        const x = centerFrom.x + dx*ty2;
        if (x>=fromRect.x && x<=fromRect.x+fromRect.w) t = ty2;
      }
    }
    if (t===Infinity) t=0;
    return { x: centerFrom.x + dx*t, y: centerFrom.y + dy*t };
  }
  setOnEdgeRemoved(callback) {
    this.onEdgeRemoved = callback;
  }
}
