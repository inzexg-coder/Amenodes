// ─── 3D Scene ────────────────────────────────────────────────
const SPHERE_RADIUS = 5;
const STAR_COUNT = 3000;

export class Scene3D {
  constructor(container, graph) {
    this.container = container;
    this.graph = graph;
    this.nodeMeshes = new Map();   // nodeId -> {mesh, label, ring}
    this.edgeLines = new Map();    // edgeId -> line3D
    this.selectedNode = null;
    this.onNodeSelect = null;
    this.onNodeContext = null;
    this.autoRotate = true;
    this.THREE = null;

    this._theta = 0;
    this._phi = Math.PI / 2;
    this._dist = 12;
    this._targetTheta = 0;
    this._targetPhi = Math.PI / 2;
    this._targetDist = 12;
    this._momentum = { x: 0, y: 0 };
    this._isDragging = false;
    this._prevTouch = { x: 0, y: 0 };
    this._touchStart = { x: 0, y: 0, t: 0 };
    this._pinchDist = 0;
    this._animId = null;

    this._onResize = () => this._resize();
  }

  async init() {
    await this._loadThree();
    const T = this.THREE;

    this.scene = new T.Scene();
    this.scene.background = new T.Color(0x05050f);

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera = new T.PerspectiveCamera(50, w / h, 0.1, 200);
    this._updateCam();

    this.renderer = new T.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x05050f);
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const amb = new T.AmbientLight(0x334466, 0.8);
    this.scene.add(amb);
    const dir = new T.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    this._makeStars();
    window.addEventListener('resize', this._onResize);
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
        // fallback
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
    const T = this.THREE;
    const geo = new T.BufferGeometry();
    const count = STAR_COUNT;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);
      const b = 0.3 + Math.random() * 0.7;
      colors[i*3] = b * (0.8 + Math.random() * 0.2);
      colors[i*3+1] = b * (0.8 + Math.random() * 0.2);
      colors[i*3+2] = b;
      sizes[i] = 0.05 + Math.random() * 0.2;
    }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(colors, 3));
    geo.setAttribute('size', new T.BufferAttribute(sizes, 1));
    const mat = new T.PointsMaterial({
      size: 0.12, vertexColors: true, transparent: true, opacity: 0.9,
      blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    this.scene.add(new T.Points(geo, mat));
  }

  // ─── Node Placement ───────────────────────────────────────
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

  // ─── Build / Rebuild ──────────────────────────────────────
  rebuild() {
    this._rebuildNodes();
    this._rebuildEdges();
  }

  _rebuildNodes() {
    const T = this.THREE;
    // Clear old
    for (const [id, obj] of this.nodeMeshes) {
      this.scene.remove(obj.mesh);
      this.scene.remove(obj.ring);
    }
    this.nodeMeshes.clear();

    this.graph.nodes.forEach((node, idx) => {
      const pos = this._getNodePos(node, idx);
      const color = node.meta?.color || 0x4488ff;

      // Main sprite
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      this._drawNodeSprite(ctx, node, color);
      const tex = new T.CanvasTexture(canvas);
      const mat = new T.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        opacity: 0.95
      });
      const sprite = new T.Sprite(mat);
      sprite.position.set(pos.x, pos.y, pos.z);
      sprite.scale.set(1.2, 1.2, 1);
      sprite.userData.nodeId = node.id;

      // Selection ring
      const ringGeo = new T.RingGeometry(0.7, 0.85, 32);
      const ringMat = new T.MeshBasicMaterial({
        color: 0x88bbff,
        side: T.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: T.AdditiveBlending
      });
      const ring = new T.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, pos.y, pos.z);
      ring.lookAt(0, 0, 0); // face outward

      this.scene.add(sprite);
      this.scene.add(ring);
      this.nodeMeshes.set(node.id, { mesh: sprite, ring, canvas, ctx, color });
    });
  }

  _drawNodeSprite(ctx, node, color) {
    const w = 128, h = 128;
    const cx = w / 2, cy = h / 2;
    const r = 50;

    // Glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 8);
    const c = '#' + color.toString(16).padStart(6, '0');
    grad.addColorStop(0, c + '80');
    grad.addColorStop(0.5, c + '40');
    grad.addColorStop(1, c + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e1a';
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#d0e0ff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.meta?.icon || '?', cx, cy - 8);

    // Label
    ctx.fillStyle = '#b0c8ff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(node.title.substring(0, 8), cx, cy + 40);
  }

  _rebuildEdges() {
    const T = this.THREE;
    for (const [id, obj] of this.edgeLines) {
      this.scene.remove(obj.line);
      if (obj.glow) this.scene.remove(obj.glow);
    }
    this.edgeLines.clear();

    this.graph.edges.forEach(edge => {
      const src = this._getMeshPos(edge.sourceId);
      const tgt = this._getMeshPos(edge.targetId);
      if (!src || !tgt) return;

      const mid = {
        x: (src.x + tgt.x) / 2,
        y: (src.y + tgt.y) / 2,
        z: (src.z + tgt.z) / 2
      };
      const ml = Math.sqrt(mid.x*mid.x + mid.y*mid.y + mid.z*mid.z);
      const pull = 1.4;
      const cpx = ml > 0 ? mid.x / ml * SPHERE_RADIUS * pull : 0;
      const cpy = ml > 0 ? mid.y / ml * SPHERE_RADIUS * pull : 0;
      const cpz = ml > 0 ? mid.z / ml * SPHERE_RADIUS * pull : 0;

      const curve = new T.QuadraticBezierCurve3(
        new T.Vector3(src.x, src.y, src.z),
        new T.Vector3(cpx, cpy, cpz),
        new T.Vector3(tgt.x, tgt.y, tgt.z)
      );
      const points = curve.getPoints(24);
      const geo = new T.BufferGeometry().setFromPoints(points);

      const srcNode = this.graph.getNode(edge.sourceId);
      const edgeColor = srcNode?.important ? 0xff8844 : 0x4488ff;

      const mat = new T.LineBasicMaterial({
        color: edgeColor, transparent: true, opacity: 0.5
      });
      const line = new T.Line(geo, mat);

      const glowMat = new T.LineBasicMaterial({
        color: edgeColor, transparent: true, opacity: 0.15,
        blending: T.AdditiveBlending
      });
      const glow = new T.Line(geo.clone(), glowMat);

      this.scene.add(line);
      this.scene.add(glow);
      this.edgeLines.set(edge.id, { line, glow });
    });
  }

  _getMeshPos(nodeId) {
    const obj = this.nodeMeshes.get(nodeId);
    return obj ? obj.mesh.position : null;
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
    if (this._animId) cancelAnimationFrame(this._animId);
    const loop = () => {
      const time = Date.now() * 0.001;

      // Auto-rotate
      if (this.autoRotate && !this._isDragging) {
        this._targetTheta += 0.003;
        this._phi += (Math.PI / 2 + Math.sin(time * 0.4) * 0.1 - this._phi) * 0.002;
      }

      // Momentum
      if (this._isDragging) {
        this._momentum.x *= 0.95;
        this._momentum.y *= 0.95;
      } else {
        this._targetTheta += this._momentum.x;
        this._targetPhi += this._momentum.y;
        this._momentum.x *= 0.98;
        this._momentum.y *= 0.98;
      }

      // Smooth camera
      this._theta += (this._targetTheta - this._theta) * 0.08;
      this._phi = Math.max(0.1, Math.min(Math.PI - 0.1,
        this._phi + (this._targetPhi - this._phi) * 0.08));
      this._dist += (this._targetDist - this._dist) * 0.08;
      this._updateCam();

      // Pulse rings
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.6);
      for (const [id, obj] of this.nodeMeshes) {
        if (id === this.selectedNode) {
          obj.ring.material.opacity = 0.4 + pulse * 0.3;
          obj.ring.scale.setScalar(1 + pulse * 0.05);
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

  // ─── Interaction ───────────────────────────────────────────
  getIntersection(clientX, clientY) {
    const T = this.THREE;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new T.Raycaster();
    raycaster.setFromCamera(new T.Vector2(x, y), this.camera);

    const sprites = [];
    for (const [id, obj] of this.nodeMeshes) {
      sprites.push(obj.mesh);
    }
    const hits = raycaster.intersectObjects(sprites);
    if (hits.length > 0) {
      const hit = hits[0].object;
      return hit.userData.nodeId;
    }
    return null;
  }

  selectNode(nodeId) {
    // Deselect old
    if (this.selectedNode) {
      const old = this.nodeMeshes.get(this.selectedNode);
      if (old) old.ring.material.opacity = 0;
    }
    this.selectedNode = nodeId;
    if (nodeId) {
      const obj = this.nodeMeshes.get(nodeId);
      if (obj) obj.ring.material.opacity = 0.6;
      if (this.onNodeSelect) this.onNodeSelect(this.graph.getNode(nodeId));
    } else {
      if (this.onNodeSelect) this.onNodeSelect(null);
    }
  }

  // ─── Resize ────────────────────────────────────────────────
  _resize() {
    if (!this.renderer) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ─── Disposal ─────────────────────────────────────────────
  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
