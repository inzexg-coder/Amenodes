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

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.onclick = () => this.undo();

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.onclick = () => this.redo();

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.onclick = () => this.export();

    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.onclick = () => this.import();

    const clearStorageBtn = document.getElementById('clearStorageBtn');
    if (clearStorageBtn) clearStorageBtn.onclick = () => this.clearStorage();

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.onchange = (e) => this.handleFileImport(e);

    const fileGroup = document.querySelector('.file-group');
    if (fileGroup && !document.getElementById('languageSwitcherContainer')) {
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

  export() {
    this.persistence.exportToFile();
  }

  import() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
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
