import { Graph, NODE_TYPES } from './graph.js';
import { Scene3D } from './scene3d.js';
import { TouchControls } from './touch.js';
import { BottomSheet, toast } from './ui.js';

class App {
  constructor() {
    this.graph = new Graph();
    this.sheet = new BottomSheet();

    this._init();
  }

  async _init() {
    const container = document.getElementById('scene-container');
    if (!container) { console.error('No container'); return; }

    this.scene = new Scene3D(container, this.graph);
    await this.scene.init();

    this.touch = new TouchControls(this.scene);
    this.scene.onNodeSelect = (node) => this._onNodeSelect(node);
    this.scene.onNodeContext = (nodeId) => this._openContextMenu(nodeId);

    this._setupUI();

    // Load saved graph or demo
    if (!this.graph.load()) {
      this._loadDemo();
    }
    this.scene.rebuild();
    this._updateCounts();

    // Remove splash
    const splash = document.getElementById('splashOverlay');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.style.display = 'none';
        document.getElementById('appContainer')?.classList.remove('hidden');
        this.scene._resize();
      }, 300);
    }
  }

  _loadDemo() {
    const a = this.graph.addNode('number', { title: 'A', value: 42 });
    const b = this.graph.addNode('number', { title: 'B', value: 58 });
    const calc = this.graph.addNode('calc', { title: 'Sum', mode: 'sum' });
    const out = this.graph.addNode('output', { title: 'Result' });
    this.graph.addEdge(a.id, calc.id);
    this.graph.addEdge(b.id, calc.id);
    this.graph.addEdge(calc.id, out.id);
  }

  _setupUI() {
    // FAB button
    const fab = document.getElementById('fabBtn');
    if (fab) fab.onclick = () => this._showNodeMenu();

    // Bottom sheet backdrop
    const overlay = document.querySelector('.sheet-overlay');
    if (overlay) overlay.onclick = () => this.sheet.hide();
  }

  _showNodeMenu() {
    let html = '<div class="sheet-title">Create Node</div>';
    for (const [type, meta] of Object.entries(NODE_TYPES)) {
      const c = '#' + meta.color.toString(16).padStart(6, '0');
      html += `
        <div class="node-option" data-type="${type}" style="--node-color: ${c}">
          <span class="no-icon">${meta.icon}</span>
          <div class="no-info">
            <div class="no-name">${meta.label}</div>
            <div class="no-desc">${meta.dataType}</div>
          </div>
        </div>`;
    }
    this.sheet.show(html);

    // Attach click handlers
    this.sheet._body.querySelectorAll('.node-option').forEach(el => {
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
    this._updateCounts();
    this.graph.save();
    toast(`Created ${NODE_TYPES[type]?.label || type}`);
  }

  _onNodeSelect(node) {
    if (!node) {
      this.sheet.hide();
      return;
    }
    // Show edit bottom sheet
    this._showEditSheet(node);
  }

  _showEditSheet(node) {
    const meta = node.meta;
    if (!meta) return;
    const c = '#' + meta.color.toString(16).padStart(6, '0');
    let body = '';
    let actions = '';

    switch (node.type) {
      case 'number':
        body = `
          <div class="edit-row">
            <label>Value</label>
            <input type="number" class="edit-input" id="edit-val" value="${node.data.value ?? 0}" step="any">
          </div>`;
        break;
      case 'constant':
        body = `
          <div class="edit-row">
            <label>Value</label>
            <input type="number" class="edit-input" id="edit-val" value="${node.data.value ?? 0}" step="any">
          </div>
          <div class="edit-row">
            <label>Label</label>
            <input type="text" class="edit-input" id="edit-label" value="${node.data.label || ''}">
          </div>`;
        break;
      case 'group': {
        const rows = node.data.rows || [];
        body = '<div class="edit-row"><label>Rows</label></div>';
        body += '<div id="group-rows">';
        rows.forEach((r, i) => {
          body += `
            <div class="group-row">
              <input type="text" class="edit-input sm" value="${r.name}" data-idx="${i}" data-field="name">
              <input type="number" class="edit-input sm" value="${r.value}" data-idx="${i}" data-field="value" step="any">
              <button class="btn-icon danger" data-idx="${i}" data-action="remove">×</button>
            </div>`;
        });
        body += '</div>';
        body += '<button class="btn-sm" id="add-row">+ Add Row</button>';
        actions = 'save'; // handle separately
        break;
      }
      case 'calc':
        body = `
          <div class="edit-row">
            <label>Mode</label>
            <select class="edit-input" id="edit-mode">
              ${['sum', 'diff', 'prod', 'quot', 'pow'].map(m =>
                `<option value="${m}" ${node.data.mode === m ? 'selected' : ''}>${m}</option>`
              ).join('')}
            </select>
          </div>`;
        break;
      case 'map':
        body = `
          <div class="edit-row">
            <label>Mode</label>
            <select class="edit-input" id="edit-mode">
              ${['linear', 'custom'].map(m =>
                `<option value="${m}" ${node.data.mode === m ? 'selected' : ''}>${m}</option>`
              ).join('')}
            </select>
          </div>`;
        break;
      default:
        body = `<div class="edit-info">${meta.label} — ${meta.dataType}</div>`;
    }

    // Actions
    actions = `
      <div class="edit-actions">
        <button class="btn danger" id="delete-node">Delete</button>
        <button class="btn primary" id="save-node">Save</button>
      </div>`;

    let html = `
      <div class="sheet-title" style="border-left: 3px solid ${c}">${node.title}</div>
      ${body}
      ${actions}`;

    this.sheet.show(html);

    // Wire up events after DOM is ready
    setTimeout(() => {
      // Save
      const saveBtn = document.getElementById('save-node');
      if (saveBtn) {
        saveBtn.onclick = () => {
          this._saveNode(node);
          this.sheet.hide();
        };
      }
      // Delete
      const delBtn = document.getElementById('delete-node');
      if (delBtn) {
        delBtn.onclick = () => {
          this.graph.removeNode(node.id);
          this.scene.rebuild();
          this._updateCounts();
          this.sheet.hide();
          toast('Deleted');
        };
      }
      // Add row (group)
      const addRow = document.getElementById('add-row');
      if (addRow) {
        addRow.onclick = () => {
          node.data.rows = node.data.rows || [];
          node.data.rows.push({ name: 'x', value: 0 });
          this._showEditSheet(node);
        };
      }
      // Group row remove
      document.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx);
          node.data.rows = node.data.rows.filter((_, i) => i !== idx);
          this._showEditSheet(node);
        };
      });
    }, 50);
  }

  _saveNode(node) {
    const val = document.getElementById('edit-val');
    const label = document.getElementById('edit-label');
    const mode = document.getElementById('edit-mode');

    if (val) node.data.value = parseFloat(val.value) || 0;
    if (label) node.data.label = label.value;
    if (mode) node.data.mode = mode.value;

    // Group rows
    if (node.type === 'group') {
      document.querySelectorAll('.group-row').forEach(row => {
        const nameInput = row.querySelector('[data-field="name"]');
        const valInput = row.querySelector('[data-field="value"]');
        if (nameInput && valInput) {
          const idx = parseInt(nameInput.dataset.idx);
          if (node.data.rows[idx]) {
            node.data.rows[idx].name = nameInput.value;
            node.data.rows[idx].value = parseFloat(valInput.value) || 0;
          }
        }
      });
    }

    this.scene.rebuild();
    this.graph.save();
    toast('Saved');
  }

  _updateCounts() {
    const el = document.getElementById('nodeCount');
    if (el) el.textContent = `${this.graph.nodes.length} nodes`;
  }
}

// ─── Start ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
