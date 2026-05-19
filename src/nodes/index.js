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

    if (mod.metadata.translations) {
      const translations = mod.metadata.translations;
      for (const lang of ['en', 'ru']) {
        if (translations[lang]) {
          Object.assign(nodeTranslations[lang], translations[lang]);
        }
      }
    }
  }
}
