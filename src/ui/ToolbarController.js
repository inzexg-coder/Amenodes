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
      
      var fileGroup = document.querySelector('.file-group');
      if (fileGroup && fileGroup.parentNode) {
        fileGroup.parentNode.appendChild(langContainer);
      }
    }
    this.languageSwitcher = new LanguageSwitcher('languageSwitcherContainer');
  }
  
  updateButtonTexts() {
    var buttons = {
      undoBtn: t('toolbar.undo'),
      redoBtn: t('toolbar.redo'),
      exportBtn: t('toolbar.export'),
      importBtn: t('toolbar.import'),
      clearStorageBtn: t('toolbar.clearStorage')
    };
    
    for (var id in buttons) {
      var btn = document.getElementById(id);
      if (btn) btn.textContent = buttons[id];
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

  export() {
    this.persistence.exportToFile();
  }

  import() {
    document.getElementById('fileInput').click();
  }

  async handleFileImport(event) {
    if (!event.target.files.length) return;
    var file = event.target.files[0];
    var success = await this.persistence.importFromFile(file);
    if (success) {
      this.renderer.render();
      this.history.save();
    }
    event.target.value = '';
  }

  clearStorage() {
    modal.confirm(t('modal.clearStorageConfirm')).then(function(result) {
      if (result) {
        localStorage.removeItem('amenodes_autosave');
      }
    });
  }
}
