import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from './CustomModal.js';

export class ToolbarController {
  constructor(graph, renderer, history, viewport, persistenceService) {
    this.graph = graph;
    this.renderer = renderer;
    this.history = history;
    this.viewport = viewport;
    this.persistence = persistenceService;
  }

  init() {
    document.getElementById('undoBtn').onclick = () => this.undo();
    document.getElementById('redoBtn').onclick = () => this.redo();
    document.getElementById('addEmptyBtn').onclick = () => this.addNumberNode();
    document.getElementById('addConstantBtn').onclick = () => this.addConstantNode(); // async
    document.getElementById('addGroupBtn').onclick = () => this.addGroupNode();
    document.getElementById('addOutputBtn').onclick = () => this.addOutputNode();
    document.getElementById('exportBtn').onclick = () => this.export();
    document.getElementById('importBtn').onclick = () => this.import();
    document.getElementById('clearStorageBtn').onclick = () => this.clearStorage();
    document.getElementById('fileInput').onchange = (e) => this.handleFileImport(e);
  }

  undo() {
    this.history.undo();
    this.renderer.render();
    this.history.autoSave();
  }

  redo() {
    this.history.redo();
    this.renderer.render();
    this.history.autoSave();
  }

  getCenterCoords() {
    const rect = document.getElementById('viewport').getBoundingClientRect();
    const off = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    return {
      x: (rect.width / 2 - off.x) / zoom,
      y: (rect.height / 2 - off.y) / zoom
    };
  }

  addNumberNode() {
    const { x, y } = this.getCenterCoords();
    const node = NodeFactory.createNumberAt(x - 100, y - 30);
    this.graph.addNode(node);
    this.renderer.render();
    this.history.save();
  }
  
  async addConstantNode() { 
    const { x, y } = this.getCenterCoords();
    const input = await modal.prompt('Введите значение константы:', '0');
    if (input !== null && input !== undefined) {
      const value = parseFloat(input) || 0;
      const node = NodeFactory.createConstantAt(x - 100, y - 30, value);
      this.graph.addNode(node);
      this.renderer.render();
      this.history.save();
    }
  }
  
  addGroupNode() {
    const { x, y } = this.getCenterCoords();
    const node = NodeFactory.createGroupAt(x - 120, y - 30);
    this.graph.addNode(node);
    this.renderer.render();
    this.history.save();
  }

  addOutputNode() {
    const { x, y } = this.getCenterCoords();
    const node = NodeFactory.createOutputAt(x - 100, y - 30);
    this.graph.addNode(node);
    this.renderer.render();
    this.history.save();
  }

  export() {
    this.persistence.exportToFile();
  }

  import() {
    document.getElementById('fileInput').click();
  }

  async handleFileImport(event) {
    if (!event.target.files.length) return;
    const file = event.target.files[0];
    const success = await this.persistence.importFromFile(file);
    if (success) {
      this.renderer.render();
      this.history.save();
    }
    event.target.value = '';
  }

  clearStorage() {
    if (modal.confirm('Очистить все сохраненные данные?')) {
      localStorage.removeItem('amenodes_autosave');
    }
  }
}
