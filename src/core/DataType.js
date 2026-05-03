export const DataType = {
  NUM: 'num',
  ARRAY: 'array',
  AUTO: 'auto',
  UNCERT: 'uncert',
  LIST: 'list',
  WLIST: 'wlist'
  INTERVAL: 'interval'
};

export class TypeSystem {
  constructor() {
    this.typeDefinitions = new Map();
    this.registerBuiltinTypes();
  }

  registerBuiltinTypes() {
    this.registerType(DataType.NUM, {
      name: 'Число',
      canHaveIncomingEdges: false,
      canHaveOutgoingEdges: true,
      allowedInputTypes: [],
      allowedOutputTypes: [DataType.NUM, DataType.ARRAY, DataType.AUTO, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      defaultValue: 0
    });

    this.registerType(DataType.ARRAY, {
      name: 'Группа',
      canHaveIncomingEdges: false,
      canHaveOutgoingEdges: true,
      allowedInputTypes: [],
      allowedOutputTypes: [DataType.NUM, DataType.ARRAY, DataType.AUTO, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      defaultValue: []
    });

    this.registerType(DataType.AUTO, {
      name: 'Вывод',
      canHaveIncomingEdges: true,
      canHaveOutgoingEdges: false,
      allowedInputTypes: [DataType.NUM, DataType.ARRAY, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      allowedOutputTypes: [],
      defaultValue: null
    });

    this.registerType(DataType.UNCERT, {
      name: 'Погрешность',
      canHaveIncomingEdges: true,
      canHaveOutgoingEdges: true,
      allowedInputTypes: [DataType.NUM, DataType.ARRAY, DataType.UNCERT],
      allowedOutputTypes: [DataType.NUM, DataType.ARRAY, DataType.AUTO, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      defaultValue: null
    });

    this.registerType(DataType.LIST, {
      name: 'Карта (список)',
      canHaveIncomingEdges: true,
      canHaveOutgoingEdges: true,
      allowedInputTypes: [DataType.NUM, DataType.ARRAY, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      allowedOutputTypes: [DataType.AUTO, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      defaultValue: []
    });

    this.registerType(DataType.WLIST, {
      name: 'Карта (весовая)',
      canHaveIncomingEdges: true,
      canHaveOutgoingEdges: true,
      allowedInputTypes: [DataType.NUM, DataType.ARRAY, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      allowedOutputTypes: [DataType.AUTO, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      defaultValue: []
    });

    this.registerType(DataType.INTERVAL, {
      name: 'Доверительный интервал',
      canHaveIncomingEdges: true,
      canHaveOutgoingEdges: true,
      allowedInputTypes: [DataType.NUM, DataType.ARRAY, DataType.UNCERT, DataType.LIST, DataType.WLIST],
      allowedOutputTypes: [DataType.AUTO, DataType.NUM, DataType.UNCERT],
      defaultValue: null
    });
  }

  registerType(typeName, definition) {
    this.typeDefinitions.set(typeName, definition);
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
    if (node.type === 'number') return DataType.NUM;
    if (node.type === 'constant') return DataType.NUM;
    if (node.type === 'group') return DataType.ARRAY;
    if (node.type === 'output') return DataType.AUTO;
    if (node.type === 'calc') return DataType.UNCERT;
    if (node.type === 'map') {
      return node.unmappedMode === 'separate' ? DataType.WLIST : DataType.LIST;
    }
    if (node.type === 'confidenceInterval') return DataType.INTERVAL;
    return DataType.NUM;
  }
}

export const typeSystem = new TypeSystem();
