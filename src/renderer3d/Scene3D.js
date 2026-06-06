/**
 * Scene3D - Three.js 3D renderer for Amenodes
 * Replaces DomRenderer with a mobile-first 3D neuron sphere
 */
export class Scene3D {
  constructor(graph, container, eventBus) {
    this.graph = graph;
    this.container = container;
    this.eventBus = eventBus;
    this.nodeObjects = new Map();
    this.edgeLines = new Map();
    this.edgeGlows = new Map();
    this.animFrame = null;
    this.autoRotate = true;
    this.rotationSpeed = 0.005;
    this.sphereRadius = 5;
    this.initialized = false;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = null;
    this.mouse = { x: 0, y: 0 };
    this.starField = null;

    this.selectedNode = null;
    this.nodeMeshes = [];
    this.touchStartTime = 0;
    this.touchStartPos = { x: 0, y: 0 };
    this.isTouchDragging = false;
    this.THREE = null;

    this._boundResize = () => this._onResize();
    this._boundTouchStart = (e) => this._onTouchStart(e);
    this._boundTouchEnd = (e) => this._onTouchEnd(e);
    this._boundClick = (e) => this._onClick(e);
    this._animate = () => this._animateFrame();
  }

  async init() {
    // Ensure Three.js is loaded
    await this._ensureThreeJS();

    this.scene = new this.THREE.Scene();
    this.scene.background = new this.THREE.Color(0x080610);

    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new this.THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 12);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new this.THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080610, 1);
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls (loaded globally)
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new window.THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.1;
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 1.5;
      this.controls.minDistance = 4;
      this.controls.maxDistance = 25;
      this.controls.target.set(0, 0, 0);
    }

    // Simple ambient + hemisphere lighting
    this.scene.add(new this.THREE.AmbientLight(0x404060, 0.6));
    const dirLight = new this.THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
    const backLight = new this.THREE.PointLight(0x6040ff, 0.3, 20);
    backLight.position.set(-3, -1, -5);
    this.scene.add(backLight);

    // Raycaster
    this.raycaster = new this.THREE.Raycaster();
    this.mouse = new this.THREE.Vector2();

    // Star field
    this._createStarField();

    // Events
    window.addEventListener('resize', this._boundResize);
    this.renderer.domElement.addEventListener('touchstart', this._boundTouchStart, { passive: true });
    this.renderer.domElement.addEventListener('touchend', this._boundTouchEnd, { passive: true });
    this.renderer.domElement.addEventListener('click', this._boundClick);

    this.initialized = true;
    this._rebuildFromGraph();
    this._animateFrame();
  }

  async _ensureThreeJS() {
    if (window.THREE && window.THREE.Scene) {
      this.THREE = window.THREE;
      return;
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        // Load OrbitControls
        const ctrlScript = document.createElement('script');
        ctrlScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
        ctrlScript.onload = () => {
          this.THREE = window.THREE;
          resolve();
        };
        document.head.appendChild(ctrlScript);
      };
      document.head.appendChild(script);
    });
  }

  _createStarField() {
    const geo = new this.THREE.BufferGeometry();
    const count = 2500;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      sizes[i] = 0.1 + Math.random() * 0.2;
    }
    geo.setAttribute('position', new this.THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new this.THREE.BufferAttribute(sizes, 1));
    const mat = new this.THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.5,
      blending: this.THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.starField = new this.THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
      this.renderer.setSize(w, h);
    }
  }

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this.touchStartTime = Date.now();
      this.touchStartPos.x = e.touches[0].clientX;
      this.touchStartPos.y = e.touches[0].clientY;
      this.isTouchDragging = false;
    }
  }

  _onTouchEnd(e) {
    const changed = e.changedTouches[0];
    if (!changed) return;
    const dx = changed.clientX - this.touchStartPos.x;
    const dy = changed.clientY - this.touchStartPos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const dt = Date.now() - this.touchStartTime;
    if (dt < 250 && dist < 15) {
      this._handleTap(changed.clientX, changed.clientY);
    }
    if (dist > 5) this.isTouchDragging = true;
  }

  _onClick(e) {
    this._handleTap(e.clientX, e.clientY);
  }

  _handleTap(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const nodeId = hit.userData.nodeId;
      if (nodeId !== undefined) {
        this._selectNode(nodeId);
        return;
      }
    }
    this._deselectNode();
  }

  _selectNode(nodeId) {
    this._deselectNode();
    const node = this.graph.getNode(nodeId);
    if (!node) return;
    this.selectedNode = node;
    const obj = this.nodeObjects.get(nodeId);
    if (obj) {
      const mesh = obj.userData.mesh;
      if (mesh) {
        mesh.scale.set(1.5, 1.5, 1.5);
        mesh.material.emissiveIntensity = 0.8;
      }
      const label = obj.userData.label;
      if (label) label.visible = true;
    }
    if (this.eventBus && this.eventBus.emit) {
      this.eventBus.emit('nodeSelect', node);
    }
  }

  _deselectNode() {
    if (this.selectedNode) {
      const obj = this.nodeObjects.get(this.selectedNode.id);
      if (obj) {
        const mesh = obj.userData.mesh;
        if (mesh) {
          mesh.scale.set(1, 1, 1);
          mesh.material.emissiveIntensity = 0.3;
        }
        const label = obj.userData.label;
        if (label) label.visible = false;
      }
    }
    this.selectedNode = null;
    if (this.eventBus && this.eventBus.emit) {
      this.eventBus.emit('nodeDeselect');
    }
  }

  // Fibonacci sphere for even distribution
  _fibonacciSphere(index, total, radius) {
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (index + 0.5);
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    };
  }

  _getTypeColor(type) {
    const map = {
      number: 0x9060ff, constant: 0x8060ff, calc: 0xe040a0,
      mean: 0xd040b0, sem: 0xc040c0, output: 0x4090ff,
      map: 0x40d090, group: 0x30b080, interval: 0x80a0ff
    };
    return map[type] || 0x8060c0;
  }

  _rebuildFromGraph() {
    // Clean up
    for (const obj of this.nodeObjects.values()) this.scene.remove(obj);
    for (const l of this.edgeLines.values()) this.scene.remove(l);
    for (const g of this.edgeGlows.values()) this.scene.remove(g);
    this.nodeObjects.clear();
    this.edgeLines.clear();
    this.edgeGlows.clear();
    this.nodeMeshes = [];

    const nodes = this.graph.nodes;
    const edges = this.graph.edges;
    const total = Math.max(nodes.length, 1);
    const THREE = this.THREE;

    // Create neurons
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const pos = this._fibonacciSphere(i, total, this.sphereRadius);
      this._createNeuron(node, pos);
    }

    // Create edge connections
    for (const edge of edges) {
      this._createEdge(edge);
    }

    // Update auto-rotate
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  _createNeuron(node, position) {
    const THREE = this.THREE;
    const group = new THREE.Object3D();
    group.position.set(position.x, position.y, position.z);

    const color = this._getTypeColor(node.type);
    const size = 0.25 + (node.important ? 0.08 : 0);
    const c = new THREE.Color(color);

    // Glow halo (sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},0.5)`);
    grad.addColorStop(0.4, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},0.15)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const haloMat = new THREE.SpriteMaterial({
      map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(1.2, 1.2, 1);
    group.add(halo);

    // Core sphere
    const sphereGeo = new THREE.SphereGeometry(size, 12, 12);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: color, emissive: color, emissiveIntensity: 0.3, shininess: 40
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData.nodeId = node.id;
    group.add(sphere);
    this.nodeMeshes.push(sphere);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(size*1.5, size*2.2, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: 0.15,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + (node.id * 0.5);
    group.add(ring);
    const ring2 = ring.clone();
    ring2.rotation.x = Math.PI / 3 + (node.id * 0.3);
    group.add(ring2);

    // Label sprite
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 256;
    lCanvas.height = 64;
    const lctx = lCanvas.getContext('2d');
    lctx.font = 'bold 28px monospace';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.shadowColor = 'rgba(0,0,0,0.9)';
    lctx.shadowBlur = 6;
    lctx.fillStyle = '#e0d0ff';
    lctx.fillText(node.title || node.type, 128, 34);

    const lTex = new THREE.CanvasTexture(lCanvas);
    const lMat = new THREE.SpriteMaterial({
      map: lTex, transparent: true, depthTest: false, depthWrite: false
    });
    const label = new THREE.Sprite(lMat);
    label.position.y = -(size + 0.4);
    label.scale.set(1.5, 0.4, 1);
    label.visible = false;
    group.add(label);

    // Important node extra glow
    if (node.important) {
      const imp = halo.clone();
      imp.scale.set(2.2, 2.2, 1);
      imp.material = haloMat.clone();
      imp.material.opacity = 0.25;
      group.add(imp);
    }

    group.userData = { mesh: sphere, label };
    this.nodeObjects.set(node.id, group);
    this.scene.add(group);
  }

  _createEdge(edge) {
    const THREE = this.THREE;
    const src = this.nodeObjects.get(edge.sourceId);
    const tgt = this.nodeObjects.get(edge.targetId);
    if (!src || !tgt) return;

    const p1 = src.position, p2 = tgt.position;
    const arr = [p1.x, p1.y, p1.z, p2.x, p2.y, p2.z];
    const isBlue = edge.sourcePort === 'unmapped';
    const col = isBlue ? 0x4488ff : 0xb080ff;

    // Glow line
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const gMat = new THREE.LineBasicMaterial({
      color: col, transparent: true, opacity: 0.12
    });
    const glow = new THREE.Line(gGeo, gMat);
    this.scene.add(glow);
    this.edgeGlows.set(edge.id, glow);

    // Main line
    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const mMat = new THREE.LineBasicMaterial({
      color: col, transparent: true, opacity: 0.4
    });
    const main = new THREE.Line(mGeo, mMat);
    this.scene.add(main);
    this.edgeLines.set(edge.id, main);
  }

  addNode(node) {
    if (!this.initialized) return;
    this._rebuildFromGraph();
  }

  removeNode(nodeId) {
    if (!this.initialized) return;
    this._rebuildFromGraph();
  }

  refreshEdges() {
    if (!this.initialized) return;
    this._rebuildFromGraph();
  }

  refresh() {
    if (!this.initialized) return;
    this._rebuildFromGraph();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) this.controls.autoRotate = this.autoRotate;
  }

  _animateFrame() {
    this.animFrame = requestAnimationFrame(this._animate);
    if (this.controls) this.controls.update();

    const time = Date.now() * 0.001;
    const THREE = this.THREE;

    // Stars slowly rotate
    if (this.starField) {
      this.starField.rotation.y += 0.00008;
    }

    // Pulse neurons
    for (const [id, obj] of this.nodeObjects) {
      const mesh = obj.userData.mesh;
      if (mesh && mesh.scale.x < 1.1) {
        const pulse = 1 + Math.sin(time * 2 + id * 0.7) * 0.04;
        mesh.scale.set(pulse, pulse, pulse);
      }
      // Pulse rings
      const rings = obj.children.filter(c => c.isMesh && c.geometry.type === 'RingGeometry');
      rings.forEach((r, i) => {
        r.rotation.z = time * (0.3 + i * 0.1);
        r.material.opacity = 0.1 + Math.sin(time * 1.5 + id + i) * 0.05;
      });
    }

    // Pulse edges
    for (const [id, line] of this.edgeLines) {
      line.material.opacity = 0.3 + Math.sin(time * 1.5 + id * 0.5) * 0.15;
    }
    for (const [id, glow] of this.edgeGlows) {
      glow.material.opacity = 0.1 + Math.sin(time * 1.2 + id * 0.3) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this._boundResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('touchstart', this._boundTouchStart);
      this.renderer.domElement.removeEventListener('touchend', this._boundTouchEnd);
      this.renderer.domElement.removeEventListener('click', this._boundClick);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
