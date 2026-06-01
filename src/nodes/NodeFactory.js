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

  static async createNode(type, options = {}) {
    const entry = nodeRegistry.get(type);
    if (!entry) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    const { id, x, y, title, ...customParams } = options;
    const defaultTitle = i18n.t(entry.metadata.nameKey);
    const finalTitle = title || defaultTitle;
    
    const NodeClass = entry.ctor;

    if (typeof NodeClass.onCreate === 'function') {
      const node = await NodeClass.onCreate(null, x || 0, y || 0, customParams);
      if (node) {
        if (id && !node.id) node.id = id;
        if (finalTitle && node.title === defaultTitle) node.title = finalTitle;
        return node;
      }
      return null;
    }
    
    return new NodeClass(id || 0, x || 0, y || 0, finalTitle, customParams);
  }

  static async createNodeAt(type, x, y, customParams = {}) {
    return await this.createNode(type, { x, y, ...customParams });
  }

  static hasNodeType(type) {
    return nodeRegistry.has(type);
  }

  static getAllTypes() {
    return Array.from(nodeRegistry.keys());
  }
}
