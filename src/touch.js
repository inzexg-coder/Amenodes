// ─── Touch Controls ──────────────────────────────────────────
// Interaction modes:
// - Tap on node → select, show edit sheet
// - Tap on empty space → deselect
// - Drag from selected node → create edge
// - Drag from empty space → rotate sphere
// - Long press on node → context menu
// - Pinch / wheel → zoom

export class TouchControls {
  constructor(scene, app) {
    this.scene = scene;
    this.app = app;
    this.longPressTimer = null;
    this._moved = false;

    this._pointerId = null;
    this._startX = 0;
    this._startY = 0;
    this._startT = 0;
    this._draggingFrom = null; // 'node' or 'empty'
    this._wasNodeSelected = false;

    const el = scene.container;
    el.addEventListener('pointerdown', (e) => this._down(e), { passive: true });
    window.addEventListener('pointermove', (e) => this._move(e), { passive: true });
    window.addEventListener('pointerup', (e) => this._up(e), { passive: true });
    window.addEventListener('pointercancel', (e) => this._cancel(e), { passive: true });
    el.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    // Prevent default touch actions
    el.style.touchAction = 'none';
  }

  _down(e) {
    this._moved = false;
    this._startX = e.clientX;
    this._startY = e.clientY;
    this._startT = Date.now();
    this._pointerId = e.pointerId;
    this._wasNodeSelected = this.scene.selectedNode != null;

    this.scene.autoRotate = false;

    // Check if we hit a node
    const nodeId = this.scene.getIntersection(e.clientX, e.clientY);
    if (nodeId !== null) {
      // Select the node
      this.scene.selectNode(nodeId);
      this._draggingFrom = 'node';

      // Long press timer for context menu
      this.longPressTimer = setTimeout(() => {
        if (!this._moved && this.app) {
          this.app.showContextMenu(nodeId);
          this._draggingFrom = null;
        }
      }, 600);
      return;
    }

    // Empty space — start rotation
    this._draggingFrom = 'empty';
    this.scene.selectNode(null);
    this.scene.isDragging = true;
  }

  _move(e) {
    // Only track the pointer that started the gesture
    if (e.pointerId && this._pointerId && e.pointerId !== this._pointerId) return;

    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > 5) {
      this._moved = true;
      clearTimeout(this.longPressTimer);
    }

    // Edge drag from selected node
    if (this._draggingFrom === 'node' && this._moved && this.scene.selectedNode != null) {
      if (!this.scene.isDraggingEdge) {
        this.scene.startEdgeDrag(this.scene.selectedNode);
      }
      this.scene.updateEdgeDrag(e.clientX, e.clientY);
      return;
    }

    // Rotation drag
    if (this._draggingFrom === 'empty' && this._moved) {
      this.scene._targetTheta -= dx * 0.008;
      this.scene._targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1,
        this.scene._targetPhi + dy * 0.008));
      this.scene.momentum.x = dx * 0.001;
      this.scene.momentum.y = dy * 0.001;
    }
  }

  _up(e) {
    clearTimeout(this.longPressTimer);

    // Edge drag finish
    if (this.scene.isDraggingEdge) {
      const targetId = this.scene.getIntersection(e.clientX, e.clientY);
      const edge = this.scene.endEdgeDrag(targetId);
      if (edge && this.app) {
        this.app.onEdgeCreated(edge);
      } else if (this.app && targetId && targetId !== this.scene.edgeSourceId) {
        this.app.showToast('Cannot connect these nodes');
      }
      this._cleanup();
      return;
    }

    // Tap (no movement) — handle selection/deselection
    if (!this._moved) {
      const dt = Date.now() - this._startT;
      if (dt < 400) {
        const nodeId = this.scene.getIntersection(e.clientX, e.clientY);

        if (nodeId === null && this.scene.selectedNode != null) {
          // Tap on empty space while node selected → deselect
          this.scene.selectNode(null);
          if (this.app) this.app.onNodeDeselected();
        }
      }
    }

    this._cleanup();

    // Re-enable auto-rotate after short idle
    setTimeout(() => {
      if (!this.scene.isDragging && !this.scene.isDraggingEdge) {
        this.scene.autoRotate = true;
      }
    }, 1500);
  }

  _cancel() {
    clearTimeout(this.longPressTimer);
    if (this.scene.isDraggingEdge) {
      this.scene.endEdgeDrag(null);
    }
    this._cleanup();
  }

  _cleanup() {
    this.scene.isDragging = false;
    this._draggingFrom = null;
    this._pointerId = null;
    this._moved = false;
  }

  _wheel(e) {
    e.preventDefault();
    this.scene._targetDist = Math.max(4, Math.min(30,
      this.scene._targetDist + e.deltaY * 0.02));
    this.scene.autoRotate = false;
    setTimeout(() => {
      if (!this.scene.isDragging && !this.scene.isDraggingEdge) {
        this.scene.autoRotate = true;
      }
    }, 2000);
  }

  dispose() {
    const el = this.scene.container;
    el.removeEventListener('pointerdown', this._down);
    window.removeEventListener('pointermove', this._move);
    window.removeEventListener('pointerup', this._up);
    window.removeEventListener('pointercancel', this._cancel);
    el.removeEventListener('wheel', this._wheel);
  }
}
