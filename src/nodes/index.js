export const nodeRegistry = new Map();
export const nodeTranslations = { en: {}, ru: {} };

const nodeModules = import.meta.glob('./*.js', { eager: true });

for (const path in nodeModules) {
  if (path === './index.js') continue;
  if (path.includes('./_template')) continue;
  if (path.includes('./locales')) continue;
  
  const mod = nodeModules[path];
  
  if (mod.metadata && mod[mod.metadata.type]) {
    const nodeClass = mod[mod.metadata.type];
    nodeRegistry.set(mod.metadata.type, {
      ctor: nodeClass,
      metadata: mod.metadata
    });
  }
}

const enModules = import.meta.glob('./locales/en/*.js', { eager: true });
const ruModules = import.meta.glob('./locales/ru/*.js', { eager: true });

for (const path in enModules) {
  const translations = enModules[path].default;
  Object.assign(nodeTranslations.en, translations);
}

for (const path in ruModules) {
  const translations = ruModules[path].default;
  Object.assign(nodeTranslations.ru, translations);
}
