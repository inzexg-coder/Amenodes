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
  }

  attach() {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('contextmenu', e => e.preventDefault());
  }

  onMouseDown(e) {
    if (e.button !== 2) return;
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
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

  onMouseUp() {
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
}
