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
  dataType: 'list',
  canHaveIncomingEdges: true,
  canHaveOutgoingEdges: true,
  allowedInputTypes: ['num','array','uncert','list','wlist'],
  allowedOutputTypes: ['auto','uncert','list','wlist'],
  defaultValue: []
};

export class MapNode extends Node {
  constructor(id,x,y,title,options={}) {
    super(id,'map',x,y,title,options);
    this.maps = options.maps ?? [{ x:0, y:0 }];
    this.xCol = options.xCol ?? "x";
    this.yCol = options.yCol ?? "y";
    this.unmappedMode = options.unmappedMode ?? "passthrough";
    this.graph = null;
  }
  getUnmapped() {
    const input = this.graph ? this.graph.getMergedInput(this.id) : [];
    if(!input.length) return [];
    const mappedSet = new Set(this.maps.map(m=>m.x));
    return input.filter(v=>!mappedSet.has(v));
  }
  getValue() {
    const input = this.graph ? this.graph.getMergedInput(this.id) : [];
    if(!input.length) return [];
    const map = new Map(this.maps.map(m=>[m.x,m.y]));
    const result = [];
    for(const v of input) {
      if(map.has(v)) result.push(map.get(v));
      else if(this.unmappedMode==="passthrough") result.push(v);
    }
    return result;
  }
  getOutputValue(port='main',visited=new Set(),graph) {
    if(port==='unmapped') return this.getUnmapped();
    return this.getValue();
  }
  toJSON() {
    return {...super.toJSON(), maps:this.maps.map(m=>({x:m.x,y:m.y})), xCol:this.xCol, yCol:this.yCol, unmappedMode:this.unmappedMode};
  }
  getMinHeight() { return Math.max(80,80+this.maps.length*45); }
  onAttach(graph) { this.graph = graph; }
  onDetach() { this.graph = null; }
  createDOM(graph,renderer) {
    const div = this.createBaseDiv(graph,renderer,'map-header');
    div.style.position='absolute';
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'group-items';
    const update = () => {
      renderer.invalidateCache(this.id);
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    const header = document.createElement('div');
    header.style.display='flex';
    header.style.gap='8px';
    header.style.marginBottom='8px';
    header.style.fontWeight='bold';
    const xHead = new EditableTitle(this.xCol||'x',(newVal)=>{ this.xCol=newVal||'x'; update(); });
    xHead.displaySpan.style.flex='1';
    xHead.displaySpan.style.background='#1f2a44';
    xHead.displaySpan.style.border='1px solid #2e385c';
    xHead.displaySpan.style.borderRadius='6px';
    xHead.displaySpan.style.padding='4px 8px';
    const yHead = new EditableTitle(this.yCol||'y',(newVal)=>{ this.yCol=newVal||'y'; update(); });
    yHead.displaySpan.style.flex='1';
    yHead.displaySpan.style.background='#1f2a44';
    yHead.displaySpan.style.border='1px solid #2e385c';
    yHead.displaySpan.style.borderRadius='6px';
    yHead.displaySpan.style.padding='4px 8px';
    const empty = document.createElement('span');
    empty.style.width='26px';
    header.appendChild(xHead.getElement());
    header.appendChild(yHead.getElement());
    header.appendChild(empty);
    itemsContainer.appendChild(header);
    const renderRows = () => {
      const existingRows = itemsContainer.querySelectorAll('.group-row:not(.header-row)');
      existingRows.forEach(row=>row.remove());
      this.maps.forEach((map,idx)=>{
        const row = document.createElement('div');
        row.className='group-row';
        const xInput = document.createElement('input');
        xInput.type='number';
        xInput.value=map.x;
        xInput.step="any";
        xInput.className='group-row-value';
        xInput.onchange=()=>{
          const newX = parseFloat(xInput.value)||0;
          if(this.maps.some((m,i)=>i!==idx && Math.abs(m.x-newX)<1e-9)){ xInput.value=map.x; return; }
          this.maps[idx].x=newX;
          update();
        };
        const yInput = document.createElement('input');
        yInput.type='number';
        yInput.value=map.y;
        yInput.step="any";
        yInput.className='group-row-value';
        yInput.onchange=()=>{ this.maps[idx].y=parseFloat(yInput.value)||0; update(); };
        const removeBtn = document.createElement('button');
        removeBtn.textContent='✕';
        removeBtn.style.cssText='background:none;border:none;color:#ffaa88;cursor:pointer';
        if(this.maps.length>1) removeBtn.onclick=()=>{ this.maps.splice(idx,1); renderRows(); update(); };
        else { removeBtn.disabled=true; removeBtn.style.opacity='0.5'; }
        row.appendChild(xInput);
        row.appendChild(yInput);
        row.appendChild(removeBtn);
        itemsContainer.appendChild(row);
      });
    };
    renderRows();
    const addBtn = document.createElement('button');
    addBtn.textContent=t('map.addRule');
    addBtn.className='add-value-btn';
    addBtn.onclick=()=>{ this.maps.push({x:0,y:0}); renderRows(); update(); };
    itemsContainer.appendChild(addBtn);
    div.appendChild(itemsContainer);
    const updateModeHandles = () => {
      if(this.unmappedMode==='separate') {
        renderer.addHandles(div,this.id,'unmapped');
        const blueHandle = div.querySelector('.node-handle-blue');
        if(blueHandle) blueHandle.style.animation='neutronPulse 1s infinite';
        div.style.border='2px solid #44aaff';
        div.style.boxShadow='0 0 20px rgba(68,170,255,0.5)';
      } else {
        renderer.addHandles(div,this.id,null);
        div.style.border='1px solid rgba(255,179,71,0.3)';
        div.style.boxShadow='0 10px 25px -5px rgba(0,0,0,0.5),0 0 0 1px rgba(255,179,71,0.1)';
      }
    };
    const toggleMode = () => {
      if(this.unmappedMode==='passthrough') this.unmappedMode='separate';
      else this.unmappedMode='passthrough';
      updateModeHandles();
      graph.reevaluateAll();
      renderer.render();
      renderer.save();
    };
    div.addEventListener('dblclick',(e)=>{
      if(!e.target.closest('.node-handle') && !e.target.closest('.node-actions')) toggleMode();
    });
    updateModeHandles();
    renderer.applyOptStyles(div);
    const unsubscribe = i18n.subscribe(()=>{ addBtn.textContent=t('map.addRule'); });
    const originalRemove = div.remove;
    div.remove = function(){ unsubscribe(); if(originalRemove) originalRemove.call(this); };
    return div;
  }
}
