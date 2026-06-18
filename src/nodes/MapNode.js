import { Node } from '../core/Node.js';
import { EditableTitle } from '../ui/EditableTitle.js';
import { i18n, t } from '../i18n/LanguageManager.js';

export const metadata = {
  type: 'map',
  nameKey: 'nodes.map',
  descriptionKey: 'nodeDescriptions.map',
  author: 'Amenoke',
  github: 'https://github.com/inzexg-coder/Amenodes',
  icon: 'fa-map',
};

export class MapNode extends Node {
  constructor(id, x, y, title, options = {}) {
    super(id, 'map', x, y, title, options);
    this.maps = options.maps ?? [{ x: 0, y: 0 }];
    this.xCol = options.xCol ?? "x";
    this.yCol = options.yCol ?? "y";
    this.unmappedMode = options.unmappedMode ?? "passthrough";
    this.graph = null;
  }

  getUnmapped() {
    const input = this.graph ? this.graph.getMergedInput(this.id) : [];
    if (!input.length) return [];
    const mappedSet = new Set(this.maps.map(m => m.x));
    return input.filter(v => !mappedSet.has(v));
  }

  getValue() {
    const input = this.graph ? this.graph.getMergedInput(this.id) : [];
    if (!input.length) return [];
    const map = new Map(this.maps.map(m => [m.x, m.y]));
    const result = [];
    for (const v of input) {
      if (map.has(v)) result.push(map.get(v));
      else if (this.unmappedMode === "passthrough") result.push(v);
    }
    return result;
  }

  getOutputValue(port = 'main', visited = new Set(), graph) {
    if (port === 'unmapped') return this.getUnmapped();
    return this.getValue();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      maps: this.maps.map(m => ({ x: m.x, y: m.y })),
      xCol: this.xCol,
      yCol: this.yCol,
      unmappedMode: this.unmappedMode
    };
  }

  getMinHeight() {
    return Math.max(80, 80 + this.maps.length * 45);
  }

  onAttach(graph) {
    this.graph = graph;
  }

  onDetach() {
    this.graph = null;
  }

  createDOM(graph, renderer) {
    const div = this.createBaseDiv(graph, renderer, 'map-header');
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'group-items';
    
    const update = () => {
      renderer.invalidateCache(this.id);
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.gap = '8px';
    header.style.marginBottom = '8px';
    header.style.fontWeight = 'bold';
    
    const xHead = new EditableTitle(this.xCol || 'x', (newVal) => {
      this.xCol = newVal || 'x';
      update();
    });
    xHead.displaySpan.style.flex = '1';
    xHead.displaySpan.style.background = '#1f2a44';
    xHead.displaySpan.style.border = '1px solid #2e385c';
    xHead.displaySpan.style.borderRadius = '6px';
    xHead.displaySpan.style.padding = '4px 8px';
    
    const yHead = new EditableTitle(this.yCol || 'y', (newVal) => {
      this.yCol = newVal || 'y';
      update();
    });
    yHead.displaySpan.style.flex = '1';
    yHead.displaySpan.style.background = '#1f2a44';
    yHead.displaySpan.style.border = '1px solid #2e385c';
    yHead.displaySpan.style.borderRadius = '6px';
    yHead.displaySpan.style.padding = '4px 8px';
    
    const empty = document.createElement('span');
    empty.style.width = '26px';
    
    header.appendChild(xHead.getElement());
    header.appendChild(yHead.getElement());
    header.appendChild(empty);
    itemsContainer.appendChild(header);

    this.maps.forEach((map, idx) => {
      const row = document.createElement('div');
      row.className = 'group-row';
      
      const xInput = document.createElement('input');
      xInput.type = 'number';
      xInput.value = map.x;
      xInput.step = "any";
      xInput.className = 'group-row-value';
      xInput.onchange = () => {
        const newX = parseFloat(xInput.value) || 0;
        if (this.maps.some((m, i) => i !== idx && Math.abs(m.x - newX) < 1e-9)) {
          xInput.value = map.x;
          return;
        }
        this.maps[idx].x = newX;
        update();
      };
      
      const yInput = document.createElement('input');
      yInput.type = 'number';
      yInput.value = map.y;
      yInput.step = "any";
      yInput.className = 'group-row-value';
      yInput.onchange = () => {
        this.maps[idx].y = parseFloat(yInput.value) || 0;
        update();
      };
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.style.cssText = 'background:none;border:none;color:#ffaa88;cursor:pointer';
      if (this.maps.length > 1) {
        removeBtn.onclick = () => {
          this.maps.splice(idx, 1);
          update();
        };
      } else {
        removeBtn.disabled = true;
      }
      
      row.appendChild(xInput);
      row.appendChild(yInput);
      row.appendChild(removeBtn);
      itemsContainer.appendChild(row);
    });
    
    const addBtn = document.createElement('button');
    addBtn.textContent = t('map.addRule');
    addBtn.className = 'add-value-btn';
    addBtn.onclick = () => {
      this.maps.push({ x: 0, y: 0 });
      update();
    };
    itemsContainer.appendChild(addBtn);
    
    const modeDiv = document.createElement('div');
    modeDiv.className = 'map-mode-switch';
    
    const passBtn = document.createElement('div');
    passBtn.className = 'map-mode-option';
    passBtn.textContent = t('map.passThrough');
    passBtn.style.borderRadius = '32px 0 0 32px';
    
    const sepBtn = document.createElement('div');
    sepBtn.className = 'map-mode-option';
    sepBtn.textContent = t('map.separateOutput');
    sepBtn.style.borderRadius = '0 32px 32px 0';
    
    const updateUI = () => {
      if (this.unmappedMode === 'passthrough') {
        passBtn.classList.add('active');
        sepBtn.classList.remove('active');
      } else {
        sepBtn.classList.add('active');
        passBtn.classList.remove('active');
      }
      renderer.addHandles(div, this.id, this.unmappedMode === 'separate' ? 'unmapped' : null);
      if (this.unmappedMode === 'passthrough') {
        graph.edges = graph.edges.filter(e => !(e.sourceId === this.id && e.sourcePort === 'unmapped'));
      }
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    
    passBtn.onclick = () => {
      if (this.unmappedMode !== 'passthrough') {
        this.unmappedMode = 'passthrough';
        updateUI();
      }
    };
    
    sepBtn.onclick = () => {
      if (this.unmappedMode !== 'separate') {
        this.unmappedMode = 'separate';
        updateUI();
      }
    };
    
    modeDiv.appendChild(passBtn);
    modeDiv.appendChild(sepBtn);
    itemsContainer.appendChild(modeDiv);
    div.appendChild(itemsContainer);
    
    renderer.addHandles(div, this.id, this.unmappedMode === 'separate' ? 'unmapped' : null);
    renderer.applyOptStyles(div);
    
    if (this.unmappedMode === 'passthrough') passBtn.classList.add('active');
    else sepBtn.classList.add('active');
    
    const unsubscribe = i18n.subscribe(() => {
      addBtn.textContent = t('map.addRule');
      passBtn.textContent = t('map.passThrough');
      sepBtn.textContent = t('map.separateOutput');
    });
    
    const originalRemove = div.remove;
    div.remove = function() {
      unsubscribe();
      if (originalRemove) originalRemove.call(this);
    };
    
    return div;
  }
}
