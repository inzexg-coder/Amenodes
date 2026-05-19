import { nodesManifest } from './manifest/this-manifest.js';

export const nodeRegistry = new Map();
export const nodeTranslations = { en: {}, ru: {} };

async function loadTranslationsForNode(fileName) {
  const baseName = fileName.replace('.js', '');
  
  try {
    const enModule = await import(`./locales/en/${baseName}.js`);
    if (enModule.default) {
      Object.assign(nodeTranslations.en, enModule.default);
      console.log(`[NodeRegistry] Loaded en translations for ${baseName}`);
    }
  } catch (err) {
  }
  
  try {
    const ruModule = await import(`./locales/ru/${baseName}.js`);
    if (ruModule.default) {
      Object.assign(nodeTranslations.ru, ruModule.default);
      console.log(`[NodeRegistry] Loaded ru translations for ${baseName}`);
    }
  } catch (err) {
  }
}

async function registerAllNodes() {
  for (const { ctor, metadata, fileName } of nodesManifest) {
    if (metadata?.type) {
      nodeRegistry.set(metadata.type, { ctor, metadata });
      console.log(`[NodeRegistry] Registered: ${metadata.type} from ${fileName}`);
      
      await loadTranslationsForNode(fileName);
    }
  }
  
  console.log(`[NodeRegistry] Total nodes: ${nodeRegistry.size}`);
  console.log(`[NodeRegistry] Translations loaded: en=${Object.keys(nodeTranslations.en).length}, ru=${Object.keys(nodeTranslations.ru).length}`);
}

export async function loadAllNodes() {
  await registerAllNodes();
}

export function getNodeClass(type) {
  return nodeRegistry.get(type)?.ctor || null;
}

export function getNodeMetadata(type) {
  return nodeRegistry.get(type)?.metadata || null;
}
