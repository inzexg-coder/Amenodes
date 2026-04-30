import { replaceSymbols } from '../utils/SymbolMapper.js';

export class EditableTitle {
  constructor(value, onChange) {
    this.value = value;
    this.onChange = onChange;
    this.element = document.createElement('div');
    this.init();
  }

  init() {
    this.displaySpan = document.createElement('span');
    this.displaySpan.className = 'title-display';
    this.displaySpan.style.fontFamily = 'monospace';
    this.displaySpan.textContent = replaceSymbols(this.value);
    this.displaySpan.onclick = (e) => {
      e.stopPropagation();
      this.startEdit();
    };

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.value = this.value;
    this.input.className = 'title-editable';
    this.input.style.fontFamily = 'monospace';
    this.input.onkeydown = (e) => {
      if (e.key === 'Enter') this.finish();
      else if (e.key === 'Escape') this.cancel();
      e.stopPropagation();
    };
    this.input.onblur = () => this.finish();

    this.element.appendChild(this.displaySpan);
  }

  startEdit() {
    this.element.removeChild(this.displaySpan);
    this.element.appendChild(this.input);
    this.input.focus();
  }

  finish() {
    const newValue = this.input.value;
    this.value = newValue;
    this.displaySpan.textContent = replaceSymbols(newValue);
    this.element.removeChild(this.input);
    this.element.appendChild(this.displaySpan);
    if (this.onChange) this.onChange(newValue);
  }

  cancel() {
    this.input.value = this.value;
    this.finish();
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
}
