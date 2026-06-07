/**
 * Scene3D - Three.js 3D visualization for Amenodes
 * Renders graph nodes as rounded rectangle cards on a rotating sphere
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
    await this._ensureThreeJS();
    var THREE = this.THREE;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080610);
    this._createNebula();

    var aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 12);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080610, 1);
    this.renderer.domElement.style.touchAction = 'manipulation';
    this.container.appendChild(this.renderer.domElement);

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

    this.scene.add(new THREE.AmbientLight(0x404060, 0.6));
    var dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this._createStarField();

    window.addEventListener('resize', this._boundResize);
    this.renderer.domElement.addEventListener('touchstart', this._boundTouchStart, { passive: true });
    this.renderer.domElement.addEventListener('touchend', this._boundTouchEnd, { passive: true });
    this.renderer.domElement.addEventListener('touchcancel', this._boundTouchEnd, { passive: true });
    this.renderer.domElement.addEventListener('click', this._boundClick);
    this.renderer.domElement.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    this.initialized = true;
    this.rebuild();
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
    var pos = new Float32Array(count * 3);
    var cols = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 40 + Math.random() * 60;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      var c = new THREE.Color().setHSL(0.7 + Math.random() * 0.15, 0.6, 0.05 + Math.random() * 0.08);
      cols[i*3] = c.r; cols[i*3+1] = c.g; cols[i*3+2] = c.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    var mat = new THREE.PointsMaterial({
      size: 60, map: this._makeDotTexture(), blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, vertexColors: true, opacity: 0.3
    });
    this.nebula = new THREE.Points(geo, mat);
    this.scene.add(this.nebula);
  }

  _makeDotTexture() {
    var c = document.createElement('canvas');
    c.width = 8; c.height = 8;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    return new this.THREE.CanvasTexture(c);
  }

  _createStarField() {
    var THREE = this.THREE;
    var count = 1000;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 400;
      pos[i*3+1] = (Math.random() - 0.5) * 400;
      pos[i*3+2] = (Math.random() - 0.5) * 400;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.4, transparent: true, opacity: 0.6
    });
    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  rebuild() {
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this.selectedNode = null;
    for (var obj of this.nodeObjects.values()) this.scene.remove(obj);
    for (var l of this.edgeLines.values()) this.scene.remove(l);
    for (var g of this.edgeGlows.values()) this.scene.remove(g);
    if (this.signalParticles) {
      for (var p of this.signalParticles) this.scene.remove(p);
    }
    this.nodeObjects.clear();
    this.edgeLines.clear();
    this.edgeGlows.clear();
    this.signalParticles = [];
    this.nodeMeshes = [];

    var nodes = this.graph.nodes;
    var edges = this.graph.edges;
    var total = Math.max(nodes.length, 1);

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var pos = this._fibSphere(i, total, this.sphereRadius);
      try { this._createCard(node, pos); } catch(e) {
        console.error('3D card error:', node.id, node.type, e);
      }
    }
    for (var e of edges) {
      try { this._createEdge(e); } catch(ex) {}
    }
    if (this.controls) this.controls.autoRotate = this.autoRotate;
    this.scene.updateMatrixWorld(true);
  }

  refresh() { this.rebuild(); }

  _fibSphere(i, n, r) {
    var phi = Math.acos(1 - 2 * (i + 0.5) / n);
    var theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) };
  }

  _getCardColor(type) {
    var map = {
      number: '#b080ff', constant: '#9060ff', calc: '#e040a0',
      mean: '#d040b0', sem: '#c040c0', output: '#4090ff',
      map: '#40d090', group: '#30b080'
    };
    return map[type] || '#8060c0';
  }

  _drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _makeCardTexture(node, hexColor) {
    var c = document.createElement('canvas');
    c.width = 400; c.height = 240;
    var ctx = c.getContext('2d');
    var w = 400, h = 240, r = 16;

    // Parse hex to rgb
    var cr = parseInt(hexColor.slice(1,3),16);
    var cg = parseInt(hexColor.slice(3,5),16);
    var cb = parseInt(hexColor.slice(5,7),16);

    // Shadow
    ctx.shadowColor = 'rgba('+cr+','+cg+','+cb+',0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 3;

    // Card background (dark with color tint)
    this._drawRoundedRect(ctx, 0, 0, w, h, r);
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba('+cr+','+cg+','+cb+',0.60)');
    grad.addColorStop(0.3, 'rgba('+cr+','+cg+','+cb+',0.25)');
    grad.addColorStop(0.6, 'rgba(12,8,28,0.95)');
    grad.addColorStop(1, 'rgba(8,6,18,0.98)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.5)';
    ctx.lineWidth = 2;
    this._drawRoundedRect(ctx, 0, 0, w, h, r);
    ctx.stroke();

    // Top accent line
    ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.6)';
    ctx.fillRect(r, 0, w - r*2, 3);

    // Icons
    var icons = { number:'✦', constant:'◆', calc:'⚡', mean:'μ', sem:'σ', output:'◎', map:'⊞', group:'⊟' };
    var icon = icons[node.type] || '◈';

    // Icon
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = hexColor;
    ctx.shadowColor = hexColor;
    ctx.shadowBlur = 12;
    ctx.fillText(icon, 16, 16);
    ctx.shadowBlur = 0;

    // Type badge
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(200,180,255,0.4)';
    ctx.fillText(node.type.toUpperCase(), w - 16, 18);

    // Title
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e0d0ff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    var ttl = (node.title || node.type || 'Node').slice(0, 18);
    ctx.fillText(ttl, 16, 80);

    // Value
    ctx.shadowBlur = 0;
    ctx.font = '18px monospace';
    ctx.fillStyle = 'rgba(180,160,240,0.7)';
    var valStr = '—';
    try {
      var v = node.getValue();
      if (v && v.length > 0) {
        valStr = v.map(function(x) { return typeof x === 'number' ? x.toFixed(2) : x; }).join(', ').slice(0, 24);
      }
    } catch(e) {}
    ctx.fillText('= ' + valStr, 16, 130);

    // Bottom accent
    ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.2)';
    ctx.fillRect(16, h - 4, w - 32, 1);

    // Important glow
    if (node.important) {
      ctx.shadowColor = hexColor;
      ctx.shadowBlur = 40;
      ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.7)';
      ctx.lineWidth = 3;
      this._drawRoundedRect(ctx, 0, 0, w, h, r);
      ctx.stroke();
    }

    return c;
  }

  _createCard(node, pos) {
    var THREE = this.THREE;
    var group = new THREE.Object3D();
    group.position.set(pos.x, pos.y, pos.z);

    var hexColor = this._getCardColor(node.type);
    var texCanvas = this._makeCardTexture(node, hexColor);
    var tex = new THREE.CanvasTexture(texCanvas);
    tex.needsUpdate = true;

    var cardW = 2.0;
    var cardH = cardW * 0.6;

    var mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(cardW, cardH, 1);
    sprite.userData.nodeId = node.id;
    group.add(sprite);
    this.nodeMeshes.push(sprite);

    // Glow behind card
    var _cr = parseInt(hexColor.slice(1,3),16);
    var _cg = parseInt(hexColor.slice(3,5),16);
    var _cb = parseInt(hexColor.slice(5,7),16);
    var gCanvas = document.createElement('canvas');
    gCanvas.width = 64; gCanvas.height = 64;
    var gctx = gCanvas.getContext('2d');
    var grad = gctx.createRadialGradient(32, 32, 3, 32, 32, 32);
    grad.addColorStop(0, 'rgba('+_cr+','+_cg+','+_cb+',0.25)');
    grad.addColorStop(0.5, 'rgba('+_cr+','+_cg+','+_cb+',0.10)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    var gTex = new THREE.CanvasTexture(gCanvas);
    var gMat = new THREE.SpriteMaterial({
      map: gTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5
    });
    var gSprite = new THREE.Sprite(gMat);
    gSprite.scale.set(cardW * 2.2, cardH * 2.2, 1);
    group.add(gSprite);

    // Group/Output: column indicators
    if (node.type === 'group' || node.type === 'output') {
      var colN = 3;
      if (node.type === 'group' && node.values) colN = Math.min(node.values.length, 6);
      if (node.type === 'output' && node.rows) colN = Math.min(node.rows.length, 6);
      for (var ci = 0; ci < colN; ci++) {
        (function(idx) {
          var cc = document.createElement('canvas');
          cc.width = 16; cc.height = 60;
          var cctx = cc.getContext('2d');
          var bh = 15 + Math.sin(idx * 2.7) * 10 + 10;
          var gr = cctx.createLinearGradient(0, 60-bh, 0, 60);
          gr.addColorStop(0, 'rgba('+_cr+','+_cg+','+_cb+',0.6)');
          gr.addColorStop(1, 'rgba('+_cr+','+_cg+','+_cb+',0.15)');
          cctx.fillStyle = gr;
          // Rounded rect for bar
          cctx.beginPath();
          cctx.moveTo(2, 60-bh+3); cctx.lineTo(14, 60-bh+3);
          cctx.quadraticCurveTo(16, 60-bh+3, 16, 60-bh);
          cctx.lineTo(16, 60); cctx.lineTo(0, 60);
          cctx.lineTo(0, 60-bh); cctx.quadraticCurveTo(0, 60-bh+3, 2, 60-bh+3);
          cctx.closePath();
          cctx.fill();

          var cTex = new THREE.CanvasTexture(cc);
          var cMat = new THREE.SpriteMaterial({
            map: cTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7
          });
          var cSp = new THREE.Sprite(cMat);
          var span = (colN - 1) * 0.4;
          cSp.position.set((idx - span) * 0.4, -(cardH * 0.5 + 0.1), 0);
          cSp.scale.set(0.12, 0.35, 1);
          cSp.userData.isColumn = true;
          group.add(cSp);
        })(ci);
      }
    }

    // Map: blue port dot (hidden initially)
    if (node.type === 'map') {
      var bp = document.createElement('canvas');
      bp.width = 20; bp.height = 20;
      var bpctx = bp.getContext('2d');
      bpctx.beginPath();
      bpctx.arc(10, 10, 6, 0, Math.PI * 2);
      bpctx.fillStyle = '#4488ff';
      bpctx.shadowColor = '#4488ff';
      bpctx.shadowBlur = 10;
      bpctx.fill();
      var bpTex = new THREE.CanvasTexture(bp);
      var bpMat = new THREE.SpriteMaterial({
        map: bpTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
      });
      var bpSp = new THREE.Sprite(bpMat);
      bpSp.position.set(0, cardH * 0.5 + 0.1, 0);
      bpSp.scale.set(0.15, 0.15, 1);
      bpSp.visible = false;
      bpSp.userData.isBluePort = true;
      group.add(bpSp);
      group.userData.bluePort = bpSp;
    }

    // Calc: mode label
    if (node.type === 'calc') {
      var mc = document.createElement('canvas');
      mc.width = 80; mc.height = 24;
      var mctx = mc.getContext('2d');
      mctx.font = 'bold 14px monospace';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillStyle = 'rgba(200,180,255,0.5)';
      mctx.fillText((node.operation || 'sum').toUpperCase(), 40, 12);
      var mTex = new THREE.CanvasTexture(mc);
      var mMat = new THREE.SpriteMaterial({
        map: mTex, transparent: true, depthWrite: false
      });
      var mSp = new THREE.Sprite(mMat);
      mSp.position.set(0, -(cardH * 0.5 + 0.08), 0);
      mSp.scale.set(0.4, 0.12, 1);
      mSp.userData.isModeLabel = true;
      group.add(mSp);
    }

    // Store data
    var cObj = new THREE.Color(hexColor);
    var hsl = {};
    cObj.getHSL(hsl);
    group.userData = {
      mesh: sprite, glow: gSprite, color: cObj,
      nodeType: node.type, nodeId: node.id,
      baseScale: cardW, baseHue: hsl.h,
      cardW: cardW, cardH: cardH,
      hexColor: hexColor
    };
    if (node.type === 'map') group.userData.bluePortVisible = false;

    this.nodeObjects.set(node.id, group);
    this.scene.add(group);
  }

  _createEdge(edge) {
    var THREE = this.THREE;
    var src = this.nodeObjects.get(edge.sourceId);
    var tgt = this.nodeObjects.get(edge.targetId);
    if (!src || !tgt) return;

    var p1 = src.position, p2 = tgt.position;
    var mid = { x: (p1.x+p2.x)/2, y: (p1.y+p2.y)/2, z: (p1.z+p2.z)/2 };
    var ctrl = { x: mid.x + (Math.random()-0.5)*0.5, y: mid.y + (Math.random()-0.5)*0.5, z: mid.z + (Math.random()-0.5)*0.5 };

    var curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      new THREE.Vector3(ctrl.x, ctrl.y, ctrl.z),
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );
    var pts = curve.getPoints(16);
    var positions = [];
    pts.forEach(function(p) { positions.push(p.x, p.y, p.z); });

    var col = 0xb080ff;
    // Glow
    var gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var gMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.08 });
    this.scene.add(new THREE.Line(gGeo, gMat));

    // Main
    var mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.3 });
    var main = new THREE.Line(mGeo, mMat);
    this.scene.add(main);
    this.edgeLines.set(edge.id, main);

    // Signal particle
    var pCanvas = document.createElement('canvas');
    pCanvas.width = 12; pCanvas.height = 12;
    var pctx = pCanvas.getContext('2d');
    pctx.beginPath(); pctx.arc(6, 6, 4, 0, Math.PI*2);
    pctx.fillStyle = 'rgba(255,255,255,0.9)'; pctx.fill();
    var pTex = new THREE.CanvasTexture(pCanvas);
    var pMat = new THREE.SpriteMaterial({
      map: pTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    });
    var pSp = new THREE.Sprite(pMat);
    pSp.scale.set(0.08, 0.08, 1);
    pSp.userData.edgeId = edge.id;
    pSp.userData.progress = Math.random();
    pSp.userData.speed = 0.3 + Math.random() * 0.2;
    pSp.userData.curve = curve;
    this.scene.add(pSp);
    if (!this.signalParticles) this.signalParticles = [];
    this.signalParticles.push(pSp);
  }

  addNode(node) {
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this.rebuild();
  }

  removeNode(nodeId) {
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this.rebuild();
  }

  refreshEdges() {
    if (!this.initialized) { this._pendingRefresh = true; return; }
    this.rebuild();
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) this.controls.autoRotate = this.autoRotate;
  }

  _toggleMapBluePort(node) {
    var obj = this.nodeObjects.get(node.id);
    if (!obj || !obj.userData.bluePort) return;
    obj.userData.bluePortVisible = !obj.userData.bluePortVisible;
    obj.userData.bluePort.visible = obj.userData.bluePortVisible;
  }

  _onResize() {
    if (!this.renderer) return;
    var w = this.container.clientWidth;
    var h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
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
    var changed = e.changedTouches[0];
    if (!changed) return;
    var dx = changed.clientX - this.touchStartPos.x;
    var dy = changed.clientY - this.touchStartPos.y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    var dt = Date.now() - this.touchStartTime;
    if (dt < 250 && dist < 15) {
      this._handleTap(changed.clientX, changed.clientY);
      this._touchHandledClick = true;
    }
    if (dist > 5) this.isTouchDragging = true;
  }

  _onClick(e) {
    if (this._touchHandledClick) { this._touchHandledClick = false; return; }
    this._handleTap(e.clientX, e.clientY);
  }

  _handleTap(cx, cy) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    var hits = this.raycaster.intersectObjects(this.nodeMeshes);
    if (hits.length > 0) {
      var nodeId = hits[0].object.userData.nodeId;
      if (nodeId !== undefined) this._selectNode(nodeId);
      return;
    }
    this._deselectNode();
  }

  _selectNode(nodeId) {
    if (this.selectedNode && this.selectedNode.id !== nodeId) {
      this._deselectNode();
    } else if (this.selectedNode && this.selectedNode.id === nodeId) {
      if (this.selectedNode.type === 'map') this._toggleMapBluePort(this.selectedNode);
      if (this.eventBus && this.eventBus.emit) this.eventBus.emit('nodeSelect', this.selectedNode);
      return;
    }
    var node = this.graph.getNode(nodeId);
    if (!node) return;
    this.selectedNode = node;
    var obj = this.nodeObjects.get(nodeId);
    if (obj) {
      var card = obj.userData.mesh;
      if (card) {
        card.scale.set(obj.userData.cardW * 1.3, obj.userData.cardH * 1.3, 1);
        card.material.opacity = 1.0;
      }
      var glow = obj.userData.glow;
      if (glow) {
        glow.scale.set(obj.userData.cardW * 2.8, obj.userData.cardH * 2.8, 1);
        glow.material.opacity = 1.0;
      }
    }
    if (this.eventBus && this.eventBus.emit) this.eventBus.emit('nodeSelect', node);
  }

  _deselectNode() {
    if (!this.selectedNode) return;
    var obj = this.nodeObjects.get(this.selectedNode.id);
    if (obj) {
      var card = obj.userData.mesh;
      if (card) {
        card.scale.set(obj.userData.cardW, obj.userData.cardH, 1);
        card.material.opacity = 1.0;
      }
      var glow = obj.userData.glow;
      if (glow) {
        glow.scale.set(obj.userData.cardW * 2.2, obj.userData.cardH * 2.2, 1);
        glow.material.opacity = 0.5;
      }
    }
    this.selectedNode = null;
    if (this.eventBus && this.eventBus.emit) this.eventBus.emit('nodeDeselect');
  }

  _animateFrame() {
    this.animFrame = requestAnimationFrame(this._animate);
    if (this.controls) this.controls.update();

    var time = Date.now() * 0.001;
    var THREE = this.THREE;

    if (this.starField) this.starField.rotation.y += 0.00008;
    if (this.nebula) { this.nebula.rotation.y += 0.00012; this.nebula.rotation.x += 0.00004; }

    var cameraPos = this.camera ? this.camera.position : null;

    for (var [id, obj] of this.nodeObjects) {
      var card = obj.userData.mesh;
      if (card) {
        var pulse = 0.97 + Math.sin(time * 0.6 + id * 1.3) * 0.03;
        card.scale.x = obj.userData.cardW * pulse;
        card.scale.y = obj.userData.cardH * pulse;

        var glow = obj.userData.glow;
        if (glow) {
          glow.material.opacity = 0.3 + Math.sin(time * 0.5 + id * 0.7) * 0.2;
        }

        // Proximity columns for Group/Output
        if (cameraPos && (obj.userData.nodeType === 'group' || obj.userData.nodeType === 'output')) {
          var dx = cameraPos.x - obj.position.x;
          var dy = cameraPos.y - obj.position.y;
          var dz = cameraPos.z - obj.position.z;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          var prox = Math.max(0, 1 - (dist - 3) / 7);

          obj.children.forEach(function(ch) {
            if (ch.userData && ch.userData.isColumn && ch.isSprite) {
              var exp = 0.3 + prox * 0.7;
              ch.scale.x += (0.12 * exp - ch.scale.x) * 0.05;
              ch.scale.y += (0.35 * exp - ch.scale.y) * 0.05;
              ch.material.opacity = 0.2 + prox * 0.6;
            }
          });
        }
      }
    }

    // Pulse edges
    for (var [id, line] of this.edgeLines) {
      line.material.opacity = 0.2 + Math.sin(time * 1.2 + id * 0.5) * 0.1;
    }
    // Signal particles
    if (this.signalParticles) {
      for (var p of this.signalParticles) {
        p.userData.progress += 0.008 * p.userData.speed;
        if (p.userData.progress > 1) p.userData.progress = 0;
        var pt = p.userData.curve.getPoint(p.userData.progress);
        p.position.set(pt.x, pt.y, pt.z);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.removeEventListener('resize', this._boundResize);
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}
