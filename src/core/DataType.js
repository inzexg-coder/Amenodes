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
    console.log('Node:', node.type);
    console.log('Constructor metadata:', node.constructor.metadata);
    const meta = node.constructor.metadata;
    if (meta && meta.dataType) {
      console.log('Returning dataType:', meta.dataType);
      return meta.dataType;
    }
    console.log('No metadata or dataType, returning unknown');
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
