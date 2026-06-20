export class Viewport {
  constructor(container, canvasContainer) {
    this.container = container;
    this.canvasContainer = canvasContainer;
    this.x = 0;
    this.y = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.originX = 0;
    this.originY = 0;
    this.onChangeCallback = null;

    this.lastPinchDist = 0;
    this.pinchStartZoom = 1;
    this.isPinching = false;

    this.attach();
  }

  attach() {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('contextmenu', e => e.preventDefault());

    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
  }

  onMouseDown(e) {
    if (e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    this.startDrag(e.clientX, e.clientY);
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    this.moveDrag(e.clientX, e.clientY);
  }

  onMouseUp() {
    this.endDrag();
  }

  onTouchStart(e) {
    if (e.target.closest('.node-handle, .node-actions, input, button, select, textarea, .title-editable, .mmt-btn, .mobile-fab')) {
      return;
    }

    const touches = e.touches;

    if (touches.length === 2) {
      this.isPinching = true;
      this.lastPinchDist = this.getTouchDist(touches[0], touches[1]);
      this.pinchStartZoom = window.currentZoom || 1;
      if (this.isDragging) this.endDrag();
      e.preventDefault();
      return;
    }

    if (touches.length === 1) {
      const target = touches[0].target;
      if (target.closest('.node, .splash-card, .splash-overlay, .mobile-bottom-sheet, .mobile-bottom-nav, .mobile-mini-toolbar, .mobile-fab, .modal-overlay, .opt-panel')) {
        return;
      }

      this.startDrag(touches[0].clientX, touches[0].clientY);
      e.preventDefault();
    }
  }

  onTouchMove(e) {
    const touches = e.touches;

    if (touches.length === 2 && this.isPinching) {
      e.preventDefault();
      const dist = this.getTouchDist(touches[0], touches[1]);
      const scale = dist / this.lastPinchDist;
      const newZoom = this.pinchStartZoom * scale;

      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;

      if (window.setZoom) {
        window.setZoom(newZoom, midX, midY);
      }
      return;
    }

    if (touches.length === 1 && this.isDragging) {
      this.moveDrag(touches[0].clientX, touches[0].clientY);
      e.preventDefault();
    }
  }

  onTouchEnd() {
    this.isPinching = false;
    this.endDrag();
  }

  startDrag(clientX, clientY) {
    this.isDragging = true;
    this.startX = clientX;
    this.startY = clientY;
    this.originX = this.x;
    this.originY = this.y;
    this.container.style.cursor = 'grabbing';
  }

  moveDrag(clientX, clientY) {
    const dx = clientX - this.startX;
    const dy = clientY - this.startY;
    this.x = this.originX + dx;
    this.y = this.originY + dy;
    this.update();
    if (this.onChangeCallback) this.onChangeCallback();

    window._viewportX = this.x;
    window._viewportY = this.y;
  }

  endDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.container.style.cursor = '';
    }
  }

  getTouchDist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  update() {
    const zoom = window.currentZoom || 1;
    this.canvasContainer.style.transform = `translate(${this.x}px, ${this.y}px) scale(${zoom})`;
  }

  getOffset() {
    return { x: this.x, y: this.y };
  }

  setOffset(x, y) {
    this.x = x;
    this.y = y;
    this.update();
    if (this.onChangeCallback) this.onChangeCallback();
  }

  getRect() {
    const rect = this.container.getBoundingClientRect();
    return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
  }

  set onChange(callback) {
    this.onChangeCallback = callback;
  }
}
