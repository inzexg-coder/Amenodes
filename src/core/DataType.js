export const DataType = {}; 

class TypeSystem {
  constructor() {
    this.typeDefinitions = new Map();
  }

  registerType(typeName, definition) {
    this.typeDefinitions.set(typeName, definition);
    DataType[typeName.toUpperCase()] = typeName; // для удобства
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
    const meta = node.constructor.metadata;
    if (meta && meta.dataType) {
      return meta.dataType;
    }
    return 'unknown';
  }

  initFromNodeRegistry(nodeRegistry) {
    for (const [type, { metadata }] of nodeRegistry.entries()) {
      if (metadata.dataType) {
        this.registerType(metadata.dataType, {
          name: metadata.dataTypeName || metadata.nameKey,
          canHaveIncomingEdges: metadata.canHaveIncomingEdges ?? true,
          canHaveOutgoingEdges: metadata.canHaveOutgoingEdges ?? true,
          allowedInputTypes: metadata.allowedInputTypes ?? [],
          allowedOutputTypes: metadata.allowedOutputTypes ?? [],
          defaultValue: metadata.defaultValue ?? null
        });
      }
    }
  }
}

export const typeSystem = new TypeSystem();
