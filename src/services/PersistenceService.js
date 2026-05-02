export class PersistenceService {
  constructor(graph) {
    this.graph = graph;
  }

  saveToStorage(viewport, zoom, quality) {
    const data = this.graph.toSerial();
    data.viewportOffsetX = viewport?.x || 0;
    data.viewportOffsetY = viewport?.y || 0;
    data.viewportZoom = zoom || 1;
    data.designQuality = quality || 100;
    localStorage.setItem('amenodes_autosave', JSON.stringify(data));
    this.showAutosaveStatus();
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
        return data;
      }
    } catch (e) {}
    return null;
  }

  exportToFile() {
    const data = this.graph.toSerial();
    data.viewportOffsetX = window._viewportX || 0;
    data.viewportOffsetY = window._viewportY || 0;
    data.viewportZoom = window.currentZoom || 1;
    data.designQuality = window.currentQualityValue || 100;
    
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `diagram_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.amnk`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async importFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const backup = this.graph.toSerial();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target
