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

async function loadTranslationsForNode(fileName) {
  const baseUrl = getBaseUrl();
  const baseName = fileName.replace('.js', '');
  
  try {
    const enUrl = `${baseUrl}locales/en/${baseName}.js`;
    const enModule = await import(enUrl);
    if (enModule.default) {
      Object.assign(nodeTranslations.en, enModule.default);
    }
  } catch (err) {}
  
  try {
    const ruUrl = `${baseUrl}locales/ru/${baseName}.js`;
    const ruModule = await import(ruUrl);
    if (ruModule.default) {
      Object.assign(nodeTranslations.ru, ruModule.default);
    }
  } catch (err) {}
}

async function registerAllNodes() {
  for (const { ctor, metadata, fileName } of nodesManifest) {
    if (metadata?.type) {
      nodeRegistry.set(metadata.type, { ctor, metadata });
      await loadTranslationsForNode(fileName);
    }
  }

  i18n.setNodeTranslations(nodeTranslations);
  
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
