import { nodeRegistry } from './index.js';
import { i18n } from '../i18n/LanguageManager.js';

export class NodeFactory {
  static getAvailableNodeTypes() {
    return Array.from(nodeRegistry.values()).map(entry => entry.metadata);
  }

  static getMetadata(type) {
    return nodeRegistry.get(type)?.metadata || null;
  }

  static createNode(type, options = {}) {
    const entry = nodeRegistry.get(type);
    if (!entry) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    const { id, x, y, title, ...rest } = options;
    const defaultTitle = i18n.t(entry.metadata.nameKey);
    const finalTitle = title || defaultTitle;
    
    return new entry.ctor(id || 0, x || 0, y || 0, finalTitle, rest);
  }

  static createNodeAt(type, x, y, customParams = {}) {
    return this.createNode(type, { x, y, ...customParams });
  }
}
