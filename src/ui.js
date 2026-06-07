// ─── BottomSheet ─────────────────────────────────────────────
export class BottomSheet {
  constructor() {
    this._el = document.getElementById('bottomSheet');
    this._body = this._el?.querySelector('.sheet-body');
    this._isOpen = false;
  }

  show(html) {
    if (!this._body) return;
    this._body.innerHTML = html;
    this._el.classList.add('open');
    this._isOpen = true;
    this._el.scrollTop = 0;
  }

  hide() {
    if (!this._el) return;
    this._el.classList.remove('open');
    this._isOpen = false;
  }

  toggle() {
    this._isOpen ? this.hide() : this.show('');
  }
}

// ─── Toast ───────────────────────────────────────────────────
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
