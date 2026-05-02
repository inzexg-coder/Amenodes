export const en = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    add: 'Add',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    value: 'Value',
    parameter: 'Parameter'
  },

  nodes: {
    number: 'Number',
    constant: 'Constant',
    group: 'Number Group',
    calc: 'Uncertainty',
    output: 'Output',
    map: 'Map'
  },

  calcTypes: {
    div3: 'Measurement Uncertainty',
    div_sqrt12: 'Rounding Uncertainty',
    sqrt_sum_sq: 'Combined Uncertainty',
    result: 'Result',
    inputs: 'inputs'
  },

  map: {
    title: 'Map',
    xCol: 'x',
    yCol: 'y',
    addRule: '+ Add rule',
    passThrough: 'Passthrough',
    separateOutput: 'Separate blue output'
  },

  group: {
    addValue: '+ Add value'
  },

  output: {
    title: 'Output',
    noConnections: 'No connections',
    valueCount: 'values'
  },

  toolbar: {
    undo: 'Undo',
    redo: 'Redo',
    number: 'Number',
    constant: 'Constant',
    group: 'Group',
    output: 'Output',
    export: 'Export',
    import: 'Import',
    clearStorage: 'Clear storage',
    language: 'Language'
  },

  contextMenu: {
    outputAndConnect: 'Output + connect',
    errors: 'Uncertainties',
    measurementError: 'Measurement Uncertainty',
    roundingError: 'Rounding Uncertainty',
    totalError: 'Combined Uncertainty',
    mapTransform: 'Map',
    markImportant: 'Mark IMPORTANT node',
    unmarkImportant: 'Unmark IMPORTANT node'
  },

  optimizations: {
    virtualization: 'Virtualization',
    virtualizationDesc: 'Occlusion culling',
    virtualizationPros: 'Reduces DOM elements',
    virtualizationCons: 'Load may be noticeable',
    
    gpuTransforms: 'GPU transforms',
    gpuTransformsDesc: 'translate3d',
    gpuTransformsPros: 'Smooth 60 FPS',
    gpuTransformsCons: 'Artifacts',
    
    throttleMouse: 'Mouse throttle',
    throttleMouseDesc: 'Rate limiting',
    throttleMousePros: 'Less lag',
    throttleMouseCons: 'Micro-delay',
    
    batchRAF: 'Batch RAF updates',
    batchRAFDesc: 'Batching changes',
    batchRAFPros: 'Fewer repaints',
    batchRAFCons: 'Not instant',
    
    cacheHeight: 'Height cache',
    cacheHeightDesc: 'Node height caching',
    cacheHeightPros: 'Faster calculations',
    cacheHeightCons: 'Invalidation',
    
    willChange: 'will-change',
    willChangeDesc: 'Browser hint',
    willChangePros: 'Smoother animations',
    willChangeCons: 'More memory',
    
    passiveEvents: 'Passive events',
    passiveEventsDesc: 'scroll/touch optimization',
    passiveEventsPros: 'Smooth scrolling',
    passiveEventsCons: 'Older browsers',
    
    simplifyShadows: 'Simplify shadows',
    simplifyShadowsDesc: 'No shadows while dragging',
    simplifyShadowsPros: 'Less repaint',
    simplifyShadowsCons: 'Shadows disappear',
    
    deferredEdges: 'Deferred edges',
    deferredEdgesDesc: 'Low priority connections',
    deferredEdgesPros: 'Faster moving',
    deferredEdgesCons: 'Lines lag',
    
    cssContainment: 'CSS containment',
    cssContainmentDesc: 'contain:layout',
    cssContainmentPros: 'Layout isolation',
    cssContainmentCons: 'Content clipping',
    
    debounceRender: 'Debounce render',
    debounceRenderDesc: 'Delayed render',
    debounceRenderPros: 'Resource saving',
    debounceRenderCons: 'Delay',
    
    cacheBoundingRect: 'Cache getBoundingClientRect',
    cacheBoundingRectDesc: 'Position caching',
    cacheBoundingRectPros: 'Faster calculations',
    cacheBoundingRectCons: 'Cache updates',
    
    pointerEventsLines: 'Pointer-events lines',
    pointerEventsLinesDesc: 'Line area configuration',
    pointerEventsLinesPros: 'Faster clicks',
    pointerEventsLinesCons: 'Minor',
    
    lazyComputations: 'Lazy computations',
    lazyComputationsDesc: 'setTimeout background',
    lazyComputationsPros: 'Responsive UI',
    lazyComputationsCons: 'Delay',
    
    typedArrays: 'Typed arrays',
    typedArraysDesc: 'Float32Array',
    typedArraysPros: 'Instant access',
    typedArraysCons: 'Complex',
    
    limitHistory: 'Limit history',
    limitHistoryDesc: '50->20 steps',
    limitHistoryPros: 'Less memory',
    limitHistoryCons: 'Less history',
    
    cacheText: 'Text cache',
    cacheTextDesc: 'String caching',
    cacheTextPros: 'Faster search',
    cacheTextCons: 'Invalidation',
    
    webglInstancing: 'WebGL instancing',
    webglInstancingDesc: 'Thousands of nodes via GPU',
    webglInstancingPros: '5000+ nodes 60 FPS',
    webglInstancingCons: 'Requires WebGL',
    
    designQuality: 'Design quality',
    designQualityDesc: 'Visual reduction',
    designQualityPros: 'Up to +300% FPS',
    designQualityCons: 'Visuals suffer',
    
    fpsGain: 'FPS gain',
    notMeasured: 'not measured',
    currentQuality: 'Current quality',
    extreme: 'EXTREME',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    simplifiedBy: 'Simplified by'
  },

  modal: {
    notification: 'Notification',
    confirm: 'Confirm',
    enterValue: 'Enter value',
    enterNewValue: 'Enter new value:',
    clearStorageConfirm: 'Clear all saved data?'
  },

  errors: {
    cannotConnect: 'Cannot connect',
    cyclicDependency: 'Cyclic dependency!',
    invalidValue: 'Invalid value'
  },

  status: {
    noConnections: 'No connections',
    benchmarking: 'Benchmarking optimizations...',
    measuringBaseline: 'Measuring baseline...',
    baselineFPS: 'Baseline FPS',
    testing: 'Testing',
    completed: 'Benchmark completed',
    saved: 'Saved'
  },

  dataTypes: {
    num: 'Number',
    array: 'Array',
    auto: 'Auto',
    uncert: 'Uncertainty',
    list: 'List map',
    wlist: 'Weighted list map'
  },

  operations: {
    nodeDeleted: 'Node deleted',
    edgeDeleted: 'Edge deleted',
    graphCleared: 'Graph cleared'
  }
};
