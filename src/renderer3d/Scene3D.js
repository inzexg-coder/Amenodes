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
    // Wait for THREE and OrbitControls to be loaded via script tags
    while (!window.THREE || typeof window.THREE.OrbitControls === 'undefined') {
      await new Promise(r => setTimeout(r, 100));
      // Safety break after 10 seconds
      if (window._threeJSWaitCount > 100) break;
      window._threeJSWaitCount = (window._threeJSWaitCount || 0) + 1;
    }
    this.THREE = window.THREE;
    delete window._threeJSWaitCount;
  }

  
  // Fibonacci sphere for even distribution

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  _fibonacciSphere(index, total, radius) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const theta = Math.PI * (1 + Math.sqrt(5)) * (index + 0.5);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    return {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      x: radius * Math.sin(phi) * Math.cos(theta),

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      y: radius * Math.sin(phi) * Math.sin(theta),

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      z: radius * Math.cos(phi)

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    };

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  _getTypeColor(type) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const map = {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      number: 0x9060ff, constant: 0x8060ff, calc: 0xe040a0,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      mean: 0xd040b0, sem: 0xc040c0, output: 0x4090ff,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      map: 0x40d090, group: 0x30b080, interval: 0x80a0ff

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    };

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    return map[type] || 0x8060c0;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  _rebuildFromGraph() {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Clean up

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const obj of this.nodeObjects.values()) this.scene.remove(obj);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const l of this.edgeLines.values()) this.scene.remove(l);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const g of this.edgeGlows.values()) this.scene.remove(g);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.nodeObjects.clear();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.edgeLines.clear();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.edgeGlows.clear();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.nodeMeshes = [];

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const nodes = this.graph.nodes;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const edges = this.graph.edges;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const total = Math.max(nodes.length, 1);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const THREE = this.THREE;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Create neurons

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (let i = 0; i < nodes.length; i++) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const node = nodes[i];

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const pos = this._fibonacciSphere(i, total, this.sphereRadius);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this._createNeuron(node, pos);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Create edge connections

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const edge of edges) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this._createEdge(edge);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Update auto-rotate

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.controls) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this.controls.autoRotate = this.autoRotate;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  _createNeuron(node, position) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const THREE = this.THREE;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const group = new THREE.Object3D();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    group.position.set(position.x, position.y, position.z);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const color = this._getTypeColor(node.type);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Varied size based on type and importance

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const sizeMap = { number: 0.25, constant: 0.25, calc: 0.32, mean: 0.28, sem: 0.28, output: 0.3, map: 0.27, group: 0.3 };

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const size = (sizeMap[node.type] || 0.25) + (node.important ? 0.1 : 0);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const c = new THREE.Color(color);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // ===== Outer glow (large, soft) =====

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const canvas = document.createElement('canvas');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    canvas.width = 96;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    canvas.height = 96;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const ctx = canvas.getContext('2d');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const grad = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    grad.addColorStop(0, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},0.7)`);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    grad.addColorStop(0.25, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},0.3)`);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    grad.addColorStop(0.6, `rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},0.08)`);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    grad.addColorStop(1, 'rgba(0,0,0,0)');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    ctx.fillStyle = grad;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    ctx.fillRect(0, 0, 96, 96);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const tex = new THREE.CanvasTexture(canvas);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const haloMat = new THREE.SpriteMaterial({

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const halo = new THREE.Sprite(haloMat);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    halo.scale.set(1.8, 1.8, 1);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    group.add(halo);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // ===== Core sphere with stronger glow =====

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const sphereGeo = new THREE.SphereGeometry(size, 16, 16);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const sphereMat = new THREE.MeshPhongMaterial({

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      color: color,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      emissive: color,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      emissiveIntensity: 0.5,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      shininess: 60,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      specular: new THREE.Color(0x444466)

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    sphere.userData.nodeId = node.id;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    group.add(sphere);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.nodeMeshes.push(sphere);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // ===== Glow rings (rotating) =====

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (let i = 0; i < 2; i++) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const ringGeo = new THREE.RingGeometry(size*1.6 + i*0.2, size*2.4 + i*0.3, 20);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const ringMat = new THREE.MeshBasicMaterial({

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        color: color, transparent: true, opacity: 0.12 + i * 0.06,

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const ring = new THREE.Mesh(ringGeo, ringMat);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      ring.rotation.x = Math.PI / 2 + i * 0.4 + (node.id * 0.1);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      ring.rotation.y = i * 0.5 + (node.id * 0.07);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      ring.userData.ringIdx = i;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      group.add(ring);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // ===== Important node extra glow =====

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (node.important) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const imp = halo.clone();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      imp.scale.set(2.8, 2.8, 1);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      imp.material = haloMat.clone();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      imp.material.opacity = 0.35;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      group.add(imp);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      // Additional bright ring for important nodes

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const iRing = new THREE.Mesh(

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        new THREE.RingGeometry(size*2, size*2.8, 24),

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        new THREE.MeshBasicMaterial({ color: 0x40aaff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      );

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      iRing.rotation.x = Math.PI / 2.5;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      group.add(iRing);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // ===== Label (always visible with type + value) =====

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const labelTitle = node.title || node.type || 'Node';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const labelType = node.type || '';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const lCanvas = document.createElement('canvas');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lCanvas.width = 512;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lCanvas.height = 180;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const lctx = lCanvas.getContext('2d');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Type dot

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.beginPath();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.arc(70, 90, 18, 0, Math.PI * 2);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.fillStyle = '#' + c.getHexString();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.shadowColor = '#' + c.getHexString();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.shadowBlur = 25;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.fill();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.shadowBlur = 0;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Type name

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.font = 'bold 20px monospace';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.textAlign = 'left';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.textBaseline = 'middle';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.fillStyle = '#ffffff';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.fillText(labelType.toUpperCase(), 105, 48);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Title

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.font = 'bold 32px monospace';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.fillStyle = '#e0d0ff';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.shadowColor = 'rgba(0,0,0,0.8)';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.shadowBlur = 6;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const displayTitle = labelTitle.length > 16 ? labelTitle.slice(0, 14) + '..' : labelTitle;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    lctx.fillText(displayTitle, 105, 98);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Value preview

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    try {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const val = node.getValue();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      if (val && val.length > 0) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        const valStr = val.map(function(x) { return typeof x === 'number' ? x.toFixed(2) : x; }).join(', ');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        const displayVal = valStr.length > 20 ? valStr.slice(0, 18) + '..' : valStr;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        lctx.font = '18px monospace';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        lctx.fillStyle = 'rgba(180,160,240,0.4)';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        lctx.fillText('= ' + displayVal, 105, 142);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    } catch(e) {}

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const lTex = new THREE.CanvasTexture(lCanvas);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const lMat = new THREE.SpriteMaterial({

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      map: lTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.9

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const label = new THREE.Sprite(lMat);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    label.position.y = -(size + 0.9);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    label.scale.set(2.8, 0.95, 1);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    label.visible = true;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    group.add(label); = { mesh: sphere, label, color: c, nodeType: node.type, nodeId: node.id };

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.nodeObjects.set(node.id, group);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.scene.add(group);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  _createEdge(edge) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const THREE = this.THREE;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const src = this.nodeObjects.get(edge.sourceId);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const tgt = this.nodeObjects.get(edge.targetId);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (!src || !tgt) return;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const p1 = src.position, p2 = tgt.position;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const arr = [p1.x, p1.y, p1.z, p2.x, p2.y, p2.z];

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const isBlue = edge.sourcePort === 'unmapped';

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const col = isBlue ? 0x4488ff : 0xb080ff;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Glow line

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const gGeo = new THREE.BufferGeometry();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const gMat = new THREE.LineBasicMaterial({

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      color: col, transparent: true, opacity: 0.12

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const glow = new THREE.Line(gGeo, gMat);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.scene.add(glow);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.edgeGlows.set(edge.id, glow);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Main line

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const mGeo = new THREE.BufferGeometry();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    mGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const mMat = new THREE.LineBasicMaterial({

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      color: col, transparent: true, opacity: 0.4

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const main = new THREE.Line(mGeo, mMat);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.scene.add(main);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.edgeLines.set(edge.id, main);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  addNode(node) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (!this.initialized) return;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this._rebuildFromGraph();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  removeNode(nodeId) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (!this.initialized) return;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this._rebuildFromGraph();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  refreshEdges() {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (!this.initialized) return;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this._rebuildFromGraph();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  refresh() {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (!this.initialized) return;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this._rebuildFromGraph();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  toggleAutoRotate() {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.autoRotate = !this.autoRotate;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.controls) this.controls.autoRotate = this.autoRotate;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  _animateFrame() {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.animFrame = requestAnimationFrame(this._animate);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.controls) this.controls.update();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const time = Date.now() * 0.001;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    const THREE = this.THREE;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Stars slowly rotate

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.starField) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this.starField.rotation.y += 0.00008;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Pulse neurons

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const [id, obj] of this.nodeObjects) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const mesh = obj.userData.mesh;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      if (mesh && mesh.scale.x < 1.1) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        const pulse = 1 + Math.sin(time * 2 + id * 0.7) * 0.04;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        mesh.scale.set(pulse, pulse, pulse);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      // Pulse rings

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      const rings = obj.children.filter(c => c.isMesh && c.geometry.type === 'RingGeometry');

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      rings.forEach((r, i) => {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        r.rotation.z = time * (0.3 + i * 0.1);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        r.material.opacity = 0.1 + Math.sin(time * 1.5 + id + i) * 0.05;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      });

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    // Pulse edges

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const [id, line] of this.edgeLines) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      line.material.opacity = 0.3 + Math.sin(time * 1.5 + id * 0.5) * 0.15;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    for (const [id, glow] of this.edgeGlows) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      glow.material.opacity = 0.1 + Math.sin(time * 1.2 + id * 0.3) * 0.05;

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    this.renderer.render(this.scene, this.camera);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;


      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  destroy() {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    window.removeEventListener('resize', this._boundResize);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.renderer && this.renderer.domElement) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this.renderer.domElement.removeEventListener('touchstart', this._boundTouchStart);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this.renderer.domElement.removeEventListener('touchend', this._boundTouchEnd);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this.renderer.domElement.removeEventListener('click', this._boundClick);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    if (this.renderer) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      this.renderer.dispose();

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
      }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
    }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
  }

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
}

      await new Promise(r => setTimeout(r, 100));
    }
    this.THREE = window.THREE;
