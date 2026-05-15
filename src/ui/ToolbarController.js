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
    document.getElementById('exportBtn').onclick = () => this.export();
    document.getElementById('importBtn').onclick = () => this.import();
    document.getElementById('clearStorageBtn').onclick = () => this.clearStorage();
    document.getElementById('fileInput').onchange = (e) => this.handleFileImport(e);
    
    this.initLanguageSwitcher();

    i18n.subscribe(() => this.updateButtonTexts());
  }
  
  initLanguageSwitcher() {
    let langContainer = document.getElementById('languageSwitcherContainer');
    if (!langContainer) {
      langContainer = document.createElement('div');
      langContainer.id = 'languageSwitcherContainer';
      langContainer.style.display = 'inline-block';

      const fileGroup = document.querySelector('.file-group');
      if (fileGroup && fileGroup.parentNode) {
        fileGroup.parentNode.appendChild(langContainer);
      }
    }
    this.languageSwitcher = new LanguageSwitcher('languageSwitcherContainer');
  }
  
  updateButtonTexts() {
    const buttons = {
      undoBtn: t('toolbar.undo'),
      redoBtn: t('toolbar.redo'),
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
