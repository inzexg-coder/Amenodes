import { nodesManifest } from './manifest/manifest.js';

export const nodeRegistry = new Map();
export const nodeTranslations = { en: {}, ru: {} };
for (const { ctor, metadata } of nodesManifest) {
  if (metadata?.type) {
    nodeRegistry.set(metadata.type, { ctor, metadata });
    
    if (metadata.translations) {
      for (const lang of ['en', 'ru']) {
        if (metadata.translations[lang]) {
          Object.assign(nodeTranslations[lang], metadata.translations[lang]);
        }
      }
    }
  }
}

console.log(`[NodeRegistry] Total: ${nodeRegistry.size} nodes`);

export function getNodeMetadata(type) {
  return nodeRegistry.get(type)?.metadata || null;
}

export function getNodeClass(type) {
  return nodeRegistry.get(type)?.ctor || null;
}

export function getAllNodeTypes() {
  return Array.from(nodeRegistry.keys());
}

export function isNodeTypeRegistered(type) {
  return nodeRegistry.has(type);
}
