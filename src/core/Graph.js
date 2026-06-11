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
    this.isDirty = false;
    this.dirtyCallbacks = [];
  }

  onDirtyChange(callback) {
    this.dirtyCallbacks.push(callback);
    return () => {
      const index = this.dirtyCallbacks.indexOf(callback);
      if (index !== -1) this.dirtyCallbacks.splice(index, 1);
    };
  }

  setDirty(dirty = true) {
    if (this.isDirty !== dirty) {
      this.isDirty = dirty;
      for (const callback of this.dirtyCallbacks) {
        callback(this.isDirty);
      }
    }
  }

  clearDirty() {
    this.setDirty(false);
  }

  addNode(node) {
    if (!node.id) node.id = this.nextId++;
    this.nodes.push(node);
    this.map.set(node.id, node);
    if (typeof node.onAttach === 'function') node.onAttach(this);
    this.setDirty(true);
    return node;
  }

  removeNode(id) {
    const node = this.map.get(id);
    if (node && typeof node.onDetach === 'function') node.onDetach();
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.map.delete(id);
    this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
    this.setDirty(true);
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
    this.setDirty(true);
    return edge;
  }

  removeEdge(id) {
    this.edges = this.edges.filter(e => e.id !== id);
    this.setDirty(true);
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

  getTypeDisplayName(typeKey) {
    if (!typeKey) return 'Unknown';
    const translated = t(`dataTypes.${typeKey}`);
    if (translated !== `dataTypes.${typeKey}`) {
      return translated;
    }
    return typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
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
        const NodeClass = NodeFactory.getNodeClass(nodeData.type);
        if (NodeClass) {
          const node = new NodeClass(
            nodeData.id,
            nodeData.x,
            nodeData.y,
            nodeData.title,
            nodeData
          );
          if (node) {
            node.important = nodeData.important || false;
            this.nodes.push(node);
            this.map.set(node.id, node);
          }
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
    
    this.clearDirty();
  }
  
  exportGraph() {
    return {
      nodes: this.nodes.map(node => node.toJSON()),
      edges: this.edges.map(edge => ({ 
        id: edge.id, 
        source: edge.sourceId, 
        target: edge.targetId 
      })),
      nextId: this.nextId,
      nextEdgeId: this.nextEdgeId
    };
  }

  loadGraph(data) {
    this.nodes = [];
    this.edges = [];
    this.map.clear();
    this.nextId = data.nextId || 1;
    this.nextEdgeId = data.nextEdgeId || 1;

    for (const nodeData of data.nodes) {
      try {
        const NodeClass = NodeFactory.getNodeClass(nodeData.type);
        if (NodeClass) {
          const node = new NodeClass(
            nodeData.id,
            nodeData.x,
            nodeData.y,
            nodeData.title,
            nodeData
          );
          if (node) {
            node.important = nodeData.important || false;
            this.nodes.push(node);
            this.map.set(node.id, node);
          }
        }
      } catch (err) {
        console.warn(`Failed to restore node type ${nodeData.type}:`, err);
      }
    }

    for (const edgeData of data.edges) {
      const edge = new Edge(edgeData.id, edgeData.source, edgeData.target, 'main');
      this.edges.push(edge);
      if (edgeData.id >= this.nextEdgeId) this.nextEdgeId = edgeData.id + 1;
    }

    for (const node of this.nodes) {
      if (typeof node.onAttach === 'function') node.onAttach(this);
    }

    this.reevaluateAll();
    this.updateAllOutputs();
    
    this.clearDirty();
  }
}
