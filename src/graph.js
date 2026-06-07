let _nextId = 1;
export function nextId() { return _nextId++; }
export function resetIds() { _nextId = 1; }

// ─── Node Types ──────────────────────────────────────────────
export const NODE_TYPES = {
  number: {
    type: 'number', label: 'Number', icon: '#',
    color: 0x44aaff, dataType: 'num',
    canInput: false, canOutput: true,
    allowedInputs: [],
    create: (opts) => ({ value: opts?.value ?? 0 }),
    desc: 'A single numeric value'
  },
  constant: {
    type: 'constant', label: 'Constant', icon: 'π',
    color: 0xaa66ff, dataType: 'num',
    canInput: false, canOutput: true,
    allowedInputs: [],
    create: (opts) => ({ value: opts?.value ?? 3.14159, label: opts?.label ?? 'pi' }),
    desc: 'A named constant value'
  },
  group: {
    type: 'group', label: 'Group', icon: '{}',
    color: 0x66cc88, dataType: 'array',
    canInput: false, canOutput: true,
    allowedInputs: [],
    create: (opts) => ({ rows: opts?.rows ?? [{ name: 'a', value: 0 }] }),
    desc: 'Collection of named values'
  },
  calc: {
    type: 'calc', label: 'Calc', icon: '∑',
    color: 0xff8844, dataType: 'uncert',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'uncert'],
    create: (opts) => ({ mode: opts?.mode ?? 'sum' }),
    desc: 'Mathematical operation'
  },
  output: {
    type: 'output', label: 'Output', icon: '📊',
    color: 0xff4488, dataType: 'auto',
    canInput: true, canOutput: false,
    allowedInputs: ['num', 'array', 'uncert', 'list'],
    create: (opts) => ({}),
    desc: 'Display computed values'
  },
  map: {
    type: 'map', label: 'Map', icon: '🔄',
    color: 0x44ddff, dataType: 'list',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'uncert', 'list'],
    create: (opts) => ({ mode: opts?.mode ?? 'linear', params: opts?.params ?? {} }),
    desc: 'Data transformation'
  },
  mean: {
    type: 'mean', label: 'Mean', icon: 'x̄',
    color: 0xffcc44, dataType: 'num',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'list', 'uncert'],
    create: (opts) => ({}),
    desc: 'Arithmetic mean'
  },
  sem: {
    type: 'sem', label: 'SEM', icon: 'σ',
    color: 0x44ffaa, dataType: 'num',
    canInput: true, canOutput: true,
    allowedInputs: ['num', 'array', 'list'],
    create: (opts) => ({}),
    desc: 'Standard error of mean'
  }
};

export function getTypeDisplay(typeKey) {
  const t = NODE_TYPES[typeKey];
  if (t) return t.label;
  return typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
}

export function canTypesConnect(sourceType, targetType) {
  const tgt = NODE_TYPES[targetType];
  if (!tgt) return false;
  if (!tgt.canInput) return false;
  if (tgt.allowedInputs.length === 0) return true;
  return tgt.allowedInputs.includes(sourceType);
}

// ─── Node ────────────────────────────────────────────────────
export class Node {
  constructor(type, opts = {}) {
    this.id = nextId();
    this.type = type;
    this.title = opts.title || NODE_TYPES[type]?.label || type;
    this.data = NODE_TYPES[type]?.create(opts) || {};
    this.important = false;
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
  constructor(sourceId, targetId, sourcePort = 'main') {
    this.id = nextId();
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.sourcePort = sourcePort;
  }

  toJSON() {
    return { id: this.id, sourceId: this.sourceId, targetId: this.targetId, sourcePort: this.sourcePort };
  }
}

// ─── History (Undo/Redo) ────────────────────────────────────
export class History {
  constructor(graph) {
    this.graph = graph;
    this.stack = [];
    this.index = -1;
    this.maxSize = 50;
  }

  save() {
    const state = JSON.stringify(this.graph.toJSON());
    // Remove redo states
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(state);
    if (this.stack.length > this.maxSize) this.stack.shift();
    this.index = this.stack.length - 1;
  }

  undo() {
    if (this.index <= 0) return false;
    this.index--;
    this._restore();
    return true;
  }

  redo() {
    if (this.index >= this.stack.length - 1) return false;
    this.index++;
    this._restore();
    return true;
  }

  _restore() {
    if (this.index >= 0 && this.index < this.stack.length) {
      this.graph.loadJSON(JSON.parse(this.stack[this.index]));
    }
  }

  canUndo() { return this.index > 0; }
  canRedo() { return this.index < this.stack.length - 1; }
}

// ─── Graph ───────────────────────────────────────────────────
export class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this._nodeMap = new Map();
    this._edgeMap = new Map();
    this.isDirty = false;
    this._dirtyCbs = [];
    this.onChange = null;
  }

  onDirtyChange(cb) {
    this._dirtyCbs.push(cb);
    return () => { this._dirtyCbs = this._dirtyCbs.filter(c => c !== cb); };
  }

  _setDirty(v = true) {
    if (this.isDirty !== v) {
      this.isDirty = v;
      this._dirtyCbs.forEach(cb => cb(v));
    }
  }

  addNode(type, opts = {}) {
    const node = new Node(type, opts);
    this.nodes.push(node);
    this._nodeMap.set(node.id, node);
    this._setDirty(true);
    if (this.onChange) this.onChange();
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
    this._setDirty(true);
    if (this.onChange) this.onChange();
  }

  getNode(id) { return this._nodeMap.get(id); }

  canConnect(sourceId, targetId) {
    const src = this._nodeMap.get(sourceId);
    const tgt = this._nodeMap.get(targetId);
    if (!src || !tgt) return { ok: false, msg: 'Node not found' };
    if (src.id === tgt.id) return { ok: false, msg: 'Cannot connect to self' };
    if (!tgt.meta?.canInput) return { ok: false, msg: 'Target cannot accept connections' };
    if (!src.meta?.canOutput) return { ok: false, msg: 'Source has no output' };
    if (tgt.meta.allowedInputs.length > 0 && !tgt.meta.allowedInputs.includes(src.meta.dataType)) {
      return { ok: false, msg: `Cannot connect ${src.meta.label} → ${tgt.meta.label}` };
    }
    if (this.edges.some(e => e.sourceId === sourceId && e.targetId === targetId)) {
      return { ok: false, msg: 'Already connected' };
    }
    if (this._wouldCycle(sourceId, targetId)) {
      return { ok: false, msg: 'Would create a cycle' };
    }
    return { ok: true };
  }

  addEdge(sourceId, targetId, sourcePort = 'main') {
    const check = this.canConnect(sourceId, targetId);
    if (!check.ok) return null;
    const edge = new Edge(sourceId, targetId, sourcePort);
    this.edges.push(edge);
    this._edgeMap.set(edge.id, edge);
    this._setDirty(true);
    if (this.onChange) this.onChange();
    return edge;
  }

  removeEdge(id) {
    this.edges = this.edges.filter(e => e.id !== id);
    this._edgeMap.delete(id);
    this._setDirty(true);
    if (this.onChange) this.onChange();
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

  getNodeValue(node) {
    return this._getNodeValue(node);
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
      case 'map': return this.getMergedInput(node.id);
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

  reconcileIds() {
    // Fix gaps in node/edge IDs
    let maxId = 0;
    for (const n of this.nodes) maxId = Math.max(maxId, n.id);
    for (const e of this.edges) maxId = Math.max(maxId, e.id);
    _nextId = maxId + 1;
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
    this._setDirty(false);
    if (this.onChange) this.onChange();
  }

  clear() {
    this.nodes = [];
    this.edges = [];
    this._nodeMap.clear();
    this._edgeMap.clear();
    _nextId = 1;
    this._setDirty(true);
    if (this.onChange) this.onChange();
  }

  exportJSON() {
    return this.toJSON();
  }

  exportToFile() {
    const json = JSON.stringify(this.exportJSON(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amenodes-${Date.now()}.amnk`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.loadJSON(data);
          resolve(true);
        } catch (_) { resolve(false); }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }

  saveToStorage() {
    try {
      localStorage.setItem('amenodes_graph', JSON.stringify(this.toJSON()));
      this._setDirty(false);
    } catch (e) { console.warn('Save failed:', e); }
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem('amenodes_graph');
      if (raw) { this.loadJSON(JSON.parse(raw)); return true; }
    } catch (e) { console.warn('Load failed:', e); }
    return false;
  }
}
