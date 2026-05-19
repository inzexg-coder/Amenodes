import { nodeRegistry } from './registry.js';
import { i18n } from '../i18n/LanguageManager.js';

export class NodeFactory {
  static getAvailableNodeTypes() {
    return Array.from(nodeRegistry.values()).map(entry => entry.metadata);
  }

  static getMetadata(type) {
    return nodeRegistry.get(type)?.metadata || null;
  }

  static getNodeClass(type) {
    return nodeRegistry.get(type)?.ctor || null;
  }

  static createNode(type, options = {}) {
    const entry = nodeRegistry.get(type);
    if (!entry) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    const { id, x, y, title, ...customParams } = options;
    const defaultTitle = i18n.t(entry.metadata.nameKey);
    const finalTitle = title || defaultTitle;
    
    return new entry.ctor(id || 0, x || 0, y || 0, finalTitle, customParams);
  }


  static createNodeAt(type, x, y, customParams = {}) {
    return this.createNode(type, { x, y, ...customParams });
  }

  static hasNodeType(type) {
    return nodeRegistry.has(type);
  }

  static getAllTypes() {
    return Array.from(nodeRegistry.keys());
  }
}
