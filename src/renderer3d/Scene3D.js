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

    this._touchHandledClick = false;
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
    // Nebula particle field (distant cosmic clouds)
    this._createNebula();

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
    if (this._pendingRefresh) { this._rebuildFromGraph(); this._pendingRefresh = false; }
    this._animateFrame();
  }

  async _ensureThreeJS() {
    while (!window._threeLoaded) {
      await new Promise(r => setTimeout(r, 200));
    }
    this.THREE = window.THREE;
  }

  _createNebula() {
    var THREE = this.THREE;
    var count = 200;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 40 + Math.random() * 60;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
      var col = new THREE.Color().setHSL(0.7 + Math.random() * 0.15, 0.6, 0.05 + Math.random() * 0.08);
      colors[i*3] = col.r;
      colors[i*3+1] = col.g;
      colors[i*3+2] = col.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.8, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending,
      depthWrite: false, vertexColors: true, sizeAttenuation: true
    });
    this.nebula = new THREE.Points(geo, mat);
    this.scene.add(this.nebula);
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
      this._touchHandledClick = true;
    }
    if (dist > 5) this.isTouchDragging = true;
  }

  _onClick(e) {
    // Skip click if it was already handled by touch
    if (this._touchHandledClick) { this._touchHandledClick = false; return; }
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
    // Only deselect if different node and no modal is shown
    if (this.selectedNode && this.selectedNode.id !== nodeId) {
      this._deselectNode();
    } else if (this.selectedNode && this.selectedNode.id === nodeId) {
      // Same node tapped again - check for Map double-click
      var node = this.selectedNode;
      if (node && node.type === 'map') {
        this._toggleMapBluePort(node);
      }
      if (this.eventBus && this.eventBus.emit) {
        this.eventBus.emit('nodeSelect', this.selectedNode);
      }
      return;
    }
    const node = this.graph.getNode(nodeId);
    if (!node) return;
    this.selectedNode = node;
    const obj = this.nodeObjects.get(nodeId);
    if (obj) {
      const card = obj.userData.mesh;
      if (card) {
        card.scale.set(obj.userData.baseScale * 1.2, obj.userData.baseScale * 0.625 * 1.2, 1);
        card.material.opacity = 1.0;
      }
      // Highlight glow
      const glow = obj.userData.glow;
      if (glow) {
        glow.scale.set(obj.userData.cardWidth * 2.5, obj.userData.cardWidth * 1.5, 1);
        glow.material.opacity = 1.0;
      }
      // Show label
      const label = obj.userData.label;
      if (label) {
        label.material.opacity = 1.0;
        label.scale.set(1.5, 0.35, 1);
      }
    }
    if (this.eventBus && this.eventBus.emit) {
      this.eventBus.emit('nodeSelect', node);
    }
  }
  
  _toggleMapBluePort(node) {
    var obj = this.nodeObjects.get(node.id);
    if (!obj || !obj.userData.bluePort) return;
    var bp = obj.userData.bluePort;
    obj.userData.bluePortVisible = !obj.userData.bluePortVisible;
    bp.visible = obj.userData.bluePortVisible;
    // Flash feedback
    var card = obj.userData.mesh;
    if (card) {
      card.material.opacity = 0.5;
      var self = this;
      setTimeout(function() { if (card) card.material.opacity = 1.0; }, 150);
    }
  }

  _deselectNode() {
    if (!this.selectedNode) return;
    const obj = this.nodeObjects.get(this.selectedNode.id);
    if (obj) {
      const card = obj.userData.mesh;
      if (card) {
        card.scale.set(obj.userData.baseScale, obj.userData.baseScale * 0.625, 1);
        card.material.opacity = 0.95;
      }
      const glow = obj.userData.glow;
      if (glow) {
        glow.scale.set(obj.userData.cardWidth * 2.0, obj.userData.cardWidth * 1.2, 1);
        glow.material.opacity = 0.6;
      }
      const label = obj.userData.label;
      if (label) {
        label.material.opacity = 0;
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
    // Flame-like colors: deep orange (0.03) to blue-white (0.60)
    // Based on star spectral types: O (blue), B (blue-white), A (white), 
    // F (yellow-white), G (yellow), K (orange), M (red-orange)
    var hash = 0;
    for (var i = 0; i < type.length; i++) {
      hash = ((hash << 5) - hash) + type.charCodeAt(i);
    }
    // Map to a wider range: warm orange to hot blue-white
    var hue = 0.03 + (Math.abs(hash) % 100) / 100 * 0.55;
    var sat = 0.70 + (Math.abs(hash) % 25) / 100;
    var light = 0.55 + (Math.abs(hash) % 30) / 100;
    var col = new THREE.Color();
    col.setHSL(hue, sat, light);
    return col.getHex();
  }

  _rebuildFromGraph() {
    // Reset selection state
    this.selectedNode = null;
    // Clean up
    // Keep nebula and starfield (don't remove them)
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

    // Read visual params from metadata
    let visual3d = null;
    try {
      if (node.constructor && node.constructor.metadata && node.constructor.metadata.visual3d) {
        visual3d = node.constructor.metadata.visual3d;
      }
    } catch(e) {}
    if (!visual3d) {
      visual3d = { color: 0x8060c0, size: 0.5, dendrites: 4, glow: '#8060c0' };
    }
    
    const color = this._getTypeColor(node.type);
    const c = new THREE.Color(color);
    const cardWidth = visual3d.size * 3.5 + (node.important ? 0.3 : 0);
    const cardHeight = cardWidth * 0.6;
    
    // Generate card texture based on node type
    function makeCardTexture(type, col, title, val, isImportant) {
      var canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 320;
      var ctx = canvas.getContext('2d');
      var w = 512, h = 320;
      var r = 24;
      
      // Extract RGB
      var rgbMatch = col.match(/rgba\((\d+),(\d+),(\d+)/);
      var cr = parseInt(rgbMatch[1]), cg = parseInt(rgbMatch[2]), cb = parseInt(rgbMatch[3]);
      
      // Shadow
      ctx.shadowColor = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.4)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 4;
      
      // Rounded rectangle background
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r);
      ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h);
      ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      
      // Background gradient
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.25)');
      grad.addColorStop(0.3, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.15)');
      grad.addColorStop(0.7, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.08)');
      grad.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.03)');
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Border glow
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Important node: extra border glow
      if (isImportant) {
        ctx.shadowColor = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.8)';
        ctx.shadowBlur = 40;
        ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      // Type icon at top-left
      var icons = {
        number: '\u2726', constant: '\u25C6', calc: '\u26A1',
        mean: '\u03BC', sem: '\u03C3', output: '\u25CE',
        map: '\u229E', group: '\u229F'
      };
      var icon = icons[type] || '\u25C8';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.8)';
      ctx.fillText(icon, 20, 18);
      
      // Type label
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = 'rgba(200,180,255,0.5)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(type.toUpperCase(), w - 20, 18);
      
      // Title
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(220,200,255,0.9)';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      var displayTitle = (title || type || 'Node').length > 16 ? (title || type || 'Node').slice(0, 14) + '..' : (title || type || 'Node');
      ctx.fillText(displayTitle, 20, 90);
      
      // Value display
      ctx.shadowBlur = 0;
      ctx.font = '22px monospace';
      ctx.fillStyle = 'rgba(180,160,240,0.6)';
      var displayVal = '';
      try {
        var v = node.getValue();
        if (v && v.length > 0) {
          var vStr = v.map(function(x) { return typeof x === 'number' ? x.toFixed(2) : String(x); }).join(', ');
          displayVal = vStr.length > 22 ? vStr.slice(0, 20) + '..' : vStr;
        } else {
          displayVal = '\u2014';
        }
      } catch(e) { displayVal = '\u2014'; }
      ctx.fillText('= ' + displayVal, 20, 150);
      
      // Bottom accent line
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.3)';
      ctx.fillRect(20, h - 4, w - 40, 2);
      
      return canvas;
    }
    
    var colStr = 'rgba(' + (c.r*255|0) + ',' + (c.g*255|0) + ',' + (c.b*255|0) + ',1)';
    var texCanvas = makeCardTexture(node.type, colStr, node.title, null, node.important);
    var cardTex = new THREE.CanvasTexture(texCanvas);
    cardTex.needsUpdate = true;
    
    var cardMat = new THREE.SpriteMaterial({
      map: cardTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.95
    });
    var cardSprite = new THREE.Sprite(cardMat);
    cardSprite.scale.set(cardWidth, cardWidth * 0.625, 1);
    cardSprite.userData.nodeId = node.id;
    group.add(cardSprite);
    this.nodeMeshes.push(cardSprite);
    
    // Glow behind card
    var glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128; glowCanvas.height = 80;
    var gctx = glowCanvas.getContext('2d');
    var gGrad = gctx.createRadialGradient(64, 40, 5, 64, 40, 64);
    gGrad.addColorStop(0, colStr.replace('1)', '0.15)'));
    gGrad.addColorStop(0.5, colStr.replace('1)', '0.05)'));
    gGrad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = gGrad;
    gctx.fillRect(0, 0, 128, 80);
    var glowTex = new THREE.CanvasTexture(glowCanvas);
    var glowMat = new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6
    });
    var glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(cardWidth * 2.0, cardWidth * 1.2, 1);
    group.add(glowSprite);
    
    // For Group and Output: add column indicators (expand on proximity)
    if (node.type === 'group' || node.type === 'output') {
      var colCount = 3;
      if (node.type === 'group' && node.values) colCount = Math.min(node.values.length, 6);
      if (node.type === 'output' && node.rows) colCount = Math.min(node.rows.length, 6);
      
      for (var ci = 0; ci < colCount; ci++) {
        (function(idx) {
          var colCanvas = document.createElement('canvas');
          colCanvas.width = 24; colCanvas.height = 80;
          var cctx = colCanvas.getContext('2d');
          var barH = 20 + Math.sin(idx * 2.7) * 15 + 15;
          var gradBar = cctx.createLinearGradient(0, 80 - barH, 0, 80);
          gradBar.addColorStop(0, colStr.replace('1)', '0.6)'));
          gradBar.addColorStop(1, colStr.replace('1)', '0.1)'));
          cctx.fillStyle = gradBar;
          cctx.beginPath();
                    // Manual rounded rect (top corners only)
          var bx = 2, by = 80 - barH, bw = 20, bh = barH, br = 3;
          cctx.beginPath();
          cctx.moveTo(bx + br, by);
          cctx.lineTo(bx + bw - br, by);
          cctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
          cctx.lineTo(bx + bw, by + bh);
          cctx.lineTo(bx, by + bh);
          cctx.lineTo(bx, by + br);
          cctx.quadraticCurveTo(bx, by, bx + br, by);
          cctx.closePath();
          cctx.fill();
          
          var colTex = new THREE.CanvasTexture(colCanvas);
          var colMat = new THREE.SpriteMaterial({
            map: colTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8
          });
          var colSprite = new THREE.Sprite(colMat);
          var colSpan = (colCount - 1) * 0.5;
          colSprite.position.set((idx - colSpan) * 0.5, -(cardWidth * 0.625 * 0.5 + 0.15), 0);
          colSprite.scale.set(0.15, 0.5, 1);
          colSprite.userData.isColumn = true;
          colSprite.userData.baseY = colSprite.position.y;
          colSprite.userData.expandSpeed = 0.5 + idx * 0.1;
          group.add(colSprite);
        })(ci);
      }
    }
    
    // Map node: blue port indicator
    if (node.type === 'map') {
      var bpCanvas = document.createElement('canvas');
      bpCanvas.width = 32; bpCanvas.height = 32;
      var bpctx = bpCanvas.getContext('2d');
      bpctx.beginPath();
      bpctx.arc(16, 16, 10, 0, Math.PI * 2);
      bpctx.fillStyle = 'rgba(68,136,255,0.6)';
      bpctx.shadowColor = 'rgba(68,136,255,0.8)';
      bpctx.shadowBlur = 15;
      bpctx.fill();
      var bpTex = new THREE.CanvasTexture(bpCanvas);
      var bpMat = new THREE.SpriteMaterial({
        map: bpTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5
      });
      var bpSprite = new THREE.Sprite(bpMat);
      bpSprite.position.set(0, cardWidth * 0.625 * 0.5 + 0.15, 0);
      bpSprite.scale.set(0.2, 0.2, 1);
      bpSprite.visible = false; // hidden by default, toggle on double-click
      bpSprite.userData.isBluePort = true;
      group.add(bpSprite);
      group.userData.bluePort = bpSprite;
    }
    
    // Calc node: mode indicator
    if (node.type === 'calc') {
      var mdCanvas = document.createElement('canvas');
      mdCanvas.width = 128; mdCanvas.height = 40;
      var mdctx = mdCanvas.getContext('2d');
      mdctx.font = 'bold 18px monospace';
      mdctx.textAlign = 'center';
      mdctx.textBaseline = 'middle';
      mdctx.fillStyle = 'rgba(200,180,255,0.5)';
      mdctx.fillText((node.operation || 'sum').toUpperCase(), 64, 20);
      var mdTex = new THREE.CanvasTexture(mdCanvas);
      var mdMat = new THREE.SpriteMaterial({
        map: mdTex, transparent: true, depthWrite: false, opacity: 0.7
      });
      var mdSprite = new THREE.Sprite(mdMat);
      mdSprite.position.set(0, -(cardWidth * 0.625 * 0.5 + 0.15), 0);
      mdSprite.scale.set(0.6, 0.2, 1);
      mdSprite.userData.isModeIndicator = true;
      group.add(mdSprite);
    }
    
    // Label
    const labelTitle = node.title || node.type || 'Node';
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 256;
    lCanvas.height = 48;
    const lctx = lCanvas.getContext('2d');
    lctx.font = 'bold 20px monospace';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillStyle = '#e0d0ff';
    var displayLabel = labelTitle.length > 20 ? labelTitle.slice(0, 18) + '..' : labelTitle;
    lctx.fillText(displayLabel, 128, 24);
    const lTex = new THREE.CanvasTexture(lCanvas);
    const lMat = new THREE.SpriteMaterial({
      map: lTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0
    });
    const label = new THREE.Sprite(lMat);
    label.position.y = -(cardWidth * 0.625 * 0.5 + 0.3);
    label.scale.set(1.2, 0.3, 1);
    label.visible = true;
    group.add(label);
    
    // Store data
    var hsl = {};
    c.getHSL(hsl);
    group.userData.mesh = cardSprite;
    group.userData.label = label;
    group.userData.color = c;
    group.userData.nodeType = node.type;
    group.userData.nodeId = node.id;
    group.userData.baseScale = cardWidth;
    group.userData.baseHue = hsl.h;
    group.userData.cardWidth = cardWidth;
    group.userData.glow = glowSprite;
    if (node.type === 'map') group.userData.bluePortVisible = false;
    
    this.nodeObjects.set(node.id, group);
    this.scene.add(group);
  }  _createEdge(edge) {
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
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this._rebuildFromGraph();
  }

  removeNode(nodeId) {
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this._rebuildFromGraph();
  }

  refreshEdges() {
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this._rebuildFromGraph();
  }

  refresh() {
    if (!this.initialized) { this._pendingRefresh = true; return; }
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

    // Stars and nebula slowly rotate
    if (this.starField) {
      this.starField.rotation.y += 0.00008;
    }
    if (this.nebula) {
      this.nebula.rotation.y += 0.00012;
      this.nebula.rotation.x += 0.00004;
    }

    // Animate cards with glow pulse and proximity-based expansion
    var cameraPos = this.camera ? this.camera.position : null;
    for (const [id, obj] of this.nodeObjects) {
      var card = obj.userData.mesh;
      if (card) {
        // Gentle pulse
        var pulse = 0.95 + Math.sin(time * 0.8 + id * 1.3) * 0.05;
        var baseScale = obj.userData.baseScale || 1;
        card.scale.set(baseScale * pulse, baseScale * 0.625 * pulse, 1);
        card.material.opacity = 0.85 + Math.sin(time * 1.2 + id * 0.9) * 0.1;
        
        // Color pulse
        var color = obj.userData.color;
        if (color && obj.userData.baseHue !== undefined) {
          var hueShift = Math.sin(time * 0.5 + id * 0.7) * 0.01;
          var newHue = obj.userData.baseHue + hueShift;
          if (newHue < 0) newHue += 1;
          if (newHue > 1) newHue -= 1;
          var lightShift = Math.sin(time * 1.0 + id * 0.9) * 0.05;
          color.setHSL(newHue, 0.8, 0.5 + lightShift);
          if (card.material && card.material.map) {
            // Card uses canvas texture - we don't update it per frame
            // But the glow behind can change
          }
        }
        
        // Glow behind card
        var glow = obj.userData.glow;
        if (glow) {
          glow.material.opacity = 0.4 + Math.sin(time * 0.7 + id * 1.1) * 0.2;
        }
        
        // Proximity: expand columns for Group/Output nodes
        if (cameraPos && (obj.userData.nodeType === 'group' || obj.userData.nodeType === 'output')) {
          var dx = cameraPos.x - obj.position.x;
          var dy = cameraPos.y - obj.position.y;
          var dz = cameraPos.z - obj.position.z;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          var proximity = Math.max(0, 1 - (dist - 3) / 8);
          
          obj.children.forEach(function(child) {
            if (child.userData && child.userData.isColumn && child.isSprite) {
              var expand = 0.3 + proximity * 0.7;
              var targetScaleX = 0.15 * expand;
              var targetScaleY = 0.5 * expand;
              child.scale.x += (targetScaleX - child.scale.x) * 0.05;
              child.scale.y += (targetScaleY - child.scale.y) * 0.05;
              child.material.opacity = 0.3 + proximity * 0.6;
            }
          });
        }
      }
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
    if (this.nebula) { this.scene.remove(this.nebula); this.nebula = null; }
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
