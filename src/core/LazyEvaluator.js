export class LazyEvaluator {
  constructor(graph) {
    this.graph = graph;
    this.pendingNodes = new Set();
    this.rafId = null;
    this.isEnabled = false;
  }
  
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.startBackgroundProcessing();
  }
  
  disable() {
    this.isEnabled = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingNodes.clear();
  }
  
  schedule(nodeId) {
    if (!this.isEnabled) {
      this.graph.reevaluateCalc(this.graph.getNode(nodeId));
      return;
    }
    
    this.pendingNodes.add(nodeId);
    this.startBackgroundProcessing();
  }
  
  startBackgroundProcessing() {
    if (this.rafId) return;
    
    const processBatch = () => {
      if (!this.isEnabled || this.pendingNodes.size === 0) {
        this.rafId = null;
        return;
      }
      
      const batch = Array.from(this.pendingNodes).slice(0, 5);
      for (const nodeId of batch) {
        const node = this.graph.getNode(nodeId);
        if (node) this.graph.reevaluateCalc(node);
        this.pendingNodes.delete(nodeId);
      }
      
      this.rafId = requestAnimationFrame(processBatch);
    };
    
    this.rafId = requestAnimationFrame(processBatch);
  }
}
