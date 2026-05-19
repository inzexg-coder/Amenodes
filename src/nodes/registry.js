import { nodesManifest } from './manifest/this-manifest.js';
import { i18n } from '../i18n/LanguageManager.js';

export const nodeRegistry = new Map();
export const nodeTranslations = { en: {}, ru: {} };

function getBaseUrl() {
  const isPreview = window.location.pathname.includes('/preview/');
  if (isPreview) {
    const match = window.location.pathname.match(/\/preview\/([^\/]+)/);
    const branch = match ? match[1] : 'main';
    return `https://amenoke.ru/preview/${branch}/src/nodes/`;
  }
  return '/src/nodes/';
}

function deepMerge(target, source) {
  if (!source) return target;
  const result = { ...target };
  for (const key in source) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}

async function loadTranslationsForNode(fileName) {
  const baseUrl = getBaseUrl();
  const baseName = fileName.replace('.js', '');

  try {
    const enUrl = `${baseUrl}locales/en/${baseName}.js`;
    const enModule = await import(enUrl);
    if (enModule.default) {
      nodeTranslations.en = deepMerge(nodeTranslations.en, enModule.default);
      console.log(`Loaded EN translations for ${baseName}`);
    }
  } catch (err) {
    console.warn(`Failed to load EN translations for ${baseName}:`, err.message);
  }

  try {
    const ruUrl = `${baseUrl}locales/ru/${baseName}.js`;
    const ruModule = await import(ruUrl);
    if (ruModule.default) {
      nodeTranslations.ru = deepMerge(nodeTranslations.ru, ruModule.default);
      console.log(`Loaded RU translations for ${baseName}`);
    }
  } catch (err) {
    console.warn(`Failed to load RU translations for ${baseName}:`, err.message);
  }
}

async function registerAllNodes() {
  for (const { ctor, metadata, fileName } of nodesManifest) {
    if (metadata?.type) {
      nodeRegistry.set(metadata.type, { ctor, metadata });
      ctor.metadata = metadata;
      await loadTranslationsForNode(fileName);
    }
  }
  
  i18n.setNodeTranslations(nodeTranslations);
  
  console.log(`[NodeRegistry] Total nodes: ${nodeRegistry.size}`);
  console.log(`[NodeRegistry] EN sections: ${Object.keys(nodeTranslations.en).join(', ')}`);
  console.log(`[NodeRegistry] RU sections: ${Object.keys(nodeTranslations.ru).join(', ')}`);
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
