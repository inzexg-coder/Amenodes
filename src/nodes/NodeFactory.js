import { NumberNode } from './NumberNode.js';
import { GroupNode } from './GroupNode.js';
import { CalcNode } from './CalcNode.js';
import { OutputNode } from './OutputNode.js';
import { MapNode } from './MapNode.js';
import { ConstantNode } from './ConstantNode.js';
import { i18n } from '../i18n/LanguageManager.js';
import { ConfidenceIntervalNode } from './ConfidenceIntervalNode.js';

export class NodeFactory {
  static createNode(type, options = {}) {
    const { id, x, y, title, ...rest } = options;
    
    const defaultTitle = i18n.t(`nodes.${type}`);
    const finalTitle = title || defaultTitle;
    
    switch(type) {
      case 'number':
        return new NumberNode(id || 0, x || 0, y || 0, finalTitle, rest.val ?? 0);
      case 'constant':
        return new ConstantNode(id || 0, x || 0, y || 0, finalTitle, rest.val ?? 0);
      case 'group':
        return new GroupNode(id || 0, x || 0, y || 0, finalTitle, rest.vals || [{ name: `${i18n.t('common.value')} 1`, val: 0 }]);
      case 'calc':
        return new CalcNode(id || 0, x || 0, y || 0, finalTitle, rest.calcType || 'div3');
      case 'output':
        return new OutputNode(id || 0, x || 0, y || 0, finalTitle, rest.rows || []);
      case 'map':
        return new MapNode(id || 0, x || 0, y || 0, finalTitle, rest.maps || [{ x: 0, y: 0 }]);
      case 'confidenceInterval':
        return new ConfidenceIntervalNode(id || 0, x || 0, y || 0, finalTitle);
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }

  static createNumberAt(x, y, value = 0) {
    return this.createNode('number', { x, y, val: value });
  }

  static createConstantAt(x, y, value = 0) {
    return this.createNode('constant', { x, y, val: value });
  }

  static createGroupAt(x, y) {
    return this.createNode('group', { x, y, vals: [{ name: `${i18n.t('common.value')} 1`, val: 0 }] });
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

  static createConfidenceIntervalAt(x, y) {
    return this.createNode('confidenceInterval', { x, y });
  }
}
