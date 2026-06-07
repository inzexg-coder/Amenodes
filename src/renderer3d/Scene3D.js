import { ContextMenu } from '../ui/ContextMenu.js';
import { modal } from '../ui/CustomModal.js';
import { t } from '../i18n/LanguageManager.js';
import { typeSystem } from '../core/DataType.js';

export class Scene3D {
  constructor(graph, container, eventBus) {
    this.graph = graph;
    this.container = container;
    this.eventBus = eventBus;
    this.nodeObjects = new Map();
    this.edgeLines = new Map();
    this.animFrame = null;
    this.autoRotate = true;
    this.rotationSpeed = 0.003;
    this.sphereRadius = 400;
    this.initialized = false;
    this.selectedNode = null;
    this.contextMenu = null;
    this.onNodeSelect = null;
    this.history = null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.css2DRenderer = null;
    this.raycaster = null;
    this.pointer = { x: 0, y: 0 };

    this._theta = 0;
    this._phi = Math.PI / 2;
    this._dist = 800;
    this._targetTheta = 0;
    this._targetPhi = Math.PI / 2;
    this._targetDist = 800;
    this._isDragging = false;
    this._prevPointer = { x: 0, y: 0 };

    this._touchStartTime = 0;
    this._touchStartPos = { x: 0, y: 0 };
    this._isPinching = false;
    this._pinchDist = 0;

    this._isDraggingEdge = false;
    this._edgeSourceId = null;
    this._edgeSourcePort = null;
    this._tempLine = null;

    this._wobbleTime = 0;
    this._wobbleAmount = 0.15;
    this._glowPulseTime = 0;
    this._edgePulseTime = 0;
    this._momentumX = 0;
    this._momentumY = 0;
    this._previousNodeIds = new Set();
    this._enteringNodes = new Map(); // nodeId -> { startPos, targetPos, progress }
    this._boundResize = () => this._onResize();
    this._boundPointerDown = (e) => this._onPointerDown(e);
    this._boundPointerMove = (e) => this._onPointerMove(e);
    this._boundPointerUp = (e) => this._onPointerUp(e);
    this._boundWheel = (e) => this._onWheel(e);
    this._animate = () => this._animateFrame();

    this.THREE = null;
  }

  async init() {
    await this._ensureThreeJS();
    const THREE = this.THREE;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080610);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 5000);
    this._updateCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080610, 1);
    this.container.appendChild(this.renderer.domElement);

    this.css2DRenderer = new THREE.CSS2DRenderer();
    this.css2DRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.css2DRenderer.domElement.style.position = 'absolute';
    this.css2DRenderer.domElement.style.top = '0';
    this.css2DRenderer.domElement.style.pointerEvents = 'none';
    this.css2DRenderer.domElement.style.zIndex = '10';
    this.container.appendChild(this.css2DRenderer.domElement);

    this.raycaster = new THREE.Raycaster();

    this.scene.add(new THREE.AmbientLight(0x404060, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    this._createStarField();

    window.addEventListener('resize', this._boundResize);

    this.initialized = true;
    this._startAnimation();
  }

  _ensureThreeJS() {
    if (window.THREE && window.THREE.Scene) {
      this.THREE = window.THREE;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const urls = [
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
        'https://unpkg.com/three@0.128.0/build/three.min.js'
      ];
      let tried = 0;
      const tryLoad = () => {
        if (tried >= urls.length) { reject(new Error('Failed to load Three.js')); return; }
        const script = document.createElement('script');
        script.src = urls[tried++];
        script.onload = () => {
          this.THREE = window.THREE;
          const css2dUrls = [
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/renderers/CSS2DRenderer.js',
            'https://unpkg.com/three@0.128.0/examples/js/renderers/CSS2DRenderer.js'
          ];
          let css2dTried = 0;
          const tryCSS2D = () => {
            if (css2dTried >= css2dUrls.length) {
              this._injectCSS2DRenderer();
              resolve();
              return;
            }
            const s = document.createElement('script');
            s.src = css2dUrls[css2dTried++];
            s.onload = () => resolve();
            s.onerror = () => tryCSS2D();
            document.head.appendChild(s);
          };
          tryCSS2D();
        };
        script.onerror = () => tryLoad();
        document.head.appendChild(script);
      };
      tryLoad();
    });
  }

  _injectCSS2DRenderer() {
    const THREE = window.THREE;
    if (THREE.CSS2DRenderer) return;
    THREE.CSS2DObject = function(element) {
      THREE.Object3D.call(this);
      this.element = element || document.createElement('div');
      this.element.style.position = 'absolute';
      this.element.style.pointerEvents = 'auto';
      this.addEventListener('removed', () => {
        if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
      });
    };
    THREE.CSS2DObject.prototype = Object.create(THREE.Object3D.prototype);
    THREE.CSS2DObject.prototype.constructor = THREE.CSS2DObject;
    Object.defineProperty(THREE.CSS2DObject.prototype, 'isCSS2DObject', { value: true });

    THREE.CSS2DRenderer = function() {
      const _domElement = document.createElement('div');
      _domElement.style.overflow = 'hidden';
      _domElement.style.pointerEvents = 'none';
      this.domElement = _domElement;
      const _vector3 = new THREE.Vector3();
      this.setSize = function(width, height) {
        _domElement.style.width = width + 'px';
        _domElement.style.height = height + 'px';
      };
      this.render = function(scene, camera) {
        const renderList = [];
        scene.traverseVisible(obj => {
          if (obj.isCSS2DObject) {
            renderList.push(obj);
          }
        });
        renderList.sort((a, b) => {
          const da = a.position.distanceToSquared(camera.position);
          const db = b.position.distanceToSquared(camera.position);
          return db - da;
        });
        renderList.forEach(obj => {
          const element = obj.element;
          _vector3.copy(obj.position).project(camera);
          const x = (_vector3.x * 0.5 + 0.5) * _domElement.clientWidth;
          const y = (_vector3.y * -0.5 + 0.5) * _domElement.clientHeight;
          element.style.transform = 'translate(-50%, -50%) translate(' + x + 'px,' + y + 'px)';
          element.style.display = _vector3.z < 1 ? '' : 'none';
          if (!element.parentNode) {
            _domElement.appendChild(element);
          }
        });
      };
    };
  }

  _createStarField() {
    const THREE = this.THREE;
    const geo = new THREE.BufferGeometry();
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 800 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      const c = 0.5 + Math.random() * 0.5;
      colors[i*3] = c;
      colors[i*3+1] = c;
      colors[i*3+2] = c + Math.random() * 0.2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.scene.add(new THREE.Points(geo, mat));
  }

  _fibonacciIndex = 0;
  _getNodePosition(index) {
    const n = index + 1;
    const phi = Math.acos(1 - 2 * n / (Math.max(this.graph.nodes.length, 1) + 50));
    const theta = Math.PI * (1 + Math.sqrt(5)) * n;
    return {
      x: this.sphereRadius * Math.sin(phi) * Math.cos(theta),
      y: this.sphereRadius * Math.sin(phi) * Math.sin(theta),
      z: this.sphereRadius * Math.cos(phi)
    };
  }

  _getSpherePosition(nodeId) {
    const idx = this.graph.nodes.findIndex(n => n.id === nodeId);
    if (idx === -1) return { x: 0, y: 0, z: 0 };
    return this._getNodePosition(idx);
  }

  _updateCamera() {
    const x = this._dist * Math.sin(this._phi) * Math.cos(this._theta);
    const y = this._dist * Math.cos(this._phi);
    const z = this._dist * Math.sin(this._phi) * Math.sin(this._theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  _lerpCamera() {
    this._theta += (this._targetTheta - this._theta) * 0.08;
    this._phi += (this._targetPhi - this._phi) * 0.08;
    this._dist += (this._targetDist - this._dist) * 0.08;
    this._updateCamera();
  }

  _autoRotateCamera() {
    if (this.autoRotate && !this._isDragging) {
      this._targetTheta += this.rotationSpeed;
      // Gentle wobble on phi for organic feel
      this._wobbleTime += 0.005;
      const wobble = Math.sin(this._wobbleTime) * this._wobbleAmount;
      this._targetPhi += (Math.PI / 2 + wobble - this._targetPhi) * 0.002;
    }
    // Momentum decay after drag
    if (!this._isDragging && !this.autoRotate) {
      this._momentumX *= 0.97;
      this._momentumY *= 0.97;
      this._targetTheta += this._momentumX;
      this._targetPhi += this._momentumY;
      if (Math.abs(this._momentumX) < 0.0001 && Math.abs(this._momentumY) < 0.0001) {
        this.autoRotate = true;
      }
    }
  }

  render() {
    if (!this.initialized) return;
    this._rebuildNodes();
    this._rebuildEdges();
  }

  save() {
    if (this.history) this.history.save();
  }

  setHistory(history) {
    this.history = history;
    // Expose publicly for NodeMenu etc.
    this.history = history;
  }

  _rebuildNodes() {
    const THREE = this.THREE;
    
    // Track current node IDs to detect new nodes
    const currentNodeIds = new Set(this.graph.nodes.map(n => n.id));
    
    for (const [id, obj] of this.nodeObjects) {
      if (obj.css2d) {
        this.scene.remove(obj.css2d);
        if (obj.css2d.element && obj.css2d.element.parentNode) {
          obj.css2d.element.parentNode.removeChild(obj.css2d.element);
        }
      }
      if (obj.mesh) this.scene.remove(obj.mesh);
      if (obj.ring) this.scene.remove(obj.ring);
      if (obj.glow) this.scene.remove(obj.glow);
    }
    this.nodeObjects.clear();

    // Clear entering nodes that no longer exist
    for (const id of this._enteringNodes.keys()) {
      if (!currentNodeIds.has(id)) this._enteringNodes.delete(id);
    }

    this.graph.nodes.forEach((node, idx) => {
      const pos = this._getNodePosition(idx);

      const el = node.createDOM(this.graph, this._createRendererProxy(node));
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.zIndex = '';

      // Add neon border glow class
      el.classList.add('node-3d');

      const css2d = new THREE.CSS2DObject(el);
      
      // Check if this is a new node (not in previous frame)
      const isNew = !this._previousNodeIds.has(node.id) && this._previousNodeIds.size > 0;
      
      if (isNew) {
        // Start from camera position (in front of viewer)
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const startPos = new THREE.Vector3(
          this.camera.position.x + camDir.x * 100,
          this.camera.position.y + camDir.y * 100,
          this.camera.position.z + camDir.z * 100
        );
        css2d.position.copy(startPos);
        this._enteringNodes.set(node.id, {
          startPos: startPos.clone(),
          targetPos: new THREE.Vector3(pos.x, pos.y, pos.z),
          progress: 0
        });
        // Start with invisible node, fade in
        el.style.opacity = '0';
        el.style.transform = 'scale(0.5)';
      } else {
        css2d.position.set(pos.x, pos.y, pos.z);
      }
      
      css2d.userData.nodeId = node.id;
      this.scene.add(css2d);

      const ringGeo = new THREE.RingGeometry(28, 32, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x6688ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, pos.y, pos.z);
      ring.userData.nodeId = node.id;
      this.scene.add(ring);

      const glowMap = this._createGlowTexture();
      const glowColor = node.important ? 0xff8844 : 0x6688ff;
      const glowMat = new THREE.SpriteMaterial({
        map: glowMap,
        color: glowColor,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.4
      });
      const glow = new THREE.Sprite(glowMat);
      glow.position.set(pos.x, pos.y, pos.z);
      glow.scale.set(80, 80, 1);
      glow.userData.nodeId = node.id;
      this.scene.add(glow);

      this.nodeObjects.set(node.id, { css2d, ring, glow, el });
    });

    this._previousNodeIds = currentNodeIds;
  }

  _createRendererProxy(node) {
    const self = this;
    return {
      addHandles: (container, nodeId, unmappedPort) => {
        self._add3DHandles(container, nodeId, unmappedPort);
      },
      applyOptStyles: () => {},
      render: () => { self.render(); },
      save: () => { self.save(); },
      invalidateCache: () => {},
      getNodeHeight: () => 80,
      heightCache: new Map(),
      elementCache: new Map(),
      onNodeSelect: null,
      _rendererProxy: true
    };
  }

  _add3DHandles(container, nodeId, unmappedPort) {
    const existing = container.querySelectorAll('.node-handle');
    existing.forEach(h => h.remove());

    const positions = ['top', 'right', 'bottom', 'left'];
    for (const p of positions) {
      const dot = document.createElement('div');
      dot.className = 'node-handle handle-' + p;
      dot.setAttribute('data-source-id', nodeId);
      dot.setAttribute('data-port', 'main');
      dot.addEventListener('pointerdown', (e) => this._onHandleDown(e, nodeId, 'main'));
      container.appendChild(dot);
    }
    if (unmappedPort === 'unmapped') {
      const blueHandle = document.createElement('div');
      blueHandle.className = 'node-handle handle-right node-handle-blue';
      blueHandle.style.right = '-7px';
      blueHandle.style.top = 'calc(50% + 20px)';
      blueHandle.setAttribute('data-source-id', nodeId);
      blueHandle.setAttribute('data-port', 'unmapped');
      blueHandle.addEventListener('pointerdown', (e) => this._onHandleDown(e, nodeId, 'unmapped'));
      container.appendChild(blueHandle);
    }
  }

  _onHandleDown(event, sourceId, port) {
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const onMove = (e) => {
      if (!moved && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
        moved = true;
        this._startEdgeDrag(sourceId, port);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!moved) this.showMenu(startX, startY, sourceId);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _startEdgeDrag(sourceId, port) {
    this._isDraggingEdge = true;
    this._edgeSourceId = sourceId;
    this._edgeSourcePort = port;
    document.body.style.cursor = 'crosshair';
  }

  _finishEdgeDrag(targetId) {
    if (!this._isDraggingEdge) return;
    if (targetId && targetId !== this._edgeSourceId) {
      const edge = this.graph.addEdge(this._edgeSourceId, targetId, this._edgeSourcePort);
      if (edge) {
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        this.render();
        this.save();
        if (this.graph && this.graph.setDirty) this.graph.setDirty(true);
      }
    }
    this._isDraggingEdge = false;
    this._edgeSourceId = null;
    this._edgeSourcePort = null;
    document.body.style.cursor = '';
  }

  _rebuildEdges() {
    const THREE = this.THREE;
    for (const [id, obj] of this.edgeLines) {
      this.scene.remove(obj);
    }
    this.edgeLines.clear();

    this.graph.edges.forEach(edge => {
      const sourcePos = this._getSpherePosition(edge.sourceId);
      const targetPos = this._getSpherePosition(edge.targetId);

      const sx = sourcePos.x, sy = sourcePos.y, sz = sourcePos.z;
      const tx = targetPos.x, ty = targetPos.y, tz = targetPos.z;

      // Middle point pulled outward from sphere center for arc effect
      const mx = (sx + tx) / 2, my = (sy + ty) / 2, mz = (sz + tz) / 2;
      const ml = Math.sqrt(mx*mx + my*my + mz*mz);
      const pull = 1.3 + 0.3 * Math.sin(edge.id * 2.5);
      const cpx = ml > 0 ? mx / ml * this.sphereRadius * pull : 0;
      const cpy = ml > 0 ? my / ml * this.sphereRadius * pull : 0;
      const cpz = ml > 0 ? mz / ml * this.sphereRadius * pull : 0;

      // Multi-segment curve for organic look
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(sx, sy, sz),
        new THREE.Vector3(cpx, cpy, cpz),
        new THREE.Vector3(tx, ty, tz)
      );
      const points = curve.getPoints(30);
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      // Color based on node types
      const sourceNode = this.graph.getNode(edge.sourceId);
      const edgeColor = sourceNode && sourceNode.important ? 0xff8844 : 0x4488ff;

      // Main line with gradient-like color
      const mat = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.5
      });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.edgeLines.set(edge.id, line);

      // Outer glow tube
      const glowMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
      });
      const glowLine = new THREE.Line(geo.clone(), glowMat);
      glowLine.scale.set(1, 1, 1);
      this.scene.add(glowLine);
      this.edgeLines.set('glow-' + edge.id, glowLine);

      // Dotted particle trail along edge
      if (edge.id % 2 === 0) {
        const dotCount = 8;
        const dotPositions = [];
        for (let i = 0; i < dotCount; i++) {
          const t = (i + 1) / (dotCount + 1) + 0.05 * Math.sin(edge.id + i);
          const pt = curve.getPoint(t);
          dotPositions.push(pt.x, pt.y, pt.z);
        }
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
        const dotMat = new THREE.PointsMaterial({
          color: edgeColor,
          size: 3,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const dots = new THREE.Points(dotGeo, dotMat);
        this.scene.add(dots);
        this.edgeLines.set('dots-' + edge.id, dots);
      }
    });
  }

  _createGlowTexture() {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Bright multi-layer glow
    const grad1 = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad1.addColorStop(0, 'rgba(255,255,255,1)');
    grad1.addColorStop(0.1, 'rgba(200,200,255,0.9)');
    grad1.addColorStop(0.4, 'rgba(140,100,255,0.5)');
    grad1.addColorStop(0.7, 'rgba(80,40,200,0.2)');
    grad1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, 128, 128);
    
    return new THREE.CanvasTexture(canvas);
  }

  attachEvents() {
    const el = this.container;
    el.addEventListener('pointerdown', this._boundPointerDown);
    window.addEventListener('pointermove', this._boundPointerMove);
    window.addEventListener('pointerup', this._boundPointerUp);
    el.addEventListener('wheel', this._boundWheel, { passive: false });
  }

  _onPointerDown(event) {
    this._touchStartTime = Date.now();
    this._touchStartPos.x = event.clientX;
    this._touchStartPos.y = event.clientY;
    this._isDragging = false;
    this._prevPointer.x = event.clientX;
    this._prevPointer.y = event.clientY;

    const target = event.target;
    const nodeEl = target.closest('.node');
    if (nodeEl) {
      const nodeId = parseInt(nodeEl.getAttribute('data-id'));
      this._selectNode(nodeId);
      return;
    }
    this._isDragging = true;
  }

  _onPointerMove(event) {
    if (this._isDraggingEdge) return;
    if (this._isDragging) {
      const dx = event.clientX - this._prevPointer.x;
      const dy = event.clientY - this._prevPointer.y;
      this._targetTheta -= dx * 0.005;
      this._targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this._targetPhi + dy * 0.005));
      this._momentumX = dx * 0.0008;
      this._momentumY = dy * 0.0008;
      this._prevPointer.x = event.clientX;
      this._prevPointer.y = event.clientY;
      this.autoRotate = false;
    }
  }

  _onPointerUp(event) {
    if (this._isDraggingEdge) {
      const target = event.target.closest('.node');
      const targetId = target ? parseInt(target.getAttribute('data-id')) : null;
      this._finishEdgeDrag(targetId);
      return;
    }
    if (this._isDragging) {
      const dt = Date.now() - this._touchStartTime;
      const dist = Math.sqrt(
        Math.pow(event.clientX - this._touchStartPos.x, 2) +
        Math.pow(event.clientY - this._touchStartPos.y, 2)
      );
      if (dist < 10 && dt < 300) {
        this._selectNode(null);
      }
      this._isDragging = false;
      setTimeout(() => { if (!this._isDragging) this.autoRotate = true; }, 3000);
    }
  }

  _onWheel(event) {
    event.preventDefault();
    this._targetDist = Math.max(200, Math.min(2000, this._targetDist + event.deltaY * 0.5));
    this.autoRotate = false;
    setTimeout(() => { if (!this._isDragging) this.autoRotate = true; }, 3000);
  }

  _selectNode(nodeId) {
    if (this.selectedNode) {
      const oldObj = this.nodeObjects.get(this.selectedNode);
      if (oldObj && oldObj.ring) oldObj.ring.material.opacity = 0;
    }
    this.selectedNode = nodeId;
    if (nodeId) {
      const obj = this.nodeObjects.get(nodeId);
      if (obj && obj.ring) obj.ring.material.opacity = 0.6;
      if (this.onNodeSelect) this.onNodeSelect(this.graph.getNode(nodeId));
    } else {
      if (this.onNodeSelect) this.onNodeSelect(null);
    }
  }

  showMenu(x, y, sourceId) {
    if (!this.contextMenu) {
      this.contextMenu = new ContextMenu(this.graph, this, this.history, null);
    }
    this.contextMenu.show(x, y, sourceId);
    this._selectNode(sourceId);
  }

  closeMenu() {
    if (this.contextMenu) this.contextMenu.close();
  }

  onGlobalMove(e) {}
  onGlobalUp(e) {}
  onGlobalMoveEdge(e) {}
  onGlobalUpEdge(e) {}

  _startAnimation() {
    this._animFrame = requestAnimationFrame(this._animate);
  }

  _animateFrame() {
    if (!this.initialized) return;
    
    const time = Date.now() * 0.001;
    
    // Update node glow and effects
    for (const [id, obj] of this.nodeObjects) {
      if (obj.ring) {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        obj.ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
      }
      // Pulsing glow
      if (obj.glow) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.5 + id * 0.7);
        obj.glow.material.opacity = 0.15 + pulse * 0.35;
        const scale = 50 + pulse * 20;
        obj.glow.scale.set(scale, scale, 1);
      }
    }
    
    // Animate entering nodes (new nodes flying in)
    for (const [id, entry] of this._enteringNodes) {
      const obj = this.nodeObjects.get(id);
      if (!obj) continue;
      
      entry.progress = Math.min(1, entry.progress + 0.025);
      // Ease out cubic
      const t = 1 - Math.pow(1 - entry.progress, 3);
      
      // Interpolate position
      obj.css2d.position.lerpVectors(entry.startPos, entry.targetPos, t);
      
      // Fade in and scale up
      if (obj.el) {
        obj.el.style.opacity = Math.min(1, t * 2);
        obj.el.style.transform = 'scale(' + (0.5 + t * 0.5) + ')';
      }
      
      // Update ring and glow positions to follow
      if (obj.ring) obj.ring.position.copy(obj.css2d.position);
      if (obj.glow) obj.glow.position.copy(obj.css2d.position);
      
      // Remove when done
      if (entry.progress >= 1) {
        obj.el.style.opacity = '1';
        obj.el.style.transform = '';
        obj.ring.position.copy(entry.targetPos);
        obj.glow.position.copy(entry.targetPos);
        this._enteringNodes.delete(id);
      }
    }
    
    // Animate edges with pulsing glow
    const edgePulse = 0.5 + 0.5 * Math.sin(time * 0.8);
    for (const [edgeId, line] of this.edgeLines) {
      if (typeof edgeId === 'string' && edgeId.startsWith('glow-')) {
        line.material.opacity = 0.05 + edgePulse * 0.15;
      } else if (typeof edgeId === 'number') {
        line.material.opacity = 0.2 + edgePulse * 0.3;
      }
    }
    
    this._autoRotateCamera();
    this._lerpCamera();
    this.renderer.render(this.scene, this.camera);
    this.css2DRenderer.render(this.scene, this.camera);
    this._animFrame = requestAnimationFrame(this._animate);
  }

  _onResize() {
    if (!this.initialized) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.css2DRenderer.setSize(w, h);
  }

  dispose() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    window.removeEventListener('resize', this._boundResize);
    const el = this.container;
    el.removeEventListener('pointerdown', this._boundPointerDown);
    window.removeEventListener('pointermove', this._boundPointerMove);
    window.removeEventListener('pointerup', this._boundPointerUp);
    el.removeEventListener('wheel', this._boundWheel);
  }
}
