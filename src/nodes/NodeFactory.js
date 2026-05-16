import { NumberNode, metadata as numberMeta } from './NumberNode.js';
import { GroupNode, metadata as groupMeta } from './GroupNode.js';
import { CalcNode, metadata as calcMeta } from './CalcNode.js';
import { OutputNode, metadata as outputMeta } from './OutputNode.js';
import { MapNode, metadata as mapMeta } from './MapNode.js';
import { ConstantNode, metadata as constantMeta } from './ConstantNode.js';
import { ConfidenceIntervalNode, metadata as confidenceMeta } from './ConfidenceIntervalNode.js';
import { i18n } from '../i18n/LanguageManager.js';

const nodeRegistry = new Map();
const nodeTypesList = [];
const categoryNodes = new Map();

function registerNode(type, ctor, metadata) {
  nodeRegistry.set(type, { ctor, metadata });
  
  if (metadata.isCategory && metadata.subnodes) {
    categoryNodes.set(type, metadata);
    nodeTypesList.push({
      type: type,
      nameKey: metadata.nameKey,
      descriptionKey: metadata.descriptionKey,
      author: metadata.author,
      github: metadata.github,
      icon: metadata.icon,
      isCategory: true,
      categoryName: metadata.categoryName,
      subnodes: metadata.subnodes
    });
  } else {
    nodeTypesList.push({
      type: type,
      nameKey: metadata.nameKey,
      descriptionKey: metadata.descriptionKey,
      author: metadata.author,
      github: metadata.github,
      icon: metadata.icon
    });
  }
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

  static getCategorySubnodes(categoryType) {
    const category = categoryNodes.get(categoryType);
    return category ? category.subnodes : [];
  }

  static getMetadata(type) {
    const entry = nodeRegistry.get(type);
    return entry ? entry.metadata : null;
  }

  static createNode(type, options = {}) {
    const entry = nodeRegistry.get(type);
    if (!entry) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    const { id, x, y, title, ...rest } = options;
    const defaultTitle = i18n.t(entry.metadata.nameKey);
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
