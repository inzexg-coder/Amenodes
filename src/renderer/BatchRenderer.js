export class BatchRenderer {
  constructor(renderCallback) {
    this.renderCallback = renderCallback;
    this.isDirty = false;
    this.rafId = null;
    this.pendingUpdates = new Set();
  }
  
  markDirty(nodeId = null) {
    if (nodeId) this.pendingUpdates.add(nodeId);
    this.isDirty = true;
    this.scheduleRender();
  }
  
  scheduleRender() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.flush();
    });
  }
  
  flush() {
    if (this.isDirty) {
      this.renderCallback(this.pendingUpdates);
      this.pendingUpdates.clear();
      this.isDirty = false;
    }
    this.rafId = null;
  }
  
  immediate() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.flush();
  }
}
