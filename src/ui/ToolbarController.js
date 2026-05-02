import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from './CustomModal.js';

console.log('[ToolbarController] Module loading');

export class ToolbarController {
  constructor(graph, renderer, history, viewport, persistenceService) {
    console.log('[ToolbarController] Constructor called');
    this.graph = graph;
    this.renderer = renderer;
    this.history = history;
    this.viewport = viewport;
    this.persistence = persistenceService;
  }

  init() {
    console.log('[ToolbarController] init() started');
    
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const addEmptyBtn = document.getElementById('addEmptyBtn');
    const addConstantBtn = document.getElementById('addConstantBtn');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const addOutputBtn = document.getElementById('addOutputBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearStorageBtn = document.getElementById('clearStorageBtn');
    const fileInput = document.getElementById('fileInput');
    
    console.log('[ToolbarController] Buttons found:', {
      undoBtn: !!undoBtn,
      redoBtn: !!redoBtn,
      addEmptyBtn: !!addEmptyBtn,
      addConstantBtn: !!addConstantBtn,
      addGroupBtn: !!addGroupBtn,
      addOutputBtn: !!addOutputBtn,
      exportBtn: !!exportBtn,
      importBtn: !!importBtn,
      clearStorageBtn: !!clearStorageBtn,
      fileInput: !!fileInput
    });
    
    if (undoBtn) undoBtn.onclick = () => this.undo();
    if (redoBtn) redoBtn.onclick = () => this.redo();
    if (addEmptyBtn) addEmptyBtn.onclick = () => this.addNumberNode();
    if (addConstantBtn) {
      console.log('[ToolbarController] Attaching click handler to addConstantBtn');
      addConstantBtn.onclick = () => {
        console.log('[ToolbarController] addConstantBtn CLICKED!');
        this.addConstantNode();
      };
    }
    if (addGroupBtn) addGroupBtn.onclick = () => this.addGroupNode();
    if (addOutputBtn) addOutputBtn.onclick = () => this.addOutputNode();
    if (exportBtn) exportBtn.onclick = () => this.export();
    if (importBtn) importBtn.onclick = () => this.import();
    if (clearStorageBtn) clearStorageBtn.onclick = () => this.clearStorage();
    if (fileInput) fileInput.onchange = (e) => this.handleFileImport(e);
    
    console.log('[ToolbarController] init() completed');
  }

  undo() {
    console.log('[ToolbarController] undo');
    this.history.undo();
    this.renderer.render();
    this.history.autoSave();
  }

  redo() {
    console.log('[ToolbarController] redo');
    this.history.redo();
    this.renderer.render();
    this.history.autoSave();
  }

  getCenterCoords() {
    const rect = document.getElementById('viewport').getBoundingClientRect();
    const off = this.viewport.getOffset();
    const zoom = window.currentZoom || 1;
    const coords = {
      x: (rect.width / 2 - off.x) / zoom,
      y: (rect.height / 2 - off.y) / zoom
    };
    console.log('[ToolbarController] getCenterCoords:', coords);
    return coords;
  }

  addNumberNode() {
    console.log('[ToolbarController] addNumberNode');
    const { x, y } = this.getCenterCoords();
    const node = NodeFactory.createNumberAt(x - 100, y - 30);
    this.graph.addNode(node);
    this.renderer.render();
    this.history.save();
  }
  
  async addConstantNode() {
    console.log('[ToolbarController] ===== addConstantNode STARTED =====');
    
    try {
      const { x, y } = this.getCenterCoords();
      console.log('[ToolbarController] Step 1: Got center coords:', { x, y });
      
      console.log('[ToolbarController] Step 2: Calling modal.prompt...');
      const input = await modal.prompt('Введите значение константы:', '0');
      
      console.log('[ToolbarController] Step 3: modal.prompt RETURNED:', {
        input: input,
        type: typeof input,
        isNull: input === null,
        isUndefined: input === undefined,
        isEmpty: input === ''
      });
      
      if (input !== null && input !== undefined && input !== '') {
        console.log('[ToolbarController] Step 4: Processing valid input:', input);
        const value = parseFloat(input);
        console.log('[ToolbarController] Step 5: parseFloat result:', value);
        
        const finalValue = isNaN(value) ? 0 : value;
        console.log('[ToolbarController] Step 6: finalValue:', finalValue);
        
        console.log('[ToolbarController] Step 7: Creating constant node...');
        const node = NodeFactory.createConstantAt(x - 100, y - 30, finalValue);
        
        console.log('[ToolbarController] Step 8: Node created:', {
          id: node.id,
          type: node.type,
          value: node.value,
          title: node.title
        });
        
        console.log('[ToolbarController] Step 9: Adding node to graph...');
        this.graph.addNode(node);
        
        console.log('[ToolbarController] Step 10: Reevaluating graph...');
        this.graph.reevaluateAll();
        this.graph.updateAllOutputs();
        
        console.log('[ToolbarController] Step 11: Rendering...');
        this.renderer.render();
        
        console.log('[ToolbarController] Step 12: Saving history...');
        this.history.save();
        
        console.log('[ToolbarController] ===== addConstantNode SUCCESS =====');
      } else {
        console.log('[ToolbarController] Step 4: Input was cancelled or empty, skipping creation');
      }
    } catch (error) {
      console.error('[ToolbarController] ERROR in addConstantNode:', error);
      console.error('[ToolbarController] Error stack:', error.stack);
    }
  }
  
  addGroupNode() {
    console.log('[ToolbarController] addGroupNode');
    const { x, y } = this.getCenterCoords();
    const node = NodeFactory.createGroupAt(x - 120, y - 30);
    this.graph.addNode(node);
    this.renderer.render();
    this.history.save();
  }

  addOutputNode() {
    console.log('[ToolbarController] addOutputNode');
    const { x, y } = this.getCenterCoords();
    const node = NodeFactory.createOutputAt(x - 100, y - 30);
    this.graph.addNode(node);
    this.renderer.render();
    this.history.save();
  }

  export() {
    console.log('[ToolbarController] export');
    this.persistence.exportToFile();
  }

  import() {
    console.log('[ToolbarController] import');
    document.getElementById('fileInput').click();
  }

  async handleFileImport(event) {
    console.log('[ToolbarController] handleFileImport');
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
    console.log('[ToolbarController] clearStorage');
    modal.confirm('Очистить все сохраненные данные?').then((result) => {
      if (result) {
        localStorage.removeItem('amenodes_autosave');
      }
    });
  }
}

console.log('[ToolbarController] Module loaded');
