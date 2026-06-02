export class FloatingToolbar {
  constructor() {
    this.container = document.getElementById('floatingToolbar');
    this.onAddNode = null;
    this.onUndo = null;
    this.onRedo = null;
    this.onExport = null;
    this.onImport = null;
    this.onSettings = null;
    this.onClear = null;
    this.init();
  }
  init() {
    if (!this.container) return;
    const addBtn = this.container.querySelector('#toolbarAddNode');
    const undoBtn = this.container.querySelector('#toolbarUndo');
    const redoBtn = this.container.querySelector('#toolbarRedo');
    const exportBtn = this.container.querySelector('#toolbarExport');
    const importBtn = this.container.querySelector('#toolbarImport');
    const settingsBtn = this.container.querySelector('#toolbarSettings');
    const clearBtn = this.container.querySelector('#toolbarClear');
    if (addBtn) addBtn.onclick = () => this.onAddNode?.();
    if (undoBtn) undoBtn.onclick = () => this.onUndo?.();
    if (redoBtn) redoBtn.onclick = () => this.onRedo?.();
    if (exportBtn) exportBtn.onclick = () => this.onExport?.();
    if (importBtn) importBtn.onclick = () => this.onImport?.();
    if (settingsBtn) settingsBtn.onclick = () => this.onSettings?.();
    if (clearBtn) clearBtn.onclick = () => this.onClear?.();
  }
}
