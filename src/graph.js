// Simple ID generator
let _nextId = 1;
function nextId() { return _nextId++; }
function resetIds() { _nextId = 1; }

// ─── Node Types ──────────────────────────────────────────────
export const NODE_TYPES = {
  number: {
    type: 'number', label: 'Number', icon: '#',
    color: 0x44aaff, dataType: 'num',
    canInput: false, canOutput: true,
    allowedInputs: [],
    create: (opts) => ({ value: opts?.value ?? 0 })
  },
  constant: {
    type: 'constant', label: 'Constant', icon: 'π',
    color: 0xaa66ff, dataType: 'num',
    canInput: false, canOutput: true,
    allowedInputs: [],
    create: (opts) => ({ value: opts?.value ?? 3.14159, label: opts?.label ?? 'pi' })
  },
  group: {
    type: 'group', label: 'Group', icon: '{}',
    color: 0x66cc88, dataType: 'array',
    canInput: false, canOutput: true,
    allowedInputs: [],
    create: (opts) => ({ rows: opts?.rows ?? [{ name: 'a', value: 0 }] })
  },
  calc: {
    type: 'calc', label: 'Calc', icon: '∑',
    color: 0xff8844, dataType: 'uncert',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'uncert'],
    create: (opts) => ({ mode: opts?.mode ?? 'sum' })
  },
  output: {
    type: 'output', label: 'Output', icon: '📊',
    color: 0xff4488, dataType: 'auto',
    canInput: true, canOutput: false,
    allowedInputs: ['num', 'array', 'uncert', 'list'],
    create: (opts) => ({})
  },
  map: {
    type: 'map', label: 'Map', icon: '🔄',
    color: 0x44ddff, dataType: 'list',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'uncert', 'list'],
    create: (opts) => ({ mode: opts?.mode ?? 'linear', params: opts?.params ?? {} })
  },
  mean: {
    type: 'mean', label: 'Mean', icon: 'x̄',
    color: 0xffcc44, dataType: 'num',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'list', 'uncert'],
    create: (opts) => ({})
  },
  sem: {
    type: 'sem', label: 'SEM', icon: 'σ',
    color: 0x44ffaa, dataType: 'num',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'list'],
    create: (opts) => ({})
  }
};

// ─── Node ────────────────────────────────────────────────────
export class Node {
  constructor(type, opts = {}) {
    this.id = nextId();
    this.type = type;
    this.title = opts.title || NODE_TYPES[type]?.label || type;
    this.data = NODE_TYPES[type]?.create(opts) || {};
    this.important = false;
    // Sphere position (phi, theta on sphere, radius from center)
    this.phi = opts.phi ?? 0;
    this.theta = opts.theta ?? 0;
  }

  get meta() { return NODE_TYPES[this.type]; }

  toJSON() {
    return { id: this.id, type: this.type, title: this.title, data: this.data, important: this.important };
  }

  static fromJSON(j) {
    const n = new Node(j.type, { title: j.title, ...j.data });
    n.id = j.id;
    n.important = j.important;
    return n;
  }
}

// ─── Edge ────────────────────────────────────────────────────
export class Edge {
  constructor(sourceId, targetId, port = 'main') {
    this.id = nextId();
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.sourcePort = port;
  }

  toJSON() {
    return { id: this.id, sourceId: this.sourceId, targetId: this.targetId, sourcePort: this.sourcePort };
  }
}

// ─── Graph ───────────────────────────────────────────────────
export class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this._nodeMap = new Map();
    this._edgeMap = new Map();
    this.onChange = null;
  }

  addNode(type, opts = {}) {
    const node = new Node(type, opts);
    this.nodes.push(node);
    this._nodeMap.set(node.id, node);
    this._changed();
    return node;
  }

  removeNode(id) {
    const node = this._nodeMap.get(id);
    if (!node) return;
    this.nodes = this.nodes.filter(n => n.id !== id);
    this._nodeMap.delete(id);
    this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
    this.edges.forEach(e => this._edgeMap.delete(e.id));
    this._rebuildEdgeMap();
    this._changed();
  }

  getNode(id) { return this._nodeMap.get(id); }

  canConnect(sourceId, targetId, port = 'main') {
    const src = this._nodeMap.get(sourceId);
    const tgt = this._nodeMap.get(targetId);
    if (!src || !tgt) return false;
    if (src.id === tgt.id) return false;
    if (!tgt.meta.canInput) return false;
    if (!src.meta.canOutput) return false;
    // Check allowedInputs
    if (tgt.meta.allowedInputs.length > 0) {
      if (!tgt.meta.allowedInputs.includes(src.meta.dataType)) return false;
    }
    // Check for existing edge
    if (this.edges.some(e => e.sourceId === sourceId && e.targetId === targetId)) return false;
    // Check for cycles
    if (this._wouldCycle(sourceId, targetId)) return false;
    return true;
  }

  addEdge(sourceId, targetId, port = 'main') {
    if (!this.canConnect(sourceId, targetId, port)) return null;
    const edge = new Edge(sourceId, targetId, port);
    this.edges.push(edge);
    this._edgeMap.set(edge.id, edge);
    this._changed();
    return edge;
  }

  removeEdge(id) {
    this.edges = this.edges.filter(e => e.id !== id);
    this._edgeMap.delete(id);
    this._changed();
  }

  getIncoming(id) { return this.edges.filter(e => e.targetId === id); }
  getOutgoing(id) { return this.edges.filter(e => e.sourceId === id); }

  getMergedInput(nodeId) {
    const incoming = this.getIncoming(nodeId);
    const values = [];
    for (const edge of incoming) {
      const src = this._nodeMap.get(edge.sourceId);
      if (!src) continue;
      const val = this._getNodeValue(src);
      if (Array.isArray(val)) values.push(...val);
      else if (val != null) values.push(val);
    }
    return values;
  }

  _getNodeValue(node) {
    switch (node.type) {
      case 'number': return [node.data.value ?? 0];
      case 'constant': return [node.data.value ?? 0];
      case 'group': return (node.data.rows || []).map(r => r.value);
      case 'calc': return this._calcValue(node);
      case 'output': return this.getMergedInput(node.id);
      case 'mean': return this._meanValue(node);
      case 'sem': return this._semValue(node);
      case 'map': return this._mapValue(node);
      default: return [];
    }
  }

  _calcValue(node) {
    const inputs = this.getMergedInput(node.id);
    if (!inputs.length) return [];
    const mode = node.data.mode || 'sum';
    const nums = inputs.filter(v => typeof v === 'number');
    if (!nums.length) return [];
    switch (mode) {
      case 'sum': return [nums.reduce((a, b) => a + b, 0)];
      case 'diff': return nums.length > 1 ? [nums[0] - nums.slice(1).reduce((a, b) => a + b, 0)] : [nums[0]];
      case 'prod': return [nums.reduce((a, b) => a * b, 1)];
      case 'quot': return nums.length > 1 ? [nums[0] / (nums.slice(1).reduce((a, b) => a * b, 1) || 1)] : [nums[0]];
      case 'pow': return nums.length > 1 ? [Math.pow(nums[0], nums[1])] : [1];
      default: return nums;
    }
  }

  _meanValue(node) {
    const inputs = this.getMergedInput(node.id).filter(v => typeof v === 'number');
    return inputs.length ? [inputs.reduce((a, b) => a + b, 0) / inputs.length] : [];
  }

  _semValue(node) {
    const inputs = this.getMergedInput(node.id).filter(v => typeof v === 'number');
    if (inputs.length < 2) return [];
    const mean = inputs.reduce((a, b) => a + b, 0) / inputs.length;
    const sqDiff = inputs.reduce((a, b) => a + (b - mean) ** 2, 0);
    const stdDev = Math.sqrt(sqDiff / (inputs.length - 1));
    return [stdDev / Math.sqrt(inputs.length)];
  }

  _mapValue(node) {
    return this.getMergedInput(node.id);
  }

  _wouldCycle(sourceId, targetId) {
    if (sourceId === targetId) return true;
    const visited = new Set();
    const stack = [targetId];
    while (stack.length) {
      const cur = stack.pop();
      if (visited.has(cur)) continue;
      visited.add(cur);
      if (cur === sourceId) return true;
      for (const e of this.edges)
        if (e.sourceId === cur) stack.push(e.targetId);
    }
    return false;
  }

  _rebuildEdgeMap() {
    this._edgeMap.clear();
    this.edges.forEach(e => this._edgeMap.set(e.id, e));
  }

  _changed() {
    if (this.onChange) this.onChange();
  }

  toJSON() {
    return {
      nodes: this.nodes.map(n => n.toJSON()),
      edges: this.edges.map(e => e.toJSON()),
      nextId: _nextId
    };
  }

  loadJSON(data) {
    this.nodes = [];
    this.edges = [];
    this._nodeMap.clear();
    this._edgeMap.clear();
    _nextId = data.nextId || 1;
    for (const nd of data.nodes) {
      const node = Node.fromJSON(nd);
      this.nodes.push(node);
      this._nodeMap.set(node.id, node);
    }
    for (const ed of data.edges) {
      const edge = new Edge(ed.sourceId, ed.targetId, ed.sourcePort);
      edge.id = ed.id;
      this.edges.push(edge);
      this._edgeMap.set(edge.id, edge);
    }
    this._changed();
  }

  save() {
    try { localStorage.setItem('amenodes_graph', JSON.stringify(this.toJSON())); }
    catch(e) { console.warn('Save failed:', e); }
  }

  load() {
    try {
      const raw = localStorage.getItem('amenodes_graph');
      if (raw) { this.loadJSON(JSON.parse(raw)); return true; }
    } catch(e) { console.warn('Load failed:', e); }
    return false;
  }
}
