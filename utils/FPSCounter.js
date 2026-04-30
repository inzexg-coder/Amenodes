export class FPSCounter {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.start();
  }

  start() {
    const update = () => {
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastTime >= 1000) {
        const fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
        if (this.element) {
          this.element.innerHTML = `FPS: ${fps}`;
        }
        this.frameCount = 0;
        this.lastTime = now;
      }
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  async measure(durationMs = 1500) {
    let frames = 0;
    const start = performance.now();
    return new Promise(resolve => {
      function count() {
        frames++;
        const now = performance.now();
        if (now - start < durationMs) {
          requestAnimationFrame(count);
        } else {
          resolve(Math.round(frames * 1000 / (now - start)));
        }
      }
      requestAnimationFrame(count);
    });
  }
}
