import { nodesManifest } from './manifest.js';
import { nodeTranslations } from './translations.js';

export const nodeRegistry = new Map();

for (const { ctor, metadata } of nodesManifest) {
  if (metadata && metadata.type) {
    nodeRegistry.set(metadata.type, { ctor, metadata });
    console.log(`[NodeRegistry] Registered: ${metadata.type}`);
  }
}

export { nodeTranslations };

export function getNodeMetadata(type) {
  return nodeRegistry.get(type)?.metadata || null;
}

export function getNodeClass(type) {
  return nodeRegistry.get(type)?.ctor || null;
}

export function getAllTypes() {
  return Array.from(nodeRegistry.keys());
}
