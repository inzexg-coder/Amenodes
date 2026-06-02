export class Starfield {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.stars = [];
    this.animationId = null;
    this.enabled = true;
    this.quality = 'high';
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'starfield-canvas';
    this.ctx = this.canvas.getContext('2d');
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.generateStars();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.generateStars();
  }

  generateStars() {
    const count = this.getStarCount();
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * (this.quality === 'high' ? 2 : 1.5),
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.002 + Math.random() * 0.01,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  getStarCount() {
    const quality = this.quality; 
    switch(quality) {
      case 'extreme': return 0;
      case 'low': return 150;
      case 'medium': return 400;
      default: return 800;
    }
  }

  animate() {
    if (!this.canvas) return;
    
    if (this.quality === 'extreme') {
      if (this.canvas.style.display !== 'none') this.canvas.style.display = 'none';
      this.animationId = requestAnimationFrame(() => this.animate());
      return;
    } else {
      if (this.canvas.style.display !== '') this.canvas.style.display = '';
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const star of this.stars) {
      star.twinkle += star.speed;
      const alpha = star.alpha * (0.5 + Math.sin(star.twinkle) * 0.5);
      
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 220, 180, ${alpha * 0.6})`;
      this.ctx.fill();
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  setQuality(qualityLevel) {
    this.quality = qualityLevel;
    this.generateStars();
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.canvas) this.canvas.remove();
  }
}
