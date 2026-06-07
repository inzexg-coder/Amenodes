const SPHERE_RADIUS = 5;
const STAR_COUNT = 5000;

let THREE; // set after load

export class Scene3D {
  constructor(container, graph) {
    this.container = container;
    this.graph = graph;
    this.nodeMeshes = new Map();   // nodeId -> {sprite, ring, label, canvas}
    this.edgeLines = new Map();    // edgeId -> {line, glow}
    this.handleMeshes = new Map(); // nodeId -> [handleSprite, ...]
    this.selectedNode = null;
    this.onNodeSelect = null;
    this.autoRotate = true;

    this.isDragging = false;
    this.isDraggingEdge = false;
    this.edgeSourceId = null;
    this.edgePreviewLine = null;
    this.prevPointer = { x: 0, y: 0 };
    this.touchStart = { x: 0, y: 0, t: 0 };
    this.momentum = { x: 0, y: 0 };
    this.moved = false;

    this._theta = 0;
    this._phi = Math.PI / 2;
    this._dist = 12;
    this._targetTheta = 0;
    this._targetPhi = Math.PI / 2;
    this._targetDist = 12;

    this._animId = null;
    this._resizeHandler = () => this._resize();
    this._pointerHandler = (e, type) => this._handlePointer(e, type);
  }

  async init() {
    await this._loadThree();
    THREE = this.THREE;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05050f);

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    this._updateCam();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x05050f);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x334466, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    this._makeStars();
    window.addEventListener('resize', this._resizeHandler);
    this._animate();
  }

  _loadThree() {
    if (window.THREE && window.THREE.Scene) {
      this.THREE = window.THREE;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => { this.THREE = window.THREE; resolve(); };
      s.onerror = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
        s2.onload = () => { this.THREE = window.THREE; resolve(); };
        s2.onerror = reject;
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    });
  }

  _makeStars() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 20 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);
      const b = 0.2 + Math.random() * 0.8;
      colors[i*3] = b * (0.7 + Math.random() * 0.3);
      colors[i*3+1] = b * (0.7 + Math.random() * 0.3);
      colors[i*3+2] = b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.1, vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    this.scene.add(new THREE.Points(geo, mat));
  }

  _getNodePos(node, idx) {
    const n = this.graph.nodes.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const i = idx ?? this.graph.nodes.indexOf(node);
    const y = 1 - (i + 0.5) / Math.max(n, 1);
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    return {
      x: SPHERE_RADIUS * radius * Math.cos(theta),
      y: SPHERE_RADIUS * y,
      z: SPHERE_RADIUS * radius * Math.sin(theta)
    };
  }

  getNodeWorldPos(nodeId) {
    const obj = this.nodeMeshes.get(nodeId);
    return obj ? obj.sprite.position.clone() : null;
  }

  // ─── Build / Rebuild ──────────────────────────────────────
  rebuild() {
    this._rebuildNodes();
    this._rebuildEdges();
  }

  _rebuildNodes() {
    // Clear old
    for (const [id, obj] of this.nodeMeshes) {
      this.scene.remove(obj.sprite);
      this.scene.remove(obj.ring);
    }
    for (const [id, handles] of this.handleMeshes) {
      handles.forEach(h => this.scene.remove(h));
    }
    this.nodeMeshes.clear();
    this.handleMeshes.clear();

    this.graph.nodes.forEach((node, idx) => {
      const pos = this._getNodePos(node, idx);
      const color = node.meta?.color || 0x4488ff;

      // Create sprite with canvas texture
      const sprite = this._makeNodeSprite(node, color, pos);

      // Selection ring
      const ring = this._makeRing(color, pos);

      this.scene.add(sprite);
      this.scene.add(ring);
      this.nodeMeshes.set(node.id, { sprite, ring });
    });
  }

  _makeNodeSprite(node, color, pos) {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');
    this._drawSprite(ctx, node, color);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthTest: true, depthWrite: false, opacity: 0.97
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(pos.x, pos.y, pos.z);
    sprite.scale.set(4.2, 1.2, 1);
    sprite.userData.nodeId = node.id;
    sprite.userData.isNode = true;
    return sprite;
  }

  _drawSprite(ctx, node, color) {
    // Main branch design: header + body layout, no emojis
    const w = 380, h = 110;
    const rad = 16;
    const headerH = 40;
    const margin = 3;
    const c = '#' + color.toString(16).padStart(6, '0');

    // Single neutral glow (no per-type color)
    ctx.save();
    ctx.shadowColor = 'rgba(100, 140, 255, 0.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'transparent';
    this._roundRect(ctx, margin, margin, w - margin * 2, h - margin * 2, rad);
    ctx.fill();
    ctx.restore();

    // Card body background
    ctx.fillStyle = '#232a3f';
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, margin, margin, w - margin * 2, h - margin * 2, rad);
    ctx.fill();
    ctx.stroke();

    // Header background
    const hGrad = ctx.createLinearGradient(0, margin, 0, margin + headerH);
    hGrad.addColorStop(0, '#1b2137');
    hGrad.addColorStop(1, '#1b2137');
    ctx.fillStyle = hGrad;
    this._roundRectTop(ctx, margin, margin, w - margin * 2, headerH, rad);
    ctx.fill();

    // Header separator
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin + rad, margin + headerH);
    ctx.lineTo(w - margin - rad, margin + headerH);
    ctx.stroke();

    // Icon (simple text, no emoji)
    const iconMap = { number: '#', constant: 'π', group: '[]', calc: '∑', output: '→', map: '⇄', mean: 'μ', sem: 'σ' };
    ctx.fillStyle = '#b9c8ff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconMap[node.type] || '?', 16, margin + 20);

    // Title
    ctx.fillStyle = '#dcf0ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(node.title.substring(0, 20), 42, margin + 20);

    // Close X
    ctx.fillStyle = '#b9c8ff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('×', w - 14, margin + 20);

    // Body area
    const bodyY = margin + headerH + 8;
    const bodyH = h - margin - headerH - 8;
    const bodyMid = bodyY + bodyH / 2;

    // Type color bar on left
    ctx.fillStyle = c;
    ctx.fillRect(margin + 4, bodyY + 2, 3, bodyH - 4);

    // Type label
    ctx.fillStyle = '#8899bb';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const typeLabel = (node.meta?.dataType || 'N/A').toUpperCase();
    ctx.fillText(typeLabel, margin + 14, bodyMid);

    // Value / info
    ctx.fillStyle = '#dcf0ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    let info = '';
    switch (node.type) {
      case 'number': info = String(node.data.value ?? '0'); break;
      case 'constant': info = String(node.data.value ?? '0'); break;
      case 'group': info = '[' + (node.data.rows?.length || 0) + ']'; break;
      case 'calc': info = node.data.mode || 'sum'; break;
      case 'output': info = '→ result'; break;
      case 'map': info = node.data.mode || 'linear'; break;
      case 'mean': info = 'μ = ...'; break;
      case 'sem': info = 'σ/√n'; break;
    }
    ctx.fillText(info, w - margin - 16, bodyMid);

    // Handle dots (left=output, right=input if canInput)
    const hr = 6;
    ctx.beginPath();
    ctx.arc(margin, bodyMid, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#ffbb77';
    ctx.strokeStyle = '#1e1f2c';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();

    if (node.meta?.canInput) {
      ctx.beginPath();
      ctx.arc(w - margin, bodyMid, hr, 0, Math.PI * 2);
      ctx.fillStyle = '#2288ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
    }

    // Important star
    if (node.important) {
      ctx.fillStyle = '#00aaff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('★', margin + 22, h - margin - 4);
    }
  }

  _roundRectTop(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _roundRect(ctx, x, y, w, h, r) {
  }

  _makeRing(color, pos) {
    const geo = new THREE.RingGeometry(0.85, 1.05, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x88bbff, side: THREE.DoubleSide,
      transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(pos.x, pos.y, pos.z);
    return ring;
  }

  _rebuildEdges() {
    for (const [id, obj] of this.edgeLines) {
      this.scene.remove(obj.line);
      if (obj.glow) this.scene.remove(obj.glow);
    }
    this.edgeLines.clear();

    this.graph.edges.forEach(edge => {
      const srcPos = this.getNodeWorldPos(edge.sourceId);
      const tgtPos = this.getNodeWorldPos(edge.targetId);
      if (!srcPos || !tgtPos) return;

      const mid = new THREE.Vector3(
        (srcPos.x + tgtPos.x) / 2,
        (srcPos.y + tgtPos.y) / 2,
        (srcPos.z + tgtPos.z) / 2
      );
      const ml = mid.length();
      const pull = 1.4;
      const cp = ml > 0 ? mid.clone().multiplyScalar(SPHERE_RADIUS * pull / ml) : new THREE.Vector3(0, 0, SPHERE_RADIUS * pull);

      const curve = new THREE.QuadraticBezierCurve3(srcPos, cp, tgtPos);
      const points = curve.getPoints(20);
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const srcNode = this.graph.getNode(edge.sourceId);
      const ec = srcNode?.important ? 0xff8844 : 0x4488ff;

      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: ec, transparent: true, opacity: 0.5 }));
      const glow = new THREE.Line(geo.clone(), new THREE.LineBasicMaterial({ color: ec, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }));
      this.scene.add(line);
      this.scene.add(glow);
      this.edgeLines.set(edge.id, { line, glow });
    });
  }

  // ─── Edge dragging preview ────────────────────────────────
  startEdgeDrag(sourceId) {
    this.isDraggingEdge = true;
    this.edgeSourceId = sourceId;
    // Create preview line
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.edgePreviewLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x88bbff, transparent: true, opacity: 0.6 }));
    this.scene.add(this.edgePreviewLine);
  }

  updateEdgeDrag(clientX, clientY) {
    if (!this.edgePreviewLine) return;
    const srcPos = this.getNodeWorldPos(this.edgeSourceId);
    if (!srcPos) return;
    // Project pointer to 3D
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const dir = raycaster.ray.direction.clone().normalize();
    const origin = raycaster.ray.origin.clone();
    // Project onto sphere surface
    const oc = origin.clone();
    const a = dir.dot(dir);
    const b = 2 * oc.dot(dir);
    const c = oc.dot(oc) - SPHERE_RADIUS * SPHERE_RADIUS;
    const disc = b * b - 4 * a * c;
    let targetPos;
    if (disc >= 0) {
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      targetPos = origin.clone().add(dir.clone().multiplyScalar(t));
    } else {
      // Fallback: project to distance
      targetPos = origin.clone().add(dir.clone().multiplyScalar(SPHERE_RADIUS * 3));
    }

    const positions = this.edgePreviewLine.geometry.attributes.position.array;
    positions[0] = srcPos.x; positions[1] = srcPos.y; positions[2] = srcPos.z;
    positions[3] = targetPos.x; positions[4] = targetPos.y; positions[5] = targetPos.z;
    this.edgePreviewLine.geometry.attributes.position.needsUpdate = true;
  }

  endEdgeDrag(targetNodeId) {
    // Remove preview line
    if (this.edgePreviewLine) {
      this.scene.remove(this.edgePreviewLine);
      this.edgePreviewLine.geometry.dispose();
      this.edgePreviewLine.material.dispose();
      this.edgePreviewLine = null;
    }
    this.isDraggingEdge = false;
    // Try to create edge
    if (targetNodeId && targetNodeId !== this.edgeSourceId) {
      const edge = this.graph.addEdge(this.edgeSourceId, targetNodeId);
      this.edgeSourceId = null;
      return edge;
    }
    this.edgeSourceId = null;
    return null;
  }

  // ─── Camera ────────────────────────────────────────────────
  _updateCam() {
    const x = this._dist * Math.sin(this._phi) * Math.cos(this._theta);
    const y = this._dist * Math.cos(this._phi);
    const z = this._dist * Math.sin(this._phi) * Math.sin(this._theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  // ─── Animation ─────────────────────────────────────────────
  _animate() {
    const loop = () => {
      const time = Date.now() * 0.001;

      // Auto-rotate
      if (this.autoRotate && !this.isDragging && !this.isDraggingEdge) {
        this._targetTheta += 0.003;
        this._phi += (Math.PI / 2 + Math.sin(time * 0.4) * 0.1 - this._phi) * 0.002;
      }

      // Momentum
      if (!this.isDragging) {
        this._targetTheta += this.momentum.x;
        this._targetPhi += this.momentum.y;
        this.momentum.x *= 0.97;
        this.momentum.y *= 0.97;
      }

      // Smooth camera
      this._theta += (this._targetTheta - this._theta) * 0.08;
      this._phi = Math.max(0.1, Math.min(Math.PI - 0.1,
        this._phi + (this._targetPhi - this._phi) * 0.08));
      this._dist += (this._targetDist - this._dist) * 0.08;
      this._updateCam();

      // Pulse selected ring
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.6);
      for (const [id, obj] of this.nodeMeshes) {
        if (id === this.selectedNode) {
          obj.ring.material.opacity = 0.4 + pulse * 0.3;
          obj.ring.scale.setScalar(1 + pulse * 0.04);
        }
      }

      // Pulse edges
      const ep = 0.5 + 0.5 * Math.sin(time * 0.5);
      for (const [id, obj] of this.edgeLines) {
        obj.line.material.opacity = 0.25 + ep * 0.25;
        if (obj.glow) obj.glow.material.opacity = 0.08 + ep * 0.12;
      }

      this.renderer.render(this.scene, this.camera);
      this._animId = requestAnimationFrame(loop);
    };
    loop();
  }

  // ─── Hit testing ───────────────────────────────────────────
  getIntersection(clientX, clientY, filterSprite = false) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    const targets = [];
    for (const [id, obj] of this.nodeMeshes) {
      targets.push(obj.sprite);
    }
    const hits = raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      return hits[0].object.userData.nodeId;
    }
    return null;
  }

  selectNode(nodeId) {
    if (this.selectedNode) {
      const old = this.nodeMeshes.get(this.selectedNode);
      if (old) old.ring.material.opacity = 0;
    }
    this.selectedNode = nodeId;
    if (nodeId) {
      const obj = this.nodeMeshes.get(nodeId);
      if (obj) obj.ring.material.opacity = 0.6;
      if (this.onNodeSelect) {
        const node = this.graph.getNode(nodeId);
        if (node) this.onNodeSelect(node);
      }
    }
  }

  // ─── Resize ────────────────────────────────────────────────
  _resize() {
    if (!this.renderer || !this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    window.removeEventListener('resize', this._resizeHandler);
    if (this.renderer) { this.renderer.dispose(); this.renderer.domElement.remove(); }
  }
}
