export class DeferredEdgeRenderer extends EdgeRenderer {
  constructor(layer) {
    super(layer);
    this.deferredEdges = [];
    this.deferredRafId = null;
    this.priorityEdges = new Set();
  }
  
  renderEdges(edges, graph, rectCache, priority = true) {
    if (priority) {
      this.priorityEdges.clear();
      for (const edge of edges) {
        this.priorityEdges.add(edge.id);
        this.renderEdgeImmediate(edge, graph, rectCache);
      }
    } else {
      this.deferredEdges = edges.filter(e => !this.priorityEdges.has(e.id));
      this.scheduleDeferredRender(graph, rectCache);
    }
  }
  
  scheduleDeferredRender(graph, rectCache) {
    if (this.deferredRafId) cancelAnimationFrame(this.deferredRafId);
    
    this.deferredRafId = requestAnimationFrame(() => {
      for (const edge of this.deferredEdges) {
        this.renderEdgeImmediate(edge, graph, rectCache);
      }
      this.deferredEdges = [];
      this.deferredRafId = null;
    });
  }
  
  renderEdgeImmediate(edge, graph, rectCache) {
    const source = graph.getNode(edge.sourceId);
    const target = graph.getNode(edge.targetId);
    if (!source || !target) return;
  }
}
