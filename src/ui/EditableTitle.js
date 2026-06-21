import { replaceSymbols } from '../utils/SymbolMapper.js';

export class EditableTitle {
  constructor(value, onChange) {
    this.value = value;
    this.onChange = onChange;
    this.element = document.createElement('div');
    this.element.style.display = 'inline-block';
    this.init();
  }

  init() {
    this.displaySpan = document.createElement('span');
    this.displaySpan.className = 'title-display';
    this.displaySpan.style.fontFamily = 'monospace';
    this.displaySpan.textContent = replaceSymbols(this.value);
    this.displaySpan.style.cursor = 'text';
    this.displaySpan.style.padding = '4px 8px';
    this.displaySpan.style.borderRadius = '8px';
    this.displaySpan.style.transition = 'background 0.1s';
    this.displaySpan.onmouseenter = () => {
      this.displaySpan.style.background = '#2f3a66';
    };
    this.displaySpan.onmouseleave = () => {
      this.displaySpan.style.background = 'transparent';
    };
    this.displaySpan.onclick = (e) => {
      e.stopPropagation();
      this.startEdit();
    };

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.value = this.value;
    this.input.className = 'title-editable';
    this.input.style.fontFamily = 'monospace';
    this.input.style.fontSize = '14px';
    this.input.style.fontWeight = '700';
    this.input.style.background = '#0f1222';
    this.input.style.border = '1px solid ' + (window.__premiumAccent ? window.__premiumAccent() : '#ffb347');
    this.input.style.borderRadius = '8px';
    this.input.style.padding = '4px 8px';
    this.input.style.color = '#dcf0ff';
    this.input.style.outline = 'none';
    this.input.style.width = '200px';

    this.input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.finish();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.cancel();
      }
      e.stopPropagation();
    };

    this.input.onblur = () => {
      setTimeout(() => {
        if (document.activeElement !== this.input && this.input.parentNode === this.element) {
          this.finish();
        }
      }, 100);
    };

    this.input.onclick = (e) => {
      e.stopPropagation();
    };

    this.element.appendChild(this.displaySpan);
  }

  startEdit() {
    this.input.value = this.value;

    if (this.displaySpan.parentNode === this.element) {
      this.element.removeChild(this.displaySpan);
    }
    this.element.appendChild(this.input);
    this.input.focus();
    this.input.select();
  }

  finish() {
    if (this.input.parentNode !== this.element) {
      return;
    }

    let newValue = this.input.value.trim();

    if (newValue === '') {
      newValue = this.value;
    }

    const hasChanged = (newValue !== this.value);

    this.value = newValue;
    this.displaySpan.textContent = replaceSymbols(newValue);

    this.element.removeChild(this.input);
    this.element.appendChild(this.displaySpan);

    if (this.onChange && hasChanged) {
      this.onChange(newValue);
    }
  }

  cancel() {
    this.input.value = this.value;
    if (this.input.parentNode === this.element) {
      this.element.removeChild(this.input);
      this.element.appendChild(this.displaySpan);
    }
  }

  getElement() {
    return this.element;
  }

  setValue(val) {
    this.value = val;
    this.displaySpan.textContent = replaceSymbols(val);
    if (this.input.parentNode === this.element) {
      this.input.value = val;
    }
  }

  getValue() {
    return this.value;
  }
}
