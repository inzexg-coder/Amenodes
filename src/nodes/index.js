export const nodeRegistry = new Map();
const modules = import.meta.glob('./*.js', { eager: true });

for (const path in modules) {
  if (path === './index.js') continue;
  if (path.includes('./_template')) continue;
  if (path.includes('./_')) continue;
  
  const mod = modules[path];

  if (mod.metadata && mod[mod.metadata.type]) {
    const nodeClass = mod[mod.metadata.type];
    nodeRegistry.set(mod.metadata.type, {
      ctor: nodeClass,
      metadata: mod.metadata
    });
    console.log(`[NodeRegistry] Registered: ${mod.metadata.type}`);
  } else {
    console.warn(`[NodeRegistry] Skipping ${path} - missing metadata or class`);
  }
}

export const registeredTypes = Array.from(nodeRegistry.keys());

export function getNodeMetadata(type) {
  return nodeRegistry.get(type)?.metadata || null;
}

export function getNodeClass(type) {
  return nodeRegistry.get(type)?.ctor || null;
}
