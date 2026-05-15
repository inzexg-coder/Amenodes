import { NumberNode, metadata as numberMeta } from './NumberNode.js';
import { ConstantNode, metadata as constantMeta } from './ConstantNode.js';
import { GroupNode, metadata as groupMeta } from './GroupNode.js';
import { CalcNode, metadata as calcMeta } from './CalcNode.js';
import { OutputNode, metadata as outputMeta } from './OutputNode.js';
import { MapNode, metadata as mapMeta } from './MapNode.js';
import { ConfidenceIntervalNode, metadata as confidenceMeta } from './ConfidenceIntervalNode.js';
import { i18n } from '../i18n/LanguageManager.js';

const nodeRegistry = new Map();
const nodeTypesList = [];

function registerNode(type, ctor, metadata) {
  nodeRegistry.set(type, { ctor, metadata });
  nodeTypesList.push({ type, ...metadata });
}

registerNode('number', NumberNode, numberMeta);
registerNode('constant', ConstantNode, constantMeta);
registerNode('group', GroupNode, groupMeta);
registerNode('calc', CalcNode, calcMeta);
registerNode('output', OutputNode, outputMeta);
registerNode('map', MapNode, mapMeta);
registerNode('confidenceInterval', ConfidenceIntervalNode, confidenceMeta);

export class NodeFactory {
  static getAvailableNodeTypes() {
    return nodeTypesList;
  }

  static getNodeMetadata(type) {
    return nodeRegistry.get(type)?.metadata || null;
  }

  static createNode(type, options = {}) {
    const registered = nodeRegistry.get(type);
    if (!registered) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    const { ctor } = registered;
    const { id, x, y, title, ...rest } = options;
    
    const defaultTitle = i18n.t(`nodes.${type}`);
    const finalTitle = title || defaultTitle;
    
    switch(type) {
      case 'number':
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest.val ?? 0);
      case 'constant':
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest.val ?? 0);
      case 'group':
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest.vals || [{ name: `${i18n.t('common.value')} 1`, val: 0 }]);
      case 'calc':
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest.calcType || 'div3');
      case 'output':
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest.rows || []);
      case 'map':
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest.maps || [{ x: 0, y: 0 }]);
      case 'confidenceInterval':
        return new ctor(id || 0, x || 0, y || 0, finalTitle);
      default:
        return new ctor(id || 0, x || 0, y || 0, finalTitle, rest);
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
