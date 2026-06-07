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
    // Consistent neon palette: purple-magenta-cyan range
    var map = {
      number: '#b080ff', constant: '#a070f0', calc: '#c070e0',
      mean: '#b060d0', sem: '#a060e0', output: '#7090ff',
      map: '#50a0ff', group: '#60b0f0'
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

  _makeCardTexture(node, hexColor, editMode) {
    var c = document.createElement('canvas');
    c.width = 400; c.height = editMode ? 340 : 220;
    var ctx = c.getContext('2d');
    var w = 400, h = c.height, r = 12;

    var cr = parseInt(hexColor.slice(1,3),16);
    var cg = parseInt(hexColor.slice(3,5),16);
    var cb = parseInt(hexColor.slice(5,7),16);

    // Strong shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 6;
    
    // Card body - dark but distinguishable from background
    ctx.fillStyle = 'rgba(14,10,30,0.98)';
    this._drawRoundedRect(ctx, 0, 0, w, h, r);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header with stronger color tint
    ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.12)';
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, 40); ctx.lineTo(0, 40);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Header divider
    ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.25)';
    ctx.fillRect(0, 39, w, 1);

    // Bright border for visibility
    ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.5)';
    ctx.lineWidth = 1.5;
    this._drawRoundedRect(ctx, 0, 0, w, h, r);
    ctx.stroke();

    // Type label as text (no icons)
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hexColor;
    var typeLabel = node.type.toUpperCase();
    ctx.fillText(typeLabel, 14, 20);

    // Title
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8e0ff';
    var ttl = (node.title || node.type || 'Node').slice(0, 18);
    ctx.fillText(ttl, 14 + typeLabel.length * 8 + 8, 20);

    // Value display
    var valStr = '\u2014';
    try {
      var v = node.getValue();
      if (v && v.length > 0) {
        valStr = v.map(function(x) { return typeof x === 'number' ? x.toFixed(4) : x; }).join(', ').slice(0, 30);
      }
    } catch(e) {}

    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(200,190,255,0.6)';
    ctx.fillText('= ' + valStr, 14, 50);

    if (editMode) {
      // Action buttons
      var yBtn = 90;
      var btnW = w - 24;
      var btnH = 34;
      
      if (node.type === 'number' || node.type === 'constant') {
        ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.1)';
        this._drawRoundedRect(ctx, 12, yBtn, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.3)';
        ctx.stroke();
        ctx.font = '13px monospace';
        ctx.fillStyle = 'rgba(220,200,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EDIT VALUE: ' + valStr.slice(0, 12), w/2, yBtn + 17);
      }
      if (node.type === 'group') {
        ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.1)';
        this._drawRoundedRect(ctx, 12, yBtn, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.3)';
        ctx.stroke();
        ctx.font = '13px monospace';
        ctx.fillStyle = 'rgba(220,200,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+ ADD ROW', w/2, yBtn + 17);
        
        if (node.values) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.font = '11px monospace';
          var ry = yBtn + 44;
          for (var ri = 0; ri < node.values.length && ri < 5; ri++) {
            ctx.fillStyle = 'rgba(200,180,255,0.5)';
            ctx.fillText((node.values[ri].name || 'v'+(ri+1)) + ': ' + node.values[ri].val, 20, ry);
            ry += 18;
          }
        }
      }
      if (node.type === 'output' || node.type === 'map') {
        ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.1)';
        this._drawRoundedRect(ctx, 12, yBtn, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.3)';
        ctx.stroke();
        ctx.font = '13px monospace';
        ctx.fillStyle = 'rgba(220,200,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+ ADD ROW', w/2, yBtn + 17);
        
        // Map: show blue port status
        if (node.type === 'map') {
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(68,136,255,0.6)';
          ctx.fillText('DOUBLE-TAP: TOGGLE BLUE PORT', w/2, yBtn + 44);
        }
        if (node.type === 'map' && node.unmappedMode === 'blue') {
          ctx.fillStyle = 'rgba(68,136,255,0.15)';
          this._drawRoundedRect(ctx, 12, yBtn + 54, btnW, 22, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(68,136,255,0.4)';
          ctx.stroke();
          ctx.font = '11px monospace';
          ctx.fillStyle = 'rgba(68,136,255,0.8)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BLUE PORT ACTIVE', w/2, yBtn + 65);
        }
      }
      if (node.type === 'calc') {
        var opLabel = (node.operation || 'div3').toUpperCase();
        ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.1)';
        this._drawRoundedRect(ctx, 12, yBtn, btnW, btnH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.3)';
        ctx.stroke();
        ctx.font = '13px monospace';
        ctx.fillStyle = 'rgba(220,200,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MODE: ' + opLabel, w/2, yBtn + 17);
        
        // Show operation description
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(200,180,255,0.4)';
        ctx.textAlign = 'center';
        var descs = { div3:'Divide by 3', div_sqrt12:'Divide by sqrt(12)', sqrt_sum_sq:'Sqrt of sum of squares', quadratic_sum:'Quadratic sum', multiply_by_constant:'Multiply by constant' };
        ctx.fillText(descs[node.operation] || node.operation, w/2, yBtn + 46);
      }
      if (node.type === 'mean' || node.type === 'sem') {
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(200,180,255,0.4)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Receives input from connected nodes', 14, yBtn);
        var inp = this.graph ? this.graph.getIncomingEdges(node.id) : [];
        ctx.fillText('Inputs: ' + (inp ? inp.length : 0), 14, yBtn + 22);
      }
      
      // Bottom hint
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(200,180,255,0.2)';
      ctx.textAlign = 'center';
      ctx.fillText('tap action to execute, tap outside to close', w/2, h - 10);
    } else {
      // Normal mode: compact card with value
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(200,190,255,0.5)';
      ctx.fillText('= ' + valStr, 14, 50);
      
      // Subtle bottom line
      ctx.fillStyle = 'rgba('+cr+','+cg+','+cb+',0.15)';
      ctx.fillRect(14, h - 2, w - 28, 1);
    }

    // Important indicator
    if (node.important && !editMode) {
      ctx.shadowColor = hexColor;
      ctx.shadowBlur = 30;
      ctx.strokeStyle = 'rgba('+cr+','+cg+','+cb+',0.6)';
      ctx.lineWidth = 2;
      this._drawRoundedRect(ctx, 1, 1, w-2, h-2, r-1);
      ctx.stroke();
    }

    return c;
  }

  _createCard(node, pos) {
    var THREE = this.THREE;
    var group = new THREE.Object3D();
    group.position.set(pos.x, pos.y, pos.z);

    var hexColor = this._getCardColor(node.type);
    var cardW = 2.0;
    var cardH = cardW * 0.6;
    
    var texCanvas = this._makeCardTexture(node, hexColor, false);
    var tex = new THREE.CanvasTexture(texCanvas);
    tex.needsUpdate = true;

    var mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(cardW, cardH, 1);
    sprite.userData.nodeId = node.id;
    sprite.userData.editMode = false;
    group.add(sprite);
    this.nodeMeshes.push(sprite);



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
          cSp.position.set((idx - span) * 0.4, -(cardH * 0.5 - 0.2), 0.01);
          cSp.scale.set(0.15, 0.40, 1);
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
      mesh: sprite, color: cObj,
      nodeType: node.type, nodeId: node.id,
      baseScale: cardW, baseHue: hsl.h,
      cardW: cardW, cardH: cardH,
      cardTexCanvas: texCanvas, cardTexture: tex,
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
    var dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
    var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    // Control point offset for organic curve
    var perpX = -dy * 0.15, perpY = dx * 0.15;
    var ctrl = {
      x: (p1.x+p2.x)/2 + perpX + (Math.random()-0.5)*0.3,
      y: (p1.y+p2.y)/2 + perpY + (Math.random()-0.5)*0.3,
      z: (p1.z+p2.z)/2 + (Math.random()-0.5)*0.3
    };

    var curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      new THREE.Vector3(ctrl.x, ctrl.y, ctrl.z),
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );
    var nPts = Math.max(12, Math.floor(dist * 3));
    var pts = curve.getPoints(nPts);
    var positions = [];
    pts.forEach(function(p) { positions.push(p.x, p.y, p.z); });

    // Get source node color for edge coloring
    var srcObj = this.nodeObjects.get(edge.sourceId);
    var col = 0x8866cc;
    if (srcObj && srcObj.userData && srcObj.userData.color) {
      var sc = srcObj.userData.color;
      col = sc.getHex();
    }
    
    // Outer glow (thick, very transparent)
    var gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var gMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.06 });
    var gLine = new THREE.Line(gGeo, gMat);
    gLine.scale.set(1, 1, 1);
    this.scene.add(gLine);
    this.edgeGlows.set(edge.id, gLine);

    // Middle glow
    var mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.12 });
    this.scene.add(new THREE.Line(mGeo, mMat));

    // Core line (thin, bright)
    var cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var cMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.35 });
    var main = new THREE.Line(cGeo, cMat);
    this.scene.add(main);
    this.edgeLines.set(edge.id, main);

    // Signal particle
    var pCanvas = document.createElement('canvas');
    pCanvas.width = 16; pCanvas.height = 16;
    var pctx = pCanvas.getContext('2d');
    var pGrad = pctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255,255,255,1)');
    pGrad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    pGrad.addColorStop(1, 'rgba(255,255,255,0)');
    pctx.fillStyle = pGrad;
    pctx.fillRect(0, 0, 16, 16);
    var pTex = new THREE.CanvasTexture(pCanvas);
    var pMat = new THREE.SpriteMaterial({
      map: pTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    });
    var pSp = new THREE.Sprite(pMat);
    pSp.scale.set(0.12, 0.12, 1);
    pSp.userData.edgeId = edge.id;
    pSp.userData.progress = Math.random();
    pSp.userData.speed = 0.2 + Math.random() * 0.15;
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
    // Toggle both visual and data state
    node.unmappedMode = (node.unmappedMode === 'blue') ? 'normal' : 'blue';
    obj.userData.bluePortVisible = (node.unmappedMode === 'blue');
    obj.userData.bluePort.visible = obj.userData.bluePortVisible;
    this.graph.setDirty(true);
    if (this.eventBus) this.eventBus.emit('graphChanged');
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
      // Pause auto-rotation on node select
      if (this.controls) this.controls.autoRotate = false;
      return;
    }
    this._deselectNode();
    // Resume auto-rotation on empty space click
    if (this.controls) this.controls.autoRotate = this.autoRotate;
  }

  _selectNode(nodeId) {
    if (this.selectedNode && this.selectedNode.id !== nodeId) {
      this._deselectNode();
    } else if (this.selectedNode && this.selectedNode.id === nodeId) {
      // Same node tapped again - handle edit actions
      this._handleNodeAction(this.selectedNode);
      return;
    }
    var node = this.graph.getNode(nodeId);
    if (!node) return;
    this.selectedNode = node;
    this._switchEditMode(node, true);
    if (this.eventBus && this.eventBus.emit) this.eventBus.emit('nodeSelect', node);
  }
  
  _switchEditMode(node, enable) {
    var obj = this.nodeObjects.get(node.id);
    if (!obj) return;
    var card = obj.userData.mesh;
    if (!card) return;
    var hexColor = obj.userData.hexColor;
    var texCanvas = this._makeCardTexture(node, hexColor, enable);
    var tex = new THREE.CanvasTexture(texCanvas);
    tex.needsUpdate = true;
    card.material.map = tex;
    card.material.needsUpdate = true;
    card.material.opacity = 1.0;
    card.userData.editMode = enable;
    // Store for later updates
    obj.userData.cardTexCanvas = texCanvas;
    obj.userData.cardTexture = tex;
    if (enable) {
      card.scale.set(obj.userData.cardW * 1.5, obj.userData.cardW * 0.6 * 1.5 * (320/240), 1);
    } else {
      card.scale.set(obj.userData.cardW, obj.userData.cardW * 0.6, 1);
    }
  }
  
  _handleNodeAction(node) {
    var self = this;
    var obj = this.nodeObjects.get(node.id);
    if (!obj) return;
    var card = obj.userData.mesh;
    if (!card || !card.userData.editMode) return;
    
    // Map: double-tap toggles blue port
    if (node.type === 'map') {
      self._toggleMapBluePort(node);
      self._switchEditMode(node, true);
      return;
    }
    
    // Number/Constant: prompt for value change
    if (node.type === 'number' || node.type === 'constant') {
      var oldVal = node.value !== undefined ? node.value : 0;
      var newVal = prompt('Edit value (' + node.type + '):', oldVal);
      if (newVal !== null && newVal !== '') {
        node.value = parseFloat(newVal) || 0;
        this.graph.reevaluateAll();
        this.graph.setDirty(true);
        this._switchEditMode(node, true);
        if (this.eventBus) this.eventBus.emit('graphChanged');
      }
      return;
    }
    // Group: add row
    if (node.type === 'group') {
      if (!node.values) node.values = [];
      node.values.push({ val: 0, name: '' });
      this.graph.setDirty(true);
      this._switchEditMode(node, true);
      if (this.eventBus) this.eventBus.emit('graphChanged');
      return;
    }
    // Output: add row
    if (node.type === 'output') {
      if (!node.rows) node.rows = [];
      node.rows.push({ param: 'V' + (node.rows.length+1), value: '0' });
      this.graph.setDirty(true);
      this._switchEditMode(node, true);
      if (this.eventBus) this.eventBus.emit('graphChanged');
      return;
    }
    // Calc: cycle operation
    if (node.type === 'calc') {
      var ops = ['div3','div_sqrt12','sqrt_sum_sq','quadratic_sum','multiply_by_constant'];
      var idx = ops.indexOf(node.operation || 'div3');
      node.operation = ops[(idx + 1) % ops.length];
      this.graph.reevaluateAll();
      this.graph.setDirty(true);
      this._switchEditMode(node, true);
      if (this.eventBus) this.eventBus.emit('graphChanged');
      return;
    }
    // Mean/SEM: cycle operation if available
    if (node.type === 'mean' || node.type === 'sem') {
      this.graph.reevaluateAll();
      this._switchEditMode(node, true);
    }
  }

  _deselectNode() {
    if (!this.selectedNode) return;
    this._switchEditMode(this.selectedNode, false);
    var obj = this.nodeObjects.get(this.selectedNode.id);
    if (obj) {
      var glow = obj.userData.glow;
      if (glow) {
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
