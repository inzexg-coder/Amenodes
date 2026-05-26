import { nodesManifest } from './manifest/this-manifest.js';
import { i18n } from '../i18n/LanguageManager.js';

export const nodeRegistry = new Map();
export const nodeTranslations = { en: {}, ru: {} };

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
  const baseName = fileName.replace('.js', '');
  try {
    const enModule = await import(`./locales/en/${baseName}.js`);
    if (enModule.default) {
      nodeTranslations.en = deepMerge(nodeTranslations.en, enModule.default);
      console.log(`Loaded EN translations for ${baseName}`);
    }
  } catch (err) {
    console.warn(`Failed to load EN translations for ${baseName}:`, err.message);
  }
  try {
    const ruModule = await import(`./locales/ru/${baseName}.js`);
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
