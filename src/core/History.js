export class History {
  constructor(graph, maxSize = 50) {
    this.graph = graph;
    this.maxSize = maxSize;
    this.stack = [];
    this.index = -1;
    this.save();
  }

  capture() {
    return {
      nodes: this.graph.nodes.map(n => n.toJSON()),
      edges: this.graph.edges.map(e => e.toJSON()),
      nextId: this.graph.nextId,
      nextEdgeId: this.graph.nextEdgeId,
      designQuality: window._designQualitySaved || 100
    };
  }

  save() {
    const snapshot = this.capture();
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(snapshot);
    if (this.stack.length > this.maxSize) this.stack.shift();
    else this.index = this.stack.length - 1;
    this.autoSave();
    
    if (this.graph && this.graph.clearDirty) {
      this.graph.clearDirty();
    }
  }

  undo() {
    if (this.index > 0) {
      this.index--;
      this.restore(this.stack[this.index]);
      if (this.graph && this.graph.setDirty) {
        this.graph.setDirty(true);
      }
    }
  }

  redo() {
    if (this.index < this.stack.length - 1) {
      this.index++;
      this.restore(this.stack[this.index]);
      if (this.graph && this.graph.setDirty) {
        this.graph.setDirty(true);
      }
    }
  }

  restore(snapshot) {
    this.graph.loadFrom(snapshot);
    if (snapshot.designQuality !== undefined) {
      window.applyDesignQuality?.(snapshot.designQuality);
    }
  }

  autoSave() {
    try {
      const data = this.graph.toSerial();
      data.viewportOffsetX = window._viewportX || 0;
      data.viewportOffsetY = window._viewportY || 0;
      data.viewportZoom = window.currentZoom || 1;
      data.designQuality = window.currentQualityValue || 100;
      localStorage.setItem('amenodes_autosave', JSON.stringify(data));
      
      const statusEl = document.getElementById('autosaveStatus');
      if (statusEl) {
        statusEl.style.opacity = '1';
        setTimeout(() => { if (statusEl) statusEl.style.opacity = '0'; }, 1500);
      }
    } catch (e) {}
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('amenodes_autosave');
      if (saved) {
        const data = JSON.parse(saved);
        this.graph.loadFrom(data);
        if (data.designQuality !== undefined && window.applyDesignQuality) {
          window.applyDesignQuality(data.designQuality);
        }
        if (data.viewportOffsetX !== undefined && window._viewport) {
          window._viewport.setOffset(data.viewportOffsetX, data.viewportOffsetY);
        }
        if (data.viewportZoom !== undefined && window.setZoom) {
          window.setZoom(data.viewportZoom);
        }

        if (this.graph && this.graph.clearDirty) {
          this.graph.clearDirty();
        }
        
        return true;
      }
    } catch (e) {}
    return false;
  }
}
