import { nodesManifest } from './manifest/this-manifest.js';
import { i18n } from '../i18n/LanguageManager.js';
import { typeSystem } from '../core/DataType.js';

const nodeTypeConfig = {
  number:  { dataType: 'num',   allowedInputTypes: [],                                   canHaveIncomingEdges: false, canHaveOutgoingEdges: true,  defaultValue: 0 },
  constant:{ dataType: 'num',   allowedInputTypes: [],                                   canHaveIncomingEdges: false, canHaveOutgoingEdges: true,  defaultValue: 0 },
  group:   { dataType: 'array', allowedInputTypes: [],                                   canHaveIncomingEdges: false, canHaveOutgoingEdges: true,  defaultValue: [] },
  calc:    { dataType: 'uncert',allowedInputTypes: ['num','array','uncert','list','wlist'],canHaveIncomingEdges: true, canHaveOutgoingEdges: true,  defaultValue: null },
  output:  { dataType: 'auto',  allowedInputTypes: ['num','array','uncert','list','wlist'],canHaveIncomingEdges: true, canHaveOutgoingEdges: false, defaultValue: null },
  map:     { dataType: 'list',  allowedInputTypes: ['num','array','uncert','list','wlist'],canHaveIncomingEdges: true, canHaveOutgoingEdges: true,  defaultValue: [] },
  mean:    { dataType: 'num',   allowedInputTypes: ['num','array','list','wlist','uncert','auto'],canHaveIncomingEdges: true, canHaveOutgoingEdges: true, defaultValue: null },
  sem:     { dataType: 'num',   allowedInputTypes: ['array','list','wlist','num'],        canHaveIncomingEdges: true, canHaveOutgoingEdges: true,  defaultValue: null },
};

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
      var cfg = nodeTypeConfig[metadata.type];
      if (cfg) {
        metadata.dataType = cfg.dataType;
        metadata.allowedInputTypes = cfg.allowedInputTypes;
        metadata.canHaveIncomingEdges = cfg.canHaveIncomingEdges;
        metadata.canHaveOutgoingEdges = cfg.canHaveOutgoingEdges;
        metadata.defaultValue = cfg.defaultValue;
        typeSystem.registerType(cfg.dataType, {
          name: cfg.dataType,
          canHaveIncomingEdges: cfg.canHaveIncomingEdges,
          canHaveOutgoingEdges: cfg.canHaveOutgoingEdges,
          allowedInputTypes: cfg.allowedInputTypes,
          defaultValue: cfg.defaultValue
        });
      }
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
