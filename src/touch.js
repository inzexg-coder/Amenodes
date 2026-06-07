// ─── Touch Controls ──────────────────────────────────────────
export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this._onDown = (e) => this._down(e);
    this._onMove = (e) => this._move(e);
    this._onUp = (e) => this._up(e);
    this._onWheel = (e) => this._wheel(e);

    this._touches = [];
    this._startDist = 0;
    this._moved = false;

    const el = scene.container;
    el.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
    el.addEventListener('wheel', this._onWheel, { passive: false });
  }

  _down(e) {
    this._touches = [{ x: e.clientX, y: e.clientY }];
    this._startDist = 0;
    this._moved = false;
    this.scene._touchStart = { x: e.clientX, y: e.clientY, t: Date.now() };
    this.scene._prevTouch = { x: e.clientX, y: e.clientY };
    this.scene._isDragging = false;
    this.scene.autoRotate = false;

    // Check for node tap
    const nodeId = this.scene.getIntersection(e.clientX, e.clientY);
    if (nodeId !== null) {
      this.scene.selectNode(nodeId);
      this._touches = []; // don't rotate
      return;
    }
    this.scene._isDragging = true;
  }

  _move(e) {
    if (!this._touches.length) return;

    const dt = Date.now() - this.scene._touchStart.t;

    // Multi-touch (pinch)
    if (e.touches && e.touches.length >= 2) {
      const t = e.touches;
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (this._startDist > 0) {
        const scale = this._startDist / dist;
        this.scene._targetDist = Math.max(4, Math.min(30, this.scene._targetDist * scale));
      }
      this._startDist = dist;
      this._moved = true;
      return;
    }

    const dx = e.clientX - this.scene._prevTouch.x;
    const dy = e.clientY - this.scene._prevTouch.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this._moved = true;

    if (this.scene._isDragging) {
      this.scene._targetTheta -= dx * 0.008;
      this.scene._targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1,
        this.scene._targetPhi + dy * 0.008));
      this.scene._momentum.x = dx * 0.001;
      this.scene._momentum.y = dy * 0.001;
    }

    this.scene._prevTouch = { x: e.clientX, y: e.clientY };
  }

  _up(e) {
    // Tap on empty space
    if (!this._moved && this._touches.length) {
      const dt = Date.now() - this.scene._touchStart.t;
      if (dt < 300) {
        // Check if not tapping a node
        const nodeId = this.scene.getIntersection(e.clientX, e.clientY);
        if (nodeId === null) {
          this.scene.selectNode(null);
          return;
        }
      }
    }

    this._touches = [];
    this._startDist = 0;
    this.scene._isDragging = false;
    setTimeout(() => {
      if (!this.scene._isDragging) this.scene.autoRotate = true;
    }, 2500);
  }

  _wheel(e) {
    e.preventDefault();
    this.scene._targetDist = Math.max(4, Math.min(30, this.scene._targetDist + e.deltaY * 0.02));
    this.scene.autoRotate = false;
    setTimeout(() => { if (!this.scene._isDragging) this.scene.autoRotate = true; }, 2000);
  }

  dispose() {
    const el = this.scene.container;
    el.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
    el.removeEventListener('wheel', this._onWheel);
  }
}
