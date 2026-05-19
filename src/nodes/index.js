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

function getNodesListUrl() {
  const isPreview = window.location.pathname.includes('/preview/');
  if (isPreview) {
    const match = window.location.pathname.match(/\/preview\/([^\/]+)/);
    const branch = match ? match[1] : 'main';
    return `https://amenoke.ru/preview/${branch}/src/nodes-list.json`;
  }
  return '/src/nodes-list.json';
}

async function loadNode(fileName, baseUrl) {
  try {
    const module = await import(`${baseUrl}${fileName}`);
    const metadata = module.metadata;
    
    if (!metadata || !metadata.type) {
      console.warn(`[NodeRegistry] Skipping ${fileName}: missing metadata.type`);
      return false;
    }
    
    const NodeClass = module[metadata.type];
    if (!NodeClass) {
      console.warn(`[NodeRegistry] Skipping ${fileName}: class ${metadata.type} not found`);
      return false;
    }
    
    nodeRegistry.set(metadata.type, { ctor: NodeClass, metadata });
    
    if (metadata.translations) {
      for (const lang of ['en', 'ru']) {
        if (metadata.translations[lang]) {
          Object.assign(nodeTranslations[lang], metadata.translations[lang]);
        }
      }
    }
    
    console.log(`[NodeRegistry] Loaded: ${metadata.type} (${fileName})`);
    return true;
  } catch (err) {
    console.error(`[NodeRegistry] Failed to load ${fileName}:`, err);
    return false;
  }
}

export async function loadAllNodes() {
  const baseUrl = getBaseUrl();
  const listUrl = getNodesListUrl();
  
  console.log('[NodeRegistry] Fetching nodes list from:', listUrl);
  
  try {
    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const files = await response.json();
    
    if (!Array.isArray(files) || files.length === 0) {
      console.warn('[NodeRegistry] No nodes found in nodes-list.json');
      return;
    }
    
    console.log(`[NodeRegistry] Found ${files.length} node files:`, files);

    for (const fileName of files) {
      await loadNode(fileName, baseUrl);
    }
    
    console.log(`[NodeRegistry] Successfully loaded ${nodeRegistry.size} nodes`);
  } catch (err) {
    console.error('[NodeRegistry] Failed to load nodes list:', err);
  }
}

export function getNodeMetadata(type) {
  return nodeRegistry.get(type)?.metadata || null;
}

export function getNodeClass(type) {
  return nodeRegistry.get(type)?.ctor || null;
}

export function getAllNodeTypes() {
  return Array.from(nodeRegistry.keys());
}

export function clearNodeRegistry() {
  nodeRegistry.clear();
  nodeTranslations.en = {};
  nodeTranslations.ru = {};
}
