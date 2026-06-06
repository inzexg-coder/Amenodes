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
    this.sphereRadius = 6;
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
    this.camera.position.set(0, 2, 10);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new this.THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080610, 1);
    this.renderer.domElement.style.touchAction = 'manipulation';
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
    this.renderer.domElement.addEventListener('touchcancel', this._boundTouchEnd, { passive: true });
    this.renderer.domElement.addEventListener('click', this._boundClick);
    // Prevent long-press context menu on canvas
    this.renderer.domElement.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    this.initialized = true;
    this._rebuildFromGraph();
    this._animateFrame();
  }

  async _ensureThreeJS() {
    while (!window._threeLoaded) {
      await new Promise(r => setTimeout(r, 200));
    }
    this.THREE = window.THREE;
  }

  _createStarField() {
    const geo = new this.THREE.BufferGeometry();
    const count = 4000;
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
      // Star sprite - scale up and brighten
      const star = obj.userData.mesh;
      if (star) {
        star.scale.set(3.2, 3.2, 1);
        star.material.opacity = 1.0;
      }
      // Glow sprites - expand
      obj.children.forEach(c => {
        if (c.isSprite && c.material && c.material.opacity !== undefined && c.userData.isOrbit) return;
        if (c.isSprite && c.material && c.material.map) {
          if (c.scale.x > 4) return; // skip big glows
          c.scale.set(c.scale.x * 1.4, c.scale.y * 1.4, 1);
          c.material.opacity = 1.0;
        }
      });
      const label = obj.userData.label;
      if (label) {
        label.visible = true;
        label.material.opacity = 1.0;
        label.scale.set(3.2, 1.1, 1);
      }
    }
    if (this.eventBus && this.eventBus.emit) {
      this.eventBus.emit('nodeSelect', node);
    }
  }

  _deselectNode() {
    if (!this.selectedNode) return;
    const obj = this.nodeObjects.get(this.selectedNode.id);
    if (obj) {
      const color = obj.userData.color;
      // Star sprite - reset
      const star = obj.userData.mesh;
      if (star) {
        star.scale.set(1, 1, 1);
        star.material.opacity = 0.95;
      }
      // Glow sprites - reset
      obj.children.forEach(c => {
        if (c.isSprite && c.material && c.material.map) {
          if (c.userData.isOrbit) return; // skip orbiting dots
          if (c.scale.x >= 4) return; // big glows stay big
          c.scale.set(c.scale.x / 1.4, c.scale.y / 1.4, 1);
          c.material.opacity = 0.7;
        }
      });
      const label = obj.userData.label;
      if (label) {
        label.material.opacity = 0.9;
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
    // Clean up signal particles
    if (this.signalParticles) {
      for (const p of this.signalParticles) this.scene.remove(p);
    }
    this.nodeObjects.clear();
    this.edgeLines.clear();
    this.edgeGlows.clear();
    this.signalParticles = [];
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

    // Ensure matrices up to date for raycasting
    this.scene.updateMatrixWorld(true);
  }

  _createNeuron(node, position) {
    const THREE = this.THREE;
    const group = new THREE.Object3D();
    group.position.set(position.x, position.y, position.z);

    const color = this._getTypeColor(node.type);
    const c = new THREE.Color(color);
    const typeInfo = {
      number:    { size: 0.5, dendrites: 5, colorMult: 1.0, glow: '#8866ff' },
      constant:  { size: 0.55, dendrites: 6, colorMult: 0.9, glow: '#7766ff' },
      calc:      { size: 0.6, dendrites: 7, colorMult: 1.2, glow: '#ff44aa' },
      mean:      { size: 0.55, dendrites: 5, colorMult: 1.1, glow: '#ff66bb' },
      sem:       { size: 0.5, dendrites: 5, colorMult: 1.0, glow: '#cc44cc' },
      output:    { size: 0.55, dendrites: 4, colorMult: 0.9, glow: '#4499ff' },
      map:       { size: 0.5, dendrites: 6, colorMult: 1.0, glow: '#44dd99' },
      group:     { size: 0.55, dendrites: 6, colorMult: 1.1, glow: '#33bb88' }
    };
    const info = typeInfo[node.type] || typeInfo.number;
    const neuronSize = info.size + (node.important ? 0.15 : 0);
    const colStr = 'rgba(' + (c.r*255|0) + ',' + (c.g*255|0) + ',' + (c.b*255|0) + ',1)';
    const colDim = 'rgba(' + (c.r*255|0) + ',' + (c.g*255|0) + ',' + (c.b*255|0) + ',0.3)';

    // ===== Neuron body texture (cell body with dendrite tendrils) =====
    function makeNeuronTexture(col, dendrites) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const cx = 64, cy = 64;

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 64);
      grad.addColorStop(0, col.replace('1)', '0.6)'));
      grad.addColorStop(0.4, col.replace('1)', '0.2)'));
      grad.addColorStop(0.7, col.replace('1)', '0.05)'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      // Dendrite tendrils
      for (let i = 0; i < dendrites; i++) {
        const angle = (i / dendrites) * Math.PI * 2 + (node.id * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        // Wavy tendril
        const len = 35 + Math.random() * 25;
        const segments = 8;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const r = len * t;
          const wave = Math.sin(t * Math.PI * 3) * 6 * t;
          const x = cx + r * Math.cos(angle + wave * 0.02);
          const y = cy + r * Math.sin(angle + wave * 0.02);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col.replace('1)', '0.4)');
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small terminal button
        const tx = cx + len * Math.cos(angle);
        const ty = cy + len * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fillStyle = col.replace('1)', '0.5)');
        ctx.fill();
      }

      // Cell body (bright core)
      ctx.shadowColor = col;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(cx-3, cy-3, 0, cx, cy, 16);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, col);
      coreGrad.addColorStop(0.7, col.replace('1)', '0.7)'));
      coreGrad.addColorStop(1, col.replace('1)', '0)'));
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Glowing nucleus
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();

      return canvas;
    }

    const texCanvas = makeNeuronTexture(colStr, info.dendrites);
    const neuronTex = new THREE.CanvasTexture(texCanvas);
    const neuronMat = new THREE.SpriteMaterial({
      map: neuronTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 1.0
    });
    const neuronSprite = new THREE.Sprite(neuronMat);
    neuronSprite.scale.set(neuronSize * 3.0, neuronSize * 3.0, 1);
    neuronSprite.userData.nodeId = node.id;
    group.add(neuronSprite);
    this.nodeMeshes.push(neuronSprite);

    // ===== Outer corona =====
    const coronaCanvas = document.createElement('canvas');
    coronaCanvas.width = 96; coronaCanvas.height = 96;
    const cctx = coronaCanvas.getContext('2d');
    const cgrad = cctx.createRadialGradient(48, 48, 5, 48, 48, 48);
    cgrad.addColorStop(0, colDim);
    cgrad.addColorStop(0.5, col.replace('1)', '0.08)'));
    cgrad.addColorStop(1, 'rgba(0,0,0,0)');
    cctx.fillStyle = cgrad;
    cctx.fillRect(0, 0, 96, 96);
    const coronaTex = new THREE.CanvasTexture(coronaCanvas);
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8
    });
    const corona = new THREE.Sprite(coronaMat);
    corona.scale.set(neuronSize * 5, neuronSize * 5, 1);
    group.add(corona);

    // ===== Orbiting synaptic particles =====
    for (let i = 0; i < 4; i++) {
      const dotCanvas = document.createElement('canvas');
      dotCanvas.width = 16; dotCanvas.height = 16;
      const dctx = dotCanvas.getContext('2d');
      dctx.beginPath();
      dctx.arc(8, 8, 4, 0, Math.PI * 2);
      dctx.fillStyle = 'rgba(255,255,255,0.7)';
      dctx.fill();
      const dotTex = new THREE.CanvasTexture(dotCanvas);
      const dotMat = new THREE.SpriteMaterial({
        map: dotTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.6
      });
      const dot = new THREE.Sprite(dotMat);
      const angle = (i / 4) * Math.PI * 2 + node.id * 0.5;
      dot.position.set(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0);
      dot.scale.set(0.1, 0.1, 1);
      dot.userData.isOrbit = true;
      dot.userData.orbitAngle = angle;
      dot.userData.orbitSpeed = 0.6 + i * 0.2;
      dot.userData.orbitRadius = 0.5 + i * 0.12;
      group.add(dot);
    }

    // ===== Important node: extra glow ring =====
    if (node.important) {
      const ringCanvas = document.createElement('canvas');
      ringCanvas.width = 128; ringCanvas.height = 128;
      const rctx = ringCanvas.getContext('2d');
      rctx.strokeStyle = col.replace('1)', '0.4)');
      rctx.lineWidth = 2;
      rctx.beginPath();
      rctx.arc(64, 64, 48, 0, Math.PI * 2);
      rctx.stroke();
      rctx.strokeStyle = col.replace('1)', '0.15)');
      rctx.lineWidth = 1;
      rctx.beginPath();
      rctx.arc(64, 64, 36, 0, Math.PI * 2);
      rctx.stroke();
      const ringTex = new THREE.CanvasTexture(ringCanvas);
      const ringMat = new THREE.SpriteMaterial({
        map: ringTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5
      });
      const ring = new THREE.Sprite(ringMat);
      ring.scale.set(neuronSize * 6, neuronSize * 6, 1);
      group.add(ring);
    }

    // ===== Label =====
    const labelTitle = node.title || node.type || 'Node';
    const labelType = node.type || '';
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 512;
    lCanvas.height = 180;
    const lctx = lCanvas.getContext('2d');
    
    // Glowing dot
    lctx.beginPath();
    lctx.arc(70, 90, 16, 0, Math.PI * 2);
    lctx.fillStyle = '#' + c.getHexString();
    lctx.shadowColor = '#' + c.getHexString();
    lctx.shadowBlur = 20;
    lctx.fill();
    lctx.shadowBlur = 0;
    
    lctx.font = 'bold 20px monospace';
    lctx.textAlign = 'left';
    lctx.textBaseline = 'middle';
    lctx.fillStyle = '#ffffff';
    lctx.fillText(labelType.toUpperCase(), 105, 48);
    
    lctx.font = 'bold 28px monospace';
    lctx.fillStyle = '#e0d0ff';
    lctx.shadowColor = 'rgba(0,0,0,0.8)';
    lctx.shadowBlur = 6;
    const displayTitle = labelTitle.length > 14 ? labelTitle.slice(0, 12) + '..' : labelTitle;
    lctx.fillText(displayTitle, 105, 96);

    try {
      const val = node.getValue();
      if (val && val.length > 0) {
        const valStr = val.map(function(x) { return typeof x === 'number' ? x.toFixed(2) : x; }).join(', ');
        const displayVal = valStr.length > 18 ? valStr.slice(0, 16) + '..' : valStr;
        lctx.font = '16px monospace';
        lctx.fillStyle = 'rgba(180,160,240,0.4)';
        lctx.fillText('= ' + displayVal, 105, 140);
      }
    } catch(e) {}

    const lTex = new THREE.CanvasTexture(lCanvas);
    const lMat = new THREE.SpriteMaterial({
      map: lTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.9
    });
    const label = new THREE.Sprite(lMat);
    label.position.y = -(neuronSize + 0.7);
    label.scale.set(2.2, 0.8, 1);
    label.visible = true;
    group.add(label);
    group.userData = { mesh: neuronSprite, label, color: c, nodeType: node.type, nodeId: node.id };
    this.nodeObjects.set(node.id, group);
    this.scene.add(group);
  }

  _createEdge(edge) {
    const THREE = this.THREE;
    const src = this.nodeObjects.get(edge.sourceId);
    const tgt = this.nodeObjects.get(edge.targetId);
    if (!src || !tgt) return;

    const p1 = src.position, p2 = tgt.position;
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2 };
    // Slight curve for organic feel
    const ctrl = { x: mid.x + (Math.random() - 0.5) * 0.5, y: mid.y + (Math.random() - 0.5) * 0.5, z: mid.z + (Math.random() - 0.5) * 0.5 };
    
    // Use quadratic bezier curve
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      new THREE.Vector3(ctrl.x, ctrl.y, ctrl.z),
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );
    const points = curve.getPoints(16);
    const positions = [];
    points.forEach(function(p) { positions.push(p.x, p.y, p.z); });
    
    const isBlue = edge.sourcePort === 'unmapped';
    const col = isBlue ? 0x4488ff : 0xb080ff;
    const colStr = isBlue ? 'rgba(68,136,255,' : 'rgba(176,128,255,';

    // Glow line (thicker, transparent)
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const gMat = new THREE.LineBasicMaterial({
      color: col, transparent: true, opacity: 0.08
    });
    const glow = new THREE.Line(gGeo, gMat);
    this.scene.add(glow);
    this.edgeGlows.set(edge.id, glow);

    // Main line (thinner, visible)
    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mMat = new THREE.LineBasicMaterial({
      color: col, transparent: true, opacity: 0.35
    });
    const main = new THREE.Line(mGeo, mMat);
    this.scene.add(main);
    this.edgeLines.set(edge.id, main);

    // Signal particle (travels along the connection)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 12; pCanvas.height = 12;
    const pctx = pCanvas.getContext('2d');
    pctx.beginPath();
    pctx.arc(6, 6, 4, 0, Math.PI * 2);
    pctx.fillStyle = 'rgba(255,255,255,0.9)';
    pctx.fill();
    const pTex = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.SpriteMaterial({
      map: pTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    });
    const particle = new THREE.Sprite(pMat);
    particle.scale.set(0.08, 0.08, 1);
    this.scene.add(particle);
    particle.userData.edgeId = edge.id;
    particle.userData.progress = Math.random();
    particle.userData.speed = 0.3 + Math.random() * 0.2;
    particle.userData.curve = curve;
    if (!this.signalParticles) this.signalParticles = [];
    this.signalParticles.push(particle);
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

    // Pulse edges + move signal particles
    for (const [id, line] of this.edgeLines) {
      line.material.opacity = 0.25 + Math.sin(time * 1.2 + id * 0.5) * 0.15;
    }
    for (const [id, glow] of this.edgeGlows) {
      glow.material.opacity = 0.06 + Math.sin(time * 1.0 + id * 0.3) * 0.04;
    }
    // Animate signal particles along curves
    if (this.signalParticles) {
      for (const p of this.signalParticles) {
        p.userData.progress += 0.005 * p.userData.speed;
        if (p.userData.progress > 1) p.userData.progress = 0;
        const pt = p.userData.curve.getPoint(p.userData.progress);
        p.position.set(pt.x, pt.y, pt.z);
      }
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
