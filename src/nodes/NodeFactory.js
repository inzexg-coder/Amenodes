import { NumberNode } from './NumberNode.js';
import { GroupNode } from './GroupNode.js';
import { CalcNode } from './CalcNode.js';
import { OutputNode } from './OutputNode.js';
import { MapNode } from './MapNode.js';
import { ConstantNode } from './ConstantNode.js';

console.log('[NodeFactory] Module loading');

export class NodeFactory {
  static createNode(type, options = {}) {
    console.log('[NodeFactory] createNode called:', { type, options });
    const { id, x, y, title, ...rest } = options;
    let node;
    
    switch(type) {
      case 'number':
        node = new NumberNode(id || 0, x || 0, y || 0, title || 'Число', rest.val ?? 0);
        break;
      case 'constant':
        console.log('[NodeFactory] Creating ConstantNode with val:', rest.val);
        node = new ConstantNode(id || 0, x || 0, y || 0, title || 'Константа', rest.val ?? 0);
        break;
      case 'group':
        node = new GroupNode(id || 0, x || 0, y || 0, title || 'Группа чисел', rest.vals || [{ name: "Значение 1", val: 0 }]);
        break;
      case 'calc':
        node = new CalcNode(id || 0, x || 0, y || 0, title || 'Погрешность', rest.calcType || 'div3');
        break;
      case 'output':
        node = new OutputNode(id || 0, x || 0, y || 0, title || 'Вывод', rest.rows || []);
        break;
      case 'map':
        node = new MapNode(id || 0, x || 0, y || 0, title || 'Карта', rest.maps || [{ x: 0, y: 0 }]);
        break;
      default:
        console.error('[NodeFactory] Unknown node type:', type);
        throw new Error(`Unknown node type: ${type}`);
    }
    
    console.log('[NodeFactory] Node created:', { type, id: node.id, value: node.value });
    return node;
  }

  static createNumberAt(x, y, value = 0) {
    console.log('[NodeFactory] createNumberAt:', { x, y, value });
    return this.createNode('number', { x, y, val: value });
  }

  static createConstantAt(x, y, value = 0) {
    console.log('[NodeFactory] ===== createConstantAt CALLED =====');
    console.log('[NodeFactory] createConstantAt args:', { x, y, value });
    const node = this.createNode('constant', { x, y, val: value });
    console.log('[NodeFactory] createConstantAt returning node with value:', node.value);
    return node;
  }

  static createGroupAt(x, y) {
    return this.createNode('group', { x, y, vals: [{ name: "Значение 1", val: 0 }] });
  }

  static createOutputAt(x, y) {
    return this.createNode('output', { x, y, rows: [] });
  }

  static createCalcAt(x, y, calcType, title) {
    return this.createNode('calc', { x, y, calcType, title });
  }

  static createMapAt(x, y) {
    return this.createNode('map', { x, y, maps: [{ x: 0, y: 0 }] });
  }
}

console.log('[NodeFactory] Module loaded');
