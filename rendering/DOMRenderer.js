import { Edge } from '../core/Edge.js';
import { NumberNode } from '../nodes/NumberNode.js';
import { GroupNode } from '../nodes/GroupNode.js';
import { CalcNode } from '../nodes/CalcNode.js';
import { OutputNode } from '../nodes/OutputNode.js';
import { MapNode } from '../nodes/MapNode.js';
import { EditableTitle } from '../ui/EditableTitle.js';
import { typeSystem } from '../core/DataType.js';

export class DomRenderer {
  constructor(graph, layer, viewportElement) {
    this.graph = graph;
    this.layer = layer;
    this.viewportElement = viewportElement;
    this.viewport = null;
    this.history = null;
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
    this.contextMenu = null;
    this.virtual = false;
    this.heightCache = new Map();
    this.elementCache = new Map();
    this.opts = {
      willChange: false,
      contain: false,
      pointerEvents: false
    };
  }

  setViewport(viewport) {
    this.viewport = viewport;
  }

  setHistory(history) {
    this.history = history;
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

  renderEdges(visibleNodes) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add('edge-layer');
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "visible";
    this.layer.appendChild(svg);
    
    const nodeIds = new Set(visibleNodes.map(n => n.id));
    const rectCache = new Map();
    
    for (const node of visibleNodes) {
      rectCache.set(node.id, {
        x: node.x,
        y: node.y,
        w: 280,
        h: this.getNodeHeight(node)
      });
    }
    
    for (const edge of this.graph.edges) {
      if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) continue;
      
      const source = this.graph.getNode(edge.sourceId);
      const target = this.graph.getNode(edge.targetId);
      if (!source || !target) continue;
      
      const sourceRect = rectCache.get(edge.sourceId);
      const targetRect = rectCache.get(edge.targetId);
      if (!sourceRect || !targetRect) continue;
      
      const point1 = this.getBorderPoint(sourceRect, targetRect);
      const point2 = this.getBorderPoint(targetRect, sourceRect);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", point1.x);
      line.setAttribute("y1", point1.y);
      line.setAttribute("x2", point2.x);
      line.setAttribute("y2", point2.y);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");
      line.classList.add("edge-line");
      
      const isBlue = edge.sourcePort === 'unmapped';
      line.setAttribute("stroke", isBlue ? "#44aaff" : "#ffb347");
      line.style.pointerEvents = "visibleStroke";
      line.setAttribute("data-edge-id", edge.id);
      
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
      
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      arrow.setAttribute("points", points);
      arrow.setAttribute("fill", isBlue ? "#44aaff" : "#ffb347");
      arrow.setAttribute("stroke", isBlue ? "#88ccff" : "#ffda99");
      arrow.setAttribute("stroke-width", "1");
      arrow.setAttribute("stroke-linejoin", "round");
      
      svg.appendChild(line);
      svg.appendChild(arrow);
      
      line.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.graph.removeEdge(edge.id);
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
      });
    }
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
      const element = node.createDOM(this.graph, this);
      this.layer.appendChild(element);
      this.elementCache.set(node.id, element);
      this.updateNodeClass(node);
      this.applyOptStyles(element);
    }
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "visible";
    this.layer.appendChild(svg);
    
    const rectCache = new Map();
    for (const node of this.graph.nodes) {
      rectCache.set(node.id, {
        x: node.x,
        y: node.y,
        w: 280,
        h: this.getNodeHeight(node)
      });
    }
    
    for (const edge of this.graph.edges) {
      const source = this.graph.getNode(edge.sourceId);
      const target = this.graph.getNode(edge.targetId);
      if (!source || !target) continue;
      
      const sourceRect = rectCache.get(edge.sourceId);
      const targetRect = rectCache.get(edge.targetId);
      if (!sourceRect || !targetRect) continue;
      
      const point1 = this.getBorderPoint(sourceRect, targetRect);
      const point2 = this.getBorderPoint(targetRect, sourceRect);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", point1.x);
      line.setAttribute("y1", point1.y);
      line.setAttribute("x2", point2.x);
      line.setAttribute("y2", point2.y);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");
      line.classList.add("edge-line");
      
      const isBlue = edge.sourcePort === 'unmapped';
      line.setAttribute("stroke", isBlue ? "#44aaff" : "#ffb347");
      line.style.pointerEvents = "visibleStroke";
      line.setAttribute("data-edge-id", edge.id);
      
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
      
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      arrow.setAttribute("points", points);
      arrow.setAttribute("fill", isBlue ? "#44aaff" : "#ffb347");
      arrow.setAttribute("stroke", isBlue ? "#88ccff" : "#ffda99");
      arrow.setAttribute("stroke-width", "1");
      arrow.setAttribute("stroke-linejoin", "round");
      
      svg.appendChild(line);
      svg.appendChild(arrow);
      
      line.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.graph.removeEdge(edge.id);
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
      });
    }
    
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
        this.startDragEdge(sourceId, port, moveEvent.clientX, moveEvent.clientY);
      }
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (!moved) this.showMenu(startX, startY, sourceId);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
        this.render();
        this.save();
      }
    }
    
    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgeSourcePort = null;
    document.body.style.cursor = '';
    this.clearTemp();
  }

  showMenu(x, y, sourceId) {
    if (this.contextMenu) this.contextMenu.remove();
    
    const menu = document.createElement('div');
    menu.className = 'node-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    const addMenuItem = (text, onClick) => {
      const item = document.createElement('div');
      item.className = 'node-menu-item';
      item.textContent = text;
      item.onclick = () => {
        onClick();
        this.closeMenu();
      };
      menu.appendChild(item);
    };
    
    const sourceNode = this.graph.getNode(sourceId);
    const baseX = sourceNode ? sourceNode.x + 280 : 500;
    const baseY = sourceNode ? sourceNode.y + 300 : 300;
    
    const createAndConnect = (NodeClass, title, port, ...args) => {
      const node = new NodeClass(0, baseX, baseY, title, ...args);
      this.graph.addNode(node);
      const edge = this.graph.addEdge(sourceId, node.id, port);
      if (edge) {
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
      }
    };
    
    addMenuItem('Число + связь', () => {
      const NumberNode = (await import('../nodes/NumberNode.js')).NumberNode;
      createAndConnect(NumberNode, "Число", 'main', 0);
    });
    
    addMenuItem('Группа + связь', () => {
      const GroupNode = (await import('../nodes/GroupNode.js')).GroupNode;
      createAndConnect(GroupNode, "Группа", 'main', [{ name: "Значение", val: 0 }]);
    });
    
    addMenuItem('Вывод + связь', () => {
      const OutputNode = (await import('../nodes/OutputNode.js')).OutputNode;
      createAndConnect(OutputNode, "Вывод", 'main', []);
    });
    
    menu.appendChild(document.createElement('hr'));
    
    const submenuContainer = document.createElement('div');
    submenuContainer.className = 'node-menu-sub';
    const submenuTitle = document.createElement('div');
    submenuTitle.className = 'node-menu-item';
    submenuTitle.textContent = 'Погрешности >';
    const submenu = document.createElement('div');
    submenu.className = 'node-menu-submenu';
    
    const addCalcType = (text, type) => {
      const item = document.createElement('div');
      item.className = 'node-menu-item';
      item.textContent = text;
      item.onclick = () => {
        const CalcNode = (await import('../nodes/CalcNode.js')).CalcNode;
        const node = new CalcNode(0, baseX + 20, baseY + 160, text, type);
        this.graph.addNode(node);
        this.graph.addEdge(sourceId, node.id, 'main');
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
        this.closeMenu();
      };
      submenu.appendChild(item);
    };
    
    addCalcType('Погрешность измерения', 'div3');
    addCalcType('Погрешность округления', 'div_sqrt12');
    addCalcType('Суммарная погрешность', 'sqrt_sum_sq');
    
    submenuContainer.appendChild(submenuTitle);
    submenuContainer.appendChild(submenu);
    menu.appendChild(submenuContainer);
    
    addMenuItem('Карта преобразований', () => {
      const MapNode = (await import('../nodes/MapNode.js')).MapNode;
      createAndConnect(MapNode, "Карта", 'main', [{ x: 0, y: 0 }]);
    });
    
    menu.appendChild(document.createElement('hr'));
    
    addMenuItem('Выделить ВАЖНЫЙ нод', () => {
      if (sourceNode) {
        sourceNode.important = true;
        this.updateNodeClass(sourceNode);
        this.render();
        this.save();
      }
    });
    
    addMenuItem('Снять выделение ВАЖНОГО', () => {
      if (sourceNode) {
        sourceNode.important = false;
        this.updateNodeClass(sourceNode);
        this.render();
        this.save();
      }
    });
    
    document.body.appendChild(menu);
    this.contextMenu = menu;
    
    const closeHandler = (ev) => {
      if (!menu.contains(ev.target)) this.closeMenu();
      document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  closeMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
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
        header.addEventListener('mousedown', this.onNodeDown.bind(this));
      }
    });
  }

  onNodeDown(event) {
    if (event.button !== 0) return;
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
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragNodeStartX = node.x;
    this.dragNodeStartY = node.y;
    
    document.body.style.cursor = 'grabbing';
    event.preventDefault();
  }

  onGlobalMove(event) {
    if (this.dragNode) {
      const deltaX = (event.clientX - this.dragStartX) / (window.currentZoom || 1);
      const deltaY = (event.clientY - this.dragStartY) / (window.currentZoom || 1);
      this.dragNode.x = this.dragNodeStartX + deltaX;
      this.dragNode.y = this.dragNodeStartY + deltaY;
      
      const element = document.querySelector(`.node[data-id='${this.dragNode.id}']`);
      if (element) {
        element.style.left = `${this.dragNode.x}px`;
        element.style.top = `${this.dragNode.y}px`;
      }
      this.render();
    }
  }

  onGlobalUp() {
    if (this.dragNode) {
      this.save();
      this.dragNode = null;
      document.body.style.cursor = '';
    }
  }

  setVirtual(enabled) {
    if (this.virtual === enabled) return;
    this.virtual = enabled;
    this.elementCache.clear();
    this.render();
  }
}
