import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from './CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';

export class ToolbarController {
  constructor(graph, renderer, history, viewport, persistenceService) {
    this.graph = graph;
    this.renderer = renderer;
    this.history = history;
    this.viewport = viewport;
    this.persistence = persistenceService;
    this.languageSwitcher = null;
  }

  init() {
    this.updateButtonTexts();

    document.getElementById('undoBtn').onclick = () => this.undo();
    document.getElementById('redoBtn').onclick = () => this.redo();
    document.getElementById('addEmptyBtn').onclick = () => this.addNumberNode();
    document.getElementById('addConstantBtn').onclick = () => this.addConstantNode();
    document.getElementById('addGroupBtn').onclick = () => this.addGroupNode();
    document.getElementById('addOutputBtn').onclick = () => this.addOutputNode();
    document.getElementById('exportBtn').onclick = () => this.export();
    document.getElementById('importBtn').onclick = () => this.import();
    document.getElementById('clearStorageBtn').onclick = () => this.clearStorage();
    document.getElementById('fileInput').onchange = (e) => this.handleFileImport(e);
    
    const fileGroup = document.querySelector('.file-group');
    if (fileGroup) {
      const langContainer = document.createElement('div');
      langContainer.id = 'languageSwitcherContainer';
      langContainer.style.display = 'inline-block';
      langContainer.style.marginLeft = '8px';
      fileGroup.parentNode.insertBefore(langContainer, fileGroup.nextSibling);
      this.languageSwitcher = new LanguageSwitcher('languageSwitcherContainer');
    }

    i18n.subscribe(() => this.updateButtonTexts());
  }
  
  updateButtonTexts() {
    const buttons = {
      undoBtn: t('toolbar.undo'),
      redoBtn: t('toolbar.redo'),
      addEmptyBtn: t('toolbar.number'),
      addConstantBtn: t('toolbar.constant'),
      addGroupBtn: t('toolbar.group'),
      addOutputBtn: t('toolbar.output'),
      exportBtn: t('toolbar.export'),
      importBtn: t('toolbar.import'),
      clearStorageBtn: t('toolbar.clearStorage')
    };
    
    for (const [id, text] of Object.entries(buttons)) {
      const btn = document.getElementById(id);
      if (btn) btn.textContent = text;
    }
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
    const input = await modal.prompt(t('modal.enterValue'), '0');
    
    if (input !== null && input !== undefined && input !== '') {
      const value = parseFloat(input);
      const finalValue = isNaN(value) ? 0 : value;
      
      const node = NodeFactory.createConstantAt(x - 100, y - 30, finalValue);
      this.graph.addNode(node);
      this.graph.reevaluateAll();
      this.graph.updateAllOutputs();
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
    modal.confirm(t('modal.clearStorageConfirm')).then((result) => {
      if (result) {
        localStorage.removeItem('amenodes_autosave');
      }
    });
  }
}
