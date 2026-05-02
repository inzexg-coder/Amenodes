import { NumberNode } from '../nodes/NumberNode.js';
import { GroupNode } from '../nodes/GroupNode.js';
import { CalcNode } from '../nodes/CalcNode.js';
import { OutputNode } from '../nodes/OutputNode.js';
import { ConstantNode } from '../nodes/ConstantNode.js';
import { MapNode } from '../nodes/MapNode.js';
import { Edge } from './Edge.js';
import { typeSystem, DataType } from './DataType.js';
import { modal } from '../ui/CustomModal.js';

export class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.nextId = 1;
    this.nextEdgeId = 1;
    this.map = new Map();
  }

  addNode(node) {
    node.id = this.nextId++;
    this.nodes.push(node);
    this.map.set(node.id, node);
    if (node instanceof MapNode || node instanceof OutputNode) node.graph = this;
    return node;
  }

  hasCycle(source, target) {
    if (source === target) return true;
    const visited = new Set();
    const stack = [target];
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      if (current === source) return true;
      for (const edge of this.edges) {
        if (edge.sourceId === current) stack.push(edge.targetId);
      }
    }
    return false;
  }

  canConnect(sourceId, targetId, port = 'main') {
    const source = this.map.get(sourceId);
    const target = this.map.get(targetId);
    if (!source || !target) return false;
    
    const sourceType = typeSystem.getNodeType(source);
    const targetType = typeSystem.getNodeType(target);
    
    return typeSystem.canConnect(sourceType, source.type, targetType, target.type);
  }

  addEdge(sourceId, targetId, port = 'main') {
    const source = this.map.get(sourceId);
    const target = this.map.get(targetId);
    if (!source || !target) return null;
    
    if (!this.canConnect(sourceId, targetId, port)) {
      modal.alert(`Невозможно соединить: ${typeSystem.getTypeDefinition(typeSystem.getNodeType(source)).name} → ${typeSystem.getTypeDefinition(typeSystem.getNodeType(target)).name}`);
      return null;
    }
    
    if (this.hasCycle(sourceId, targetId)) {
      modal.alert("Циклическая зависимость!");
      return null;
    }
    
    if (this.edges.some(e => e.sourceId === sourceId && e.targetId === targetId && e.sourcePort === port)) return null;
    
    const edge = new Edge(this.nextEdgeId++, sourceId, targetId, port);
    this.edges.push(edge);
    return edge;
  }

  removeNode(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.map.delete(id);
    this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
  }
  
  removeEdge(id) {
    this.edges = this.edges.filter(e => e.id !== id);
  }

  getNode(id) {
    return this.map.get(id);
  }

  getIncomingEdges(targetId) {
    return this.edges.filter(e => e.targetId === targetId);
  }

  getOutgoingEdges(sourceId) {
    return this.edges.filter(e => e.sourceId === sourceId);
  }

  getSourceValue(source, port = 'main', visited = new Set()) {
    if (visited.has(source.id)) return [];
    visited.add(source.id);
  
    if (source instanceof MapNode && port === 'unmapped') return source.getUnmapped();
    if (source instanceof NumberNode || source instanceof GroupNode) return source.getValue();
    if (source instanceof ConstantNode) return source.getValue();
    if (source instanceof MapNode) return source.getValue();
    if (source instanceof CalcNode) {
      const result = source.getValue();
      if (result == null) return [];
      return Array.isArray(result) ? result : [result];
    }
    if (source instanceof OutputNode) {
      const incoming = this.getIncomingEdges(source.id);
      if (!incoming.length) return [];
      const all = [];
      for (const edge of incoming) {
        const parent = this.map.get(edge.sourceId);
        const value = this.getSourceValue(parent, edge.sourcePort, visited);
        if (Array.isArray(value)) all.push(...value);
        else if (value != null && !isNaN(value)) all.push(value);
      }
      return all;
    }
    return [];
  }

  getMergedInput(nodeId) {
    const incoming = this.getIncomingEdges(nodeId);
    if (!incoming.length) return [];
    const values = [];
    for (const edge of incoming) {
      const source = this.map.get(edge.sourceId);
      if (!source) continue;
      const value = this.getSourceValue(source, edge.sourcePort, new Set());
      if (Array.isArray(value)) values.push(...value);
      else if (value != null && !isNaN(value)) values.push(value);
    }
    return values;
  }

  getPairedForSqrt(nodeId) {
    const incoming = this.getIncomingEdges(nodeId);
    if (incoming.length === 0) return { ok: false, res: [] };
    if (incoming.length > 2) return { ok: false, res: [] };
    
    const arrays = [];
    for (const edge of incoming) {
      const source = this.map.get(edge.sourceId);
      if (!source) {
        arrays.push([]);
        continue;
      }
      const value = this.getSourceValue(source, edge.sourcePort, new Set());
      const arr = Array.isArray(value) ? value : (value != null && !isNaN(value) ? [value] : []);
      arrays.push(arr);
    }
    
    if (incoming.length === 1) {
      const arr = arrays[0];
      if (arr.length === 2) {
        const result = Math.hypot(arr[0], arr[1]);
        return { ok: true, res: [result] };
      }
      return { ok: false, res: [] };
    }
    
    const arr1 = arrays[0], arr2 = arrays[1];
    const len1 = arr1.length, len2 = arr2.length;
    const result = [];
    
    if (len1 === 1 && len2 > 1) {
      const scalar = arr1[0];
      for (let i = 0; i < len2; i++) result.push(Math.hypot(scalar, arr2[i]));
    } else if (len2 === 1 && len1 > 1) {
      const scalar = arr2[0];
      for (let i = 0; i < len1; i++) result.push(Math.hypot(arr1[i], scalar));
    } else {
      const maxLen = Math.max(len1, len2);
      const padded1 = [...arr1], padded2 = [...arr2];
      while (padded1.length < maxLen) padded1.push(0);
      while (padded2.length < maxLen) padded2.push(0);
      for (let i = 0; i < maxLen; i++) result.push(Math.hypot(padded1[i], padded2[i]));
    }
    
    return { ok: true, res: result };
  }

  reevaluateCalc(calcNode) {
    if (calcNode.calcType === 'sqrt_sum_sq') {
      const paired = this.getPairedForSqrt(calcNode.id);
      if (paired.ok && paired.res.length > 0) {
        calcNode.result = paired.res;
        calcNode.resultStr = `[${paired.res.map(v => v.toFixed(6)).join(', ')}]`;
      } else {
        calcNode.result = null;
        calcNode.resultStr = "--";
      }
      return;
    }
    
    const input = this.getMergedInput(calcNode.id);
    if (!input.length) {
      calcNode.result = null;
      calcNode.resultStr = "--";
      return;
    }
    
    if (calcNode.calcType === 'div3') {
      const result = input.map(v => typeof v === 'number' ? v / 3 : null).filter(v => v !== null);
      calcNode.result = result.length ? result : null;
      calcNode.resultStr = result.length ? `[${result.map(v => v.toFixed(6)).join(', ')}]` : "--";
    } else if (calcNode.calcType === 'div_sqrt12') {
      const result = input.map(v => typeof v === 'number' ? v / Math.sqrt(12) : null).filter(v => v !== null);
      calcNode.result = result.length ? result : null;
      calcNode.resultStr = result.length ? `[${result.map(v => v.toFixed(6)).join(', ')}]` : "--";
    }
  }

  reevaluateAll() {
    this.nodes.forEach(node => {
      if (node instanceof CalcNode) this.reevaluateCalc(node);
      if (node instanceof MapNode) node.graph = this;
      if (node instanceof OutputNode) node.graph = this;
    });
  }

  updateOutput(outputNode) {
    const input = this.getMergedInput(outputNode.id);
    if (!input.length) {
      outputNode.rows = [{ param: "Нет связей", value: "—" }];
      outputNode.title = "Вывод (пусто)";
      return;
    }
    const rows = input.map((val, i) => ({
      param: `значение ${i + 1}`,
      value: typeof val === 'number' && !isNaN(val) ? val.toFixed(6) : "—"
    }));
    outputNode.rows = rows;
    outputNode.title = `Вывод (${rows.length} знач.)`;
  }

  updateAllOutputs() {
    this.nodes.forEach(node => {
      if (node instanceof OutputNode) this.updateOutput(node);
    });
  }

  toSerial() {
    return {
      nodes: this.nodes.map(n => n.toJSON()),
      edges: this.edges.map(e => e.toJSON()),
      nextId: this.nextId,
      nextEdgeId: this.nextEdgeId,
      designQuality: window._designQualitySaved || 100
    };
  }

  loadFrom(data) {
    this.nodes = [];
    this.edges = [];
    this.map.clear();
    this.nextId = data.nextId;
    this.nextEdgeId = data.nextEdgeId;
    
    for (const nodeData of data.nodes) {
      let node;
      if (nodeData.type === 'number') {
        node = new NumberNode(nodeData.id, nodeData.x, nodeData.y, nodeData.title, nodeData.val);
      } else if (nodeData.type === 'constant') {
        node = new ConstantNode(nodeData.id, nodeData.x, nodeData.y, nodeData.title, nodeData.val);
      } else if (nodeData.type === 'group') {
        node = new GroupNode(nodeData.id, nodeData.x, nodeData.y, nodeData.title, nodeData.vals);
      } else if (nodeData.type === 'map') {
        node = new MapNode(nodeData.id, nodeData.x, nodeData.y, nodeData.title, nodeData.maps);
        if (nodeData.xCol) node.xCol = nodeData.xCol;
        if (nodeData.yCol) node.yCol = nodeData.yCol;
        if (nodeData.unmappedMode) node.unmappedMode = nodeData.unmappedMode;
      } else if (nodeData.type === 'calc') {
        node = new CalcNode(nodeData.id, nodeData.x, nodeData.y, nodeData.title, nodeData.calcType);
        node.result = nodeData.result;
        node.resultStr = nodeData.resultStr;
      } else if (nodeData.type === 'output') {
        node = new OutputNode(nodeData.id, nodeData.x, nodeData.y, nodeData.title, nodeData.rows);
      } else {
        continue;
      }
      node.important = nodeData.important || false;
      this.nodes.push(node);
      this.map.set(node.id, node);
    }
    
    for (const edgeData of data.edges) {
      this.edges.push(new Edge(edgeData.id, edgeData.sourceId, edgeData.targetId, edgeData.sourcePort || 'main'));
    }
    
    this.reevaluateAll();
    this.updateAllOutputs();
    this.nodes.forEach(node => {
      if (node instanceof MapNode) node.graph = this;
      if (node instanceof OutputNode) node.graph = this;
    });
    
    if (data.designQuality !== undefined) window._designQualitySaved = data.designQuality;
  }
}
