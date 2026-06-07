import { NODE_TYPES } from './graph.js';

let _toastTimer = null;
export function toast(msg, duration = 2500) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ─── BottomSheet ─────────────────────────────────────────────
export class BottomSheet {
  constructor() {
    this._el = document.getElementById('bottomSheet');
    this._body = this._el?.querySelector('.sheet-body');
    this._overlay = document.querySelector('.sheet-overlay');
    this.isOpen = false;
  }

  show(html) {
    if (!this._body) return;
    this._body.innerHTML = html;
    this._el.classList.add('open');
    if (this._overlay) this._overlay.classList.add('open');
    this.isOpen = true;
  }

  hide() {
    if (this._el) this._el.classList.remove('open');
    if (this._overlay) this._overlay.classList.remove('open');
    this.isOpen = false;
  }

  getBody() { return this._body; }
}

// ─── Node Menu Builder ───────────────────────────────────────
export function buildNodeMenuHTML() {
  let html = '<div class="sheet-title">Create Node</div>';
  for (const [type, meta] of Object.entries(NODE_TYPES)) {
    const c = '#' + meta.color.toString(16).padStart(6, '0');
    html += `
      <div class="node-option" data-type="${type}" style="--nc: ${c}">
        <span class="no-icon">${meta.icon}</span>
        <div class="no-info">
          <div class="no-name">${meta.label}</div>
          <div class="no-desc">${meta.desc}</div>
        </div>
      </div>`;
  }
  return html;
}

// ─── Node Edit Sheet Builder ─────────────────────────────────
export function buildEditSheetHTML(node, scene, callbacks) {
  const meta = node.meta;
  if (!meta) return '<div class="sheet-title">Unknown node</div>';
  const c = '#' + meta.color.toString(16).padStart(6, '0');
  let body = '';
  let advanced = '';

  // Title
  body += `
    <div class="edit-row">
      <label>Title</label>
      <input type="text" class="edit-input" id="edit-title" value="${node.title}">
    </div>`;

  switch (node.type) {
    case 'number':
      body += `
        <div class="edit-row">
          <label>Value</label>
          <input type="number" class="edit-input" id="edit-val" value="${node.data.value ?? 0}" step="any">
        </div>`;
      break;

    case 'constant':
      body += `
        <div class="edit-row">
          <label>Value</label>
          <input type="number" class="edit-input" id="edit-val" value="${node.data.value ?? 0}" step="any">
        </div>
        <div class="edit-row">
          <label>Label</label>
          <input type="text" class="edit-input" id="edit-label" value="${node.data.label || ''}">
        </div>`;
      // Presets
      advanced = `
        <div class="edit-section-label">Presets</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;">
          ${[
            { label: 'π', value: Math.PI }, { label: 'e', value: Math.E },
            { label: '√2', value: Math.SQRT2 }, { label: 'φ', value: 1.618 }
          ].map(p => `
            <button class="chip" data-val="${p.value}">${p.label}</button>
          `).join('')}
        </div>`;
      break;

    case 'group': {
      const rows = node.data.rows || [];
      body += '<div class="edit-section-label">Values</div>';
      body += '<div id="group-rows">';
      rows.forEach((r, i) => {
        body += `
          <div class="group-row">
            <input type="text" class="edit-input sm" value="${r.name}" data-idx="${i}" data-field="name" placeholder="name">
            <input type="number" class="edit-input sm" value="${r.value}" data-idx="${i}" data-field="value" step="any" placeholder="val">
            <button class="btn-icon danger" data-idx="${i}" data-action="remove">✕</button>
          </div>`;
      });
      body += '</div>';
      body += '<button class="btn-sm" id="add-row">+ Add Row</button>';
      break;
    }

    case 'calc':
      body += `
        <div class="edit-row">
          <label>Mode</label>
          <select class="edit-input" id="edit-mode">
            ${['sum', 'diff', 'prod', 'quot', 'pow'].map(m =>
              `<option value="${m}" ${node.data.mode === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="edit-info">Computes: ${node.data.mode || 'sum'} of inputs</div>`;
      break;

    case 'output':
      body += `<div class="edit-info">Shows computed values from connected nodes</div>`;
      // Show computed values
      try {
        const vals = scene.graph.getNodeValue(node);
        if (vals.length) {
          body += '<div class="edit-section-label">Values</div>';
          vals.forEach((v, i) => {
            body += `<div class="output-row">${i + 1}: ${typeof v === 'number' ? v.toFixed(4) : v}</div>`;
          });
        } else {
          body += '<div class="edit-info dim">No incoming values</div>';
        }
      } catch(e) { body += '<div class="edit-info dim">Error computing</div>'; }
      break;

    case 'map':
      body += `
        <div class="edit-row">
          <label>Mode</label>
          <select class="edit-input" id="edit-mode">
            ${['linear', 'custom'].map(m =>
              `<option value="${m}" ${node.data.mode === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>`;
      break;

    case 'mean':
      body += `<div class="edit-info">Computes arithmetic mean of connected values</div>`;
      break;

    case 'sem':
      body += `
        <div class="edit-row">
          <label>Mode</label>
          <select class="edit-input" id="edit-mode">
            ${['sem', 'variance', 'stddev'].map(m =>
              `<option value="${m}" ${(node.data.mode || 'sem') === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>`;
      break;
  }

  // Edge info
  const incoming = scene.graph.getIncoming(node.id);
  const outgoing = scene.graph.getOutgoing(node.id);
  body += `
    <div class="edit-section-label">Connections</div>
    <div class="conn-info">In: ${incoming.length} | Out: ${outgoing.length}</div>`;

  // Important toggle
  body += `
    <div class="edit-section-label">Options</div>
    <label class="toggle-row">
      <input type="checkbox" id="edit-important" ${node.important ? 'checked' : ''}>
      <span>Mark as important</span>
    </label>`;

  // Actions
  body += `
    <div class="edit-actions">
      <button class="btn danger" id="delete-node">Delete</button>
      <button class="btn primary" id="save-node">Save</button>
    </div>`;

  let html = `
    <div class="sheet-title" style="border-left: 3px solid ${c}">${meta.icon} ${node.title}</div>
    ${body}
    ${advanced}`;

  return html;
}

// ─── Context Menu ────────────────────────────────────────────
export function buildContextMenuHTML(node, callbacks) {
  const meta = node.meta;
  const c = '#' + (meta?.color || 0x4488ff).toString(16).padStart(6, '0');
  return `
    <div class="sheet-title" style="border-left: 3px solid ${c}">${node.title}</div>
    <div class="ctx-actions">
      <button class="ctx-btn" id="ctx-edit">✏️ Edit</button>
      <button class="ctx-btn" id="ctx-important">${node.important ? '⭐ Unmark' : '☆ Mark Important'}</button>
      <button class="ctx-btn" id="ctx-connect">🔗 Connect</button>
      <button class="ctx-btn danger" id="ctx-delete">🗑️ Delete</button>
    </div>`;
}

