export class MiniMap {
  constructor(container, graph, viewport) {
    this.container = container;
    this.graph = graph;
    this.viewport = viewport;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    this.onNavigate = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.container.addEventListener('click', (e) => this.handleClick(e));
    this.update();
  }
  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.update();
  }
  update() {
    if (!this.graph.nodes.length) return;
    const nodes = this.graph.nodes;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 220);
      maxY = Math.max(maxY, n.y + 100);
    }
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scaleX = this.canvas.width / w;
    const scaleY = this.canvas.height / h;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#0a0c14';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (const n of nodes) {
      const x = (n.x - minX) * scaleX;
      const y = (n.y - minY) * scaleY;
      this.ctx.fillStyle = '#ffb347';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    const offset = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    const visX = -offset.x / zoom;
    const visY = -offset.y / zoom;
    const visW = this.viewport.getRect().w / zoom;
    const visH = this.viewport.getRect().h / zoom;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.strokeRect((visX - minX) * scaleX, (visY - minY) * scaleY, visW * scaleX, visH * scaleY);
  }
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (this.maxX - this.minX || 1);
    const scaleY = this.canvas.height / (this.maxY - this.minY || 1);
    const clickX = (e.clientX - rect.left) / scaleX + this.minX;
    const clickY = (e.clientY - rect.top) / scaleY + this.minY;
    if (this.onNavigate) this.onNavigate(clickX, clickY);
  }
}
