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
    this.passiveEvents = false;
    this.lastWheelTime = 0;
    this.wheelThrottleDelay = 16;
  }

  attach() {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('contextmenu', e => e.preventDefault());
    
    if (this.passiveEvents) {
      this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
      window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      window.addEventListener('touchend', this.onTouchEnd.bind(this));
    }
  }

  setPassiveEvents(enabled) {
    this.passiveEvents = enabled;
  }

  setWheelThrottle(delay) {
    this.wheelThrottleDelay = delay;
  }

  onMouseDown(e) {
    if (e.button !== 2) return;
    e.preventDefault();
    this.startDrag(e.clientX, e.clientY);
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  startDrag(clientX, clientY) {
    this.isDragging = true;
    this.startX = clientX;
    this.startY = clientY;
    this.originX = this.x;
    this.originY = this.y;
    this.container.style.cursor = 'grabbing';
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    this.x = this.originX + dx;
    this.y = this.originY + dy;
    this.update();
    if (this.onChangeCallback) this.onChangeCallback();
    
    window._viewportX = this.x;
    window._viewportY = this.y;
  }

  onTouchMove(e) {
    if (!this.isDragging || !e.touches.length) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - this.startX;
    const dy = e.touches[0].clientY - this.startY;
    this.x = this.originX + dx;
    this.y = this.originY + dy;
    this.update();
    if (this.onChangeCallback) this.onChangeCallback();
    
    window._viewportX = this.x;
    window._viewportY = this.y;
  }

  onMouseUp() {
    this.endDrag();
  }

  onTouchEnd() {
    this.endDrag();
  }

  endDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.container.style.cursor = 'grab';
    }
  }

  update() {
    this.canvasContainer.style.transform = `translate(${this.x}px, ${this.y}px) scale(${window.currentZoom || 1})`;
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

  reset() {
    this.x = 0;
    this.y = 0;
    this.update();
    if (this.onChangeCallback) this.onChangeCallback();
  }

  getZoom() {
    return window.currentZoom || 1;
  }

  setZoom(zoom, centerX = null, centerY = null) {
    const oldZoom = this.getZoom();
    if (centerX !== null && centerY !== null) {
      const worldX = (centerX - this.x) / oldZoom;
      const worldY = (centerY - this.y) / oldZoom;
      this.x = centerX - worldX * zoom;
      this.y = centerY - worldY * zoom;
    }
    window.currentZoom = Math.min(3, Math.max(0.3, zoom));
    this.update();
    if (this.onChangeCallback) this.onChangeCallback();
  }
}
