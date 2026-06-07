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
    this.rotationSpeed = 0.004;
    this._wobbleAmplitude = 0.2;
    this._wobbleSpeed = 0.008;
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

    // Wait for container to have actual size
    let w = this.container.clientWidth;
    let h = this.container.clientHeight;
    if (w === 0 || h === 0) {
      // Try to find the container by waiting a bit and polling
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 100));
        w = this.container.clientWidth;
        h = this.container.clientHeight;
        if (w > 0 && h > 0) break;
      }
      if (w === 0) w = window.innerWidth;
      if (h === 0) h = window.innerHeight;
    }

    const aspect = w / h || 1;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 5000);
    this._updateCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w || 1, h || 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080610, 1);
    this.container.appendChild(this.renderer.domElement);

    // Handle WebGL context loss - recreate renderer
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL context lost, recreating...');
      setTimeout(() => this._recreateRenderer(), 100);
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
    });

    this.css2DRenderer = new THREE.CSS2DRenderer();
    this.css2DRenderer.setSize(w || 1, h || 1);
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

  _recreateRenderer() {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    const THREE = this.THREE;
    const w = this.container.clientWidth || window.innerWidth || 1;
    const h = this.container.clientHeight || window.innerHeight || 1;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x080610, 1);
    this.container.insertBefore(this.renderer.domElement, this.css2DRenderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      setTimeout(() => this._recreateRenderer(), 100);
    });
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
          this._injectCSS2DRenderer();
          resolve();
        };
        script.onerror = () => tryLoad();
        document.head.appendChild(script);
      };
      tryLoad();
    });
  }

  _injectCSS2DRenderer() {
    const THREE = window.THREE;
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
        const w = _domElement.clientWidth || window.innerWidth || 1;
        const h = _domElement.clientHeight || window.innerHeight || 1;
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
          const x = (_vector3.x * 0.5 + 0.5) * w;
          const y = (_vector3.y * -0.5 + 0.5) * h;
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
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 600 + Math.random() * 1800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      const brightness = 0.3 + Math.random() * 0.7;
      const tint = Math.random();
      if (tint < 0.3) {
        // Blue-white stars
        colors[i*3] = brightness * 0.8;
        colors[i*3+1] = brightness * 0.9;
        colors[i*3+2] = brightness;
      } else if (tint < 0.6) {
        // Yellow stars
        colors[i*3] = brightness;
        colors[i*3+1] = brightness * 0.9;
        colors[i*3+2] = brightness * 0.6;
      } else {
        // White/purple stars
        colors[i*3] = brightness;
        colors[i*3+1] = brightness * 0.85;
        colors[i*3+2] = brightness;
      }
      sizes[i] = 0.3 + Math.random() * 1.2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    this.scene.add(new THREE.Points(geo, mat));
    
    // Second layer of distant faint stars
    const geo2 = new THREE.BufferGeometry();
    const count2 = 2000;
    const pos2 = new Float32Array(count2 * 3);
    for (let i = 0; i < count2; i++) {
      const r = 2000 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos2[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos2[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos2[i*3+2] = r * Math.cos(phi);
    }
    geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    const mat2 = new THREE.PointsMaterial({
      color: 0x446688,
      size: 0.3,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.scene.add(new THREE.Points(geo2, mat2));
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
      this._wobbleTime += this._wobbleSpeed;
      const wobble = Math.sin(this._wobbleTime) * this._wobbleAmplitude;
      this._targetPhi += (Math.PI / 2 + wobble - this._targetPhi) * 0.003;
    }
    // Momentum decay after drag
    if (!this._isDragging && !this.autoRotate) {
      this._momentumX *= 0.99;
      this._momentumY *= 0.99;
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
    
    for (const [id, obj] of this.nodeObjects) {
      if (obj.css2d) {
        this.scene.remove(obj.css2d);
        if (obj.css2d.element && obj.css2d.element.parentNode) {
          obj.css2d.element.parentNode.removeChild(obj.css2d.element);
        }
      }
      if (obj.ring) this.scene.remove(obj.ring);
    }
    this.nodeObjects.clear();

    this.graph.nodes.forEach((node, idx) => {
      const pos = this._getNodePosition(idx);

      const el = node.createDOM(this.graph, this._createRendererProxy(node));
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.zIndex = '';

      const css2d = new THREE.CSS2DObject(el);
      css2d.position.set(pos.x, pos.y, pos.z);
      css2d.userData.nodeId = node.id;
      this.scene.add(css2d);

      // Selection ring
      const ringGeo = new THREE.RingGeometry(30, 38, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x88bbff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, pos.y, pos.z);
      ring.userData.nodeId = node.id;
      this.scene.add(ring);

      this.nodeObjects.set(node.id, { css2d, ring, el });
    });
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
        opacity: 0.25,
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
      this._momentumX = dx * 0.001;
      this._momentumY = dy * 0.001;
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
    
    // Update ring billboards
    for (const [id, obj] of this.nodeObjects) {
      if (obj.ring) {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        obj.ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
      }
    }
    
    // Animate edges with pulsing glow
    const edgePulse = 0.5 + 0.5 * Math.sin(time * 0.8);
    for (const [edgeId, line] of this.edgeLines) {
      if (typeof edgeId === 'string' && edgeId.startsWith('glow-')) {
        line.material.opacity = 0.1 + edgePulse * 0.25;
      } else if (typeof edgeId === 'number') {
        line.material.opacity = 0.3 + edgePulse * 0.4;
      }
    }
    
    this._autoRotateCamera();
    this._lerpCamera();
    this.renderer.render(this.scene, this.camera);
    this.css2DRenderer.render(this.scene, this.camera);
    this._animFrame = requestAnimationFrame(this._animate);
  }

  _onResize() {
    if (!this.initialized || !this.container) return;
    const w = this.container.clientWidth || window.innerWidth || 1;
    const h = this.container.clientHeight || window.innerHeight || 1;
    if (w === 0 || h === 0) return;
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
