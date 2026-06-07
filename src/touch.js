export class TouchControls {
  constructor(scene, app) {
    this.scene = scene;
    this.app = app;
    this.longPressTimer = null;
    this._moved = false;
    this._pinned = false;

    const el = scene.container;
    el.addEventListener('pointerdown', (e) => this._down(e));
    window.addEventListener('pointermove', (e) => this._move(e));
    window.addEventListener('pointerup', (e) => this._up(e));
    window.addEventListener('pointercancel', (e) => this._up(e));
    el.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
  }

  _down(e) {
    this._moved = false;
    this.scene.touchStart = { x: e.clientX, y: e.clientY, t: Date.now() };
    this.scene.prevPointer = { x: e.clientX, y: e.clientY };
    this.scene.autoRotate = false;

    // Check for node hit
    const nodeId = this.scene.getIntersection(e.clientX, e.clientY);
    if (nodeId !== null) {
      this.scene.selectNode(nodeId);
      this._pinned = true;
      // Long press for context menu
      this.longPressTimer = setTimeout(() => {
        if (!this._moved && this.app) {
          this.app.showContextMenu(nodeId);
        }
      }, 600);
      return;
    }

    // Check for handle hit (edge corner areas)
    // For now, all sprite edges can be start of a connection
    this.scene.selectNode(null);
    this._pinned = false;
    this.scene.isDragging = true;
  }

  _move(e) {
    const dx = e.clientX - this.scene.prevPointer.x;
    const dy = e.clientY - this.scene.prevPointer.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      this._moved = true;
      clearTimeout(this.longPressTimer);

      // If dragging from a pinned (selected) node, start edge drag
      if (this._pinned && this.scene.selectedNode != null && !this.scene.isDraggingEdge) {
        this.scene.startEdgeDrag(this.scene.selectedNode);
        this.scene._isDragging = false; // stop rotation
      }
    }

    if (this.scene.isDraggingEdge) {
      this.scene.updateEdgeDrag(e.clientX, e.clientY);
      return;
    }

    if (this.scene.isDragging && !this._pinned) {
      this.scene._targetTheta -= dx * 0.008;
      this.scene._targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1,
        this.scene._targetPhi + dy * 0.008));
      this.scene.momentum.x = dx * 0.001;
      this.scene.momentum.y = dy * 0.001;
    }

    this.scene.prevPointer = { x: e.clientX, y: e.clientY };
  }

  _up(e) {
    clearTimeout(this.longPressTimer);

    if (this.scene.isDraggingEdge) {
      const targetId = this.scene.getIntersection(e.clientX, e.clientY);
      const edge = this.scene.endEdgeDrag(targetId);
      if (edge && this.app) {
        this.app.onEdgeCreated(edge);
      } else if (this.app && targetId) {
        this.app.showToast('Cannot connect these nodes');
      }
      this._pinned = false;
      return;
    }

    // Short tap on empty space = deselect
    if (!this._moved && !this._pinned) {
      const dt = Date.now() - this.scene.touchStart.t;
      if (dt < 300) {
        const nodeId = this.scene.getIntersection(e.clientX, e.clientY);
        if (nodeId === null) {
          this.scene.selectNode(null);
          if (this.app) this.app.onNodeDeselected();
        }
      }
    }

    this.scene.isDragging = false;
    this._pinned = false;
    setTimeout(() => {
      if (!this.scene.isDragging && !this.scene.isDraggingEdge) {
        this.scene.autoRotate = true;
      }
    }, 3000);
  }

  _wheel(e) {
    e.preventDefault();
    this.scene._targetDist = Math.max(4, Math.min(30, this.scene._targetDist + e.deltaY * 0.02));
    this.scene.autoRotate = false;
    setTimeout(() => { if (!this.scene.isDragging) this.scene.autoRotate = true; }, 2000);
  }
}
