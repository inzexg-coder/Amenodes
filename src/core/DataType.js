export const DataType = {};

export class TypeSystem {
  constructor() {
    this.typeDefinitions = new Map();
  }

  registerType(typeName, definition) {
    this.typeDefinitions.set(typeName, definition);
    DataType[typeName.toUpperCase()] = typeName;
  }

  getTypeDefinition(typeName) {
    return this.typeDefinitions.get(typeName);
  }

  canConnect(sourceType, sourceNodeType, targetType, targetNodeType) {
    const sourceDef = this.getTypeDefinition(sourceType);
    const targetDef = this.getTypeDefinition(targetType);
    if (!sourceDef || !targetDef) return false;
    if (!targetDef.canHaveIncomingEdges) return false;
    if (!sourceDef.canHaveOutgoingEdges) return false;
    if (targetDef.allowedInputTypes.length === 0) return true;
    return targetDef.allowedInputTypes.includes(sourceType);
  }

  getNodeType(node) {
    // Try constructor metadata first
    const meta = node.constructor && node.constructor.metadata;
    if (meta && meta.dataType) {
      return meta.dataType;
    }
    // Fallback: try node.type from registry
    if (node.type && this.typeRegistry) {
      const reg = this.typeRegistry.get(node.type);
      if (reg && reg.metadata && reg.metadata.dataType) {
        return reg.metadata.dataType;
      }
    }
    // Last resort: derive from node type name
    const fallbackMap = { number: 'num', constant: 'num', calc: 'uncert', mean: 'num', sem: 'num', output: 'array', map: 'array', group: 'array' };
    return fallbackMap[node.type] || 'unknown';
  }

  initFromNodeRegistry(nodeRegistry) {
    this.typeRegistry = nodeRegistry;
    for (const [type, { metadata }] of nodeRegistry.entries()) {
      if (metadata.dataType) {
        this.registerType(metadata.dataType, {
          name: metadata.dataType,
          canHaveIncomingEdges: metadata.canHaveIncomingEdges ?? true,
          canHaveOutgoingEdges: metadata.canHaveOutgoingEdges ?? true,
          allowedInputTypes: metadata.allowedInputTypes ?? [],
          defaultValue: metadata.defaultValue ?? null
        });
      }
    }
  }
}

export const typeSystem = new TypeSystem();
