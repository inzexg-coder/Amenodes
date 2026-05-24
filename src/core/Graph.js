import { Edge } from './Edge.js';
import { typeSystem } from './DataType.js';
import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from '../ui/CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.nextId = 1;
    this.nextEdgeId = 1;
    this.map = new Map();
  }

  addNode(node) {
    if (!node.id) node.id = this.nextId++;
    this.nodes.push(node);
    this.map.set(node.id, node);
    if (typeof node.onAttach === 'function') node.onAttach(this);
    return node;
  }

  removeNode(id) {
    const node = this.map.get(id);
    if (node && typeof node.onDetach === 'function') node.onDetach();
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.map.delete(id);
    this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
  }

  addEdge(sourceId, targetId, port = 'main') {
    const source = this.map.get(sourceId);
    const target = this.map.get(targetId);
    if (!source || !target) return null;

    if (typeof target.canAcceptEdge === 'function') {
      const canAccept = target.canAcceptEdge(source, port);
      if (!canAccept.ok) {
        modal.alert(canAccept.message || t('errors.cannotConnect'));
        return null;
      }
    }

    if (!this.canConnect(sourceId, targetId, port)) {
      const sourceType = typeSystem.getNodeType(source);
      const targetType = typeSystem.getNodeType(target);
      
      const sourceTypeName = this.getTypeDisplayName(sourceType);
      const targetTypeName = this.getTypeDisplayName(targetType);
      
      modal.alert(`${t('errors.cannotConnect')}: ${sourceTypeName} → ${targetTypeName}`);
      return null;
    }

    if (this.hasCycle(sourceId, targetId)) {
      modal.alert(t('errors.cyclicDependency'));
      return null;
    }

    if (this.edges.some(e => e.sourceId === sourceId && e.targetId === targetId && e.sourcePort === port)) return null;

    const edge = new Edge(this.nextEdgeId++, sourceId, targetId, port);
    this.edges.push(edge);
    return edge;
  }

  getTypeDisplayName(typeKey) {
    if (!typeKey) return 'Unknown';
    const translated = t(`dataTypes.${typeKey}`);
    if (translated !== `dataTypes.${typeKey}`) {
      return translated;
    }
    return typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
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
  
  getSourceValue(source, port = 'main', visited = new Set()) {
    if (visited.has(source.id)) return [];
    visited.add(source.id);

    if (typeof source.getOutputValue === 'function') {
      return source.getOutputValue(port, visited, this);
    }

    const val = source.getValue();
    if (val == null) return [];
    return Array.isArray(val) ? val : [val];
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
    const pairs = [];
    
    for (let i = 0; i < incoming.length; i += 2) {
      if (i + 1 < incoming.length) {
        const edge1 = incoming[i];
        const edge2 = incoming[i + 1];
        const source1 = this.map.get(edge1.sourceId);
        const source2 = this.map.get(edge2.sourceId);
        
        if (source1 && source2) {
          const val1 = this.getSourceValue(source1, edge1.sourcePort, new Set());
          const val2 = this.getSourceValue(source2, edge2.sourcePort, new Set());
          
          const num1 = Array.isArray(val1) && val1.length ? val1[0] : val1;
          const num2 = Array.isArray(val2) && val2.length ? val2[0] : val2;
          
          if (typeof num1 === 'number' && typeof num2 === 'number' && !isNaN(num1) && !isNaN(num2)) {
            pairs.push(Math.sqrt(num1 * num1 + num2 * num2));
          } else {
            pairs.push(null);
          }
        } else {
          pairs.push(null);
        }
      }
    }
    
    const valid = pairs.filter(v => v !== null);
    return { ok: valid.length > 0, res: valid };
  }

  reevaluateAll() {
    for (const node of this.nodes) {
      if (typeof node.reevaluate === 'function') {
        node.reevaluate(this);
      }
    }
  }

  updateAllOutputs() {
    for (const node of this.nodes) {
      if (typeof node.updateDisplay === 'function') {
        node.updateDisplay(this);
      }
    }
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
    this.nextId = data.nextId || 1;
    this.nextEdgeId = data.nextEdgeId || 1;

    for (const nodeData of data.nodes) {
      try {
        const node = NodeFactory.createNode(nodeData.type, {
          id: nodeData.id,
          x: nodeData.x,
          y: nodeData.y,
          title: nodeData.title,
          ...nodeData
        });
        if (node) {
          node.important = nodeData.important || false;
          this.nodes.push(node);
          this.map.set(node.id, node);
        }
      } catch (err) {
        console.warn(`Failed to restore node type ${nodeData.type}:`, err);
      }
    }

    for (const edgeData of data.edges) {
      this.edges.push(new Edge(edgeData.id, edgeData.sourceId, edgeData.targetId, edgeData.sourcePort || 'main'));
    }

    for (const node of this.nodes) {
      if (typeof node.onAttach === 'function') node.onAttach(this);
    }

    this.reevaluateAll();
    this.updateAllOutputs();

    if (data.designQuality !== undefined) window._designQualitySaved = data.designQuality;
  }
}
