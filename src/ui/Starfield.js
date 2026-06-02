export class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.numStars = 300;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.intensity = 0.6;
    this.init();
    window.addEventListener('resize', () => this.resize());
  }
  init() {
    this.resize();
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  setIntensity(val) {
    this.intensity = Math.min(1, Math.max(0.1, val));
  }
  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const star of this.stars) {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 230, 180, ${star.alpha * this.intensity})`;
      this.ctx.fill();
    }
  }
  start() {
    const animate = () => {
      this.draw();
      requestAnimationFrame(animate);
    };
    animate();
  }
}
