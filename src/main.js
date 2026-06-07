import { Graph, NODE_TYPES, History } from './graph.js';
import { Scene3D } from './scene3d.js';
import { TouchControls } from './touch.js';
import { BottomSheet, toast, buildNodeMenuHTML, buildEditSheetHTML, buildContextMenuHTML } from './ui.js';

class App {
  constructor() {
    this.graph = new Graph();
    this.history = new History(this.graph);
    this.sheet = new BottomSheet();
    this._dirtyUnsub = null;
    this._init();
  }

  async _init() {
    try {
      const container = document.getElementById('scene-container');
      if (!container) throw new Error('scene-container not found');

      this.scene = new Scene3D(container, this.graph);
      await this.scene.init();

      this.touch = new TouchControls(this.scene, this);
      this.scene.onNodeSelect = (node) => this._onNodeSelect(node);

      this._setupUI();
      this._setupDirtyTracking();

      // Load or demo
      if (!this.graph.loadFromStorage()) {
        this._loadDemo();
      }
      this.history.save();
      this.scene.rebuild();
      this._updateUI();
      this._dismissSplash();
    } catch (err) {
      console.error('Init error:', err);
      const splash = document.getElementById('splashOverlay');
      if (splash) {
        splash.innerHTML = `
          <div style="text-align:center;padding:40px;color:#ff5555;">
            <h2 style="color:#ff5555;">Error</h2>
            <p style="color:#8899bb;font-size:14px;margin:16px 0;">${err.message}</p>
            <p style="color:#6678aa;font-size:12px;">Check console for details</p>
          </div>
        `;
      }
    }
  }

  _dismissSplash() {
    const splash = document.getElementById('splashOverlay');
    if (!splash) return;
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      document.getElementById('appContainer')?.classList.remove('hidden');
      setTimeout(() => this.scene._resize(), 100);
    }, 300);
  }

  _setupUI() {
    // FAB
    const fab = document.getElementById('fabBtn');
    if (fab) fab.onclick = () => this._showNodeMenu();

    // Sheet backdrop
    const overlay = document.querySelector('.sheet-overlay');
    if (overlay) overlay.onclick = () => this.sheet.hide();

    // Splash buttons
    const newBtn = document.getElementById('splashNewBtn');
    if (newBtn) newBtn.onclick = () => this._newCanvas();
    const loadBtn = document.getElementById('splashLoadBtn');
    if (loadBtn) loadBtn.onclick = () => this._loadFile();

    // Undo/Redo
    const undo = document.getElementById('undoBtn');
    if (undo) undo.onclick = () => { this.history.undo(); this._afterUndoRedo(); };
    const redo = document.getElementById('redoBtn');
    if (redo) redo.onclick = () => { this.history.redo(); this._afterUndoRedo(); };

    // Menu button
    const menu = document.getElementById('menuBtn');
    if (menu) menu.onclick = () => this._showAppMenu();

    // File input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.onchange = (e) => this._importFile(e);
  }

  _newCanvas() {
    this.graph.clear();
    this.history.save();
    this.scene.rebuild();
    this._updateUI();
    this._dismissSplash();
    toast('New canvas');
  }

  _loadFile() {
    document.getElementById('fileInput')?.click();
  }

  async _importFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await this.graph.importFromFile(file);
    if (ok) {
      this.scene.rebuild();
      this.history.save();
      this._updateUI();
      toast('Loaded');
    } else {
      toast('Invalid file', 3000);
    }
    e.target.value = '';
  }

  _showAppMenu() {
    this.sheet.show(`
      <div class="sheet-title">Menu</div>
      <div class="ctx-actions">
        <button class="ctx-btn" id="app-export">📥 Export (.amnk)</button>
        <button class="ctx-btn" id="app-import">📂 Import (.amnk)</button>
        <button class="ctx-btn" id="app-clear">🗑️ Clear Canvas</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('app-export')?.addEventListener('click', () => {
        this.graph.exportToFile();
        this.sheet.hide();
      });
      document.getElementById('app-import')?.addEventListener('click', () => {
        this._loadFile();
        this.sheet.hide();
      });
      document.getElementById('app-clear')?.addEventListener('click', () => {
        this.graph.clear();
        this.scene.rebuild();
        this.history.save();
        this._updateUI();
        this.sheet.hide();
        toast('Canvas cleared');
      });
    }, 50);
  }

  _afterUndoRedo() {
    this.scene.rebuild();
    this._updateUI();
    this.graph.saveToStorage();
  }

  _setupDirtyTracking() {
    const el = document.getElementById('dirtyIndicator');
    if (!el) return;
    const update = (dirty) => {
      el.style.display = dirty ? 'inline' : 'none';
      el.textContent = '●';
    };
    this._dirtyUnsub = this.graph.onDirtyChange(update);
    update(false);
  }

  _loadDemo() {
    const a = this.graph.addNode('number', { title: 'Input A', value: 42 });
    const b = this.graph.addNode('number', { title: 'Input B', value: 58 });
    const calc = this.graph.addNode('calc', { title: 'Sum', mode: 'sum' });
    const out = this.graph.addNode('output', { title: 'Result' });
    this.graph.addEdge(a.id, calc.id);
    this.graph.addEdge(b.id, calc.id);
    this.graph.addEdge(calc.id, out.id);
  }

  // ─── Node Menu ────────────────────────────────────────────
  _showNodeMenu() {
    this.sheet.show(buildNodeMenuHTML());
    this.sheet.getBody().querySelectorAll('.node-option').forEach(el => {
      el.onclick = () => {
        const type = el.dataset.type;
        this._createNode(type);
        this.sheet.hide();
      };
    });
  }

  _createNode(type) {
    const node = this.graph.addNode(type);
    this.scene.rebuild();
    this.history.save();
    this._updateUI();
    toast(`Created ${NODE_TYPES[type]?.label || type}`);
  }

  // ─── Node Select ──────────────────────────────────────────
  _onNodeSelect(node) {
    if (!node) {
      if (this.sheet.isOpen) return;
      return;
    }
    this._showEditSheet(node);
  }

  onNodeDeselected() {
    if (this.sheet.isOpen && !this.sheet.getBody()?.querySelector('.ctx-actions')) {
      this.sheet.hide();
    }
  }

  // ─── Edit Sheet ───────────────────────────────────────────
  _showEditSheet(node) {
    const html = buildEditSheetHTML(node, this, {
      save: () => this._saveNode(node),
      del: () => this._deleteNode(node)
    });
    this.sheet.show(html);
    this._wireEditSheet(node);
  }

  _wireEditSheet(node) {
    setTimeout(() => {
      const saveBtn = document.getElementById('save-node');
      if (saveBtn) saveBtn.onclick = () => { this._saveNode(node); this.sheet.hide(); };
      const delBtn = document.getElementById('delete-node');
      if (delBtn) delBtn.onclick = () => this._deleteNode(node);
      const important = document.getElementById('edit-important');
      if (important) important.onchange = () => {
        node.important = important.checked;
        this.scene.rebuild();
        this.history.save();
        this._updateUI();
      };
      // Add row
      const addRow = document.getElementById('add-row');
      if (addRow) addRow.onclick = () => {
        node.data.rows = node.data.rows || [];
        node.data.rows.push({ name: 'x', value: 0 });
        this._showEditSheet(node);
      };
      // Remove group row
      document.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx);
          node.data.rows = node.data.rows.filter((_, i) => i !== idx);
          this._showEditSheet(node);
        };
      });
      // Constant presets
      document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
          const val = parseFloat(chip.dataset.val);
          const input = document.getElementById('edit-val');
          if (input) input.value = val;
        };
      });
    }, 50);
  }

  _saveNode(node) {
    const title = document.getElementById('edit-title');
    const val = document.getElementById('edit-val');
    const label = document.getElementById('edit-label');
    const mode = document.getElementById('edit-mode');

    if (title) node.title = title.value;
    if (val) node.data.value = parseFloat(val.value) || 0;
    if (label) node.data.label = label.value;
    if (mode) node.data.mode = mode.value;

    // Group rows
    if (node.type === 'group') {
      document.querySelectorAll('.group-row').forEach(row => {
        const ni = row.querySelector('[data-field="name"]');
        const vi = row.querySelector('[data-field="value"]');
        if (ni && vi) {
          const idx = parseInt(ni.dataset.idx);
          if (node.data.rows[idx]) {
            node.data.rows[idx].name = ni.value;
            node.data.rows[idx].value = parseFloat(vi.value) || 0;
          }
        }
      });
    }

    this.scene.rebuild();
    this.history.save();
    this.graph.saveToStorage();
    this._updateUI();
    toast('Saved');
  }

  _deleteNode(node) {
    this.graph.removeNode(node.id);
    this.scene.rebuild();
    this.history.save();
    this.graph.saveToStorage();
    this.sheet.hide();
    this._updateUI();
    toast('Deleted');
  }

  // ─── Context Menu ─────────────────────────────────────────
  showContextMenu(nodeId) {
    const node = this.graph.getNode(nodeId);
    if (!node) return;
    this.sheet.show(buildContextMenuHTML(node));
    setTimeout(() => {
      const edit = document.getElementById('ctx-edit');
      if (edit) edit.onclick = () => { this.sheet.hide(); this._showEditSheet(node); };
      const imp = document.getElementById('ctx-important');
      if (imp) imp.onclick = () => {
        node.important = !node.important;
        this.scene.rebuild();
        this.history.save();
        this.sheet.hide();
        this._updateUI();
      };
      const conn = document.getElementById('ctx-connect');
      if (conn) conn.onclick = () => {
        this.sheet.hide();
        this.scene.selectNode(node.id);
        toast('Drag from this node to connect');
      };
      const del = document.getElementById('ctx-delete');
      if (del) del.onclick = () => this._deleteNode(node);
    }, 50);
  }

  // ─── Edge Created ─────────────────────────────────────────
  onEdgeCreated(edge) {
    this.history.save();
    this.graph.saveToStorage();
    this.scene.rebuild();
    this._updateUI();
    const src = this.graph.getNode(edge.sourceId);
    const tgt = this.graph.getNode(edge.targetId);
    toast(`Connected ${src?.title} → ${tgt?.title}`);
  }

  showToast(msg) {
    toast(msg);
  }

  // ─── UI Updates ───────────────────────────────────────────
  _updateUI() {
    const nodeCount = document.getElementById('nodeCount');
    if (nodeCount) nodeCount.textContent = `${this.graph.nodes.length} nodes`;
    const edgeCount = document.getElementById('edgeCount');
    if (edgeCount) edgeCount.textContent = `${this.graph.edges.length} edges`;
  }
}

// ─── Start ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
