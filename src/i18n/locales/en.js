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
    map: 'Map',
    confidenceInterval: 'Confidence Interval'
  },

  calcTypes: {
    div3: 'Measurement Uncertainty',
    div_sqrt12: 'Rounding Uncertainty',
    sqrt_sum_sq: 'Combined Uncertainty',
    result: 'Result',
    inputs: 'inputs'
  },

  confidence: {
    uncertaintyInputs: 'Uncertainty inputs',
    multiplierInputs: 'Multiplier inputs'
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
    confidenceInterval: 'Confidence Interval',
    mapTransform: 'Map',
    markImportant: 'Mark IMPORTANT node',
    unmarkImportant: 'Remove IMPORTANT mark'
  },

  optimizations: {
    virtualization: 'Virtualization',
    virtualizationDesc: 'Culling of invisible nodes',
    virtualizationPros: 'Reduces DOM elements, speeds up rendering',
    virtualizationCons: 'Load may be noticeable when scrolling',
    
    gpuTransforms: 'GPU transforms',
    gpuTransformsDesc: 'Using translate3d for hardware acceleration',
    gpuTransformsPros: 'Provides smooth 60 FPS animation',
    gpuTransformsCons: 'Graphics artifacts may occur on some GPUs',
    
    throttleMouse: 'Mouse throttle',
    throttleMouseDesc: 'Rate limiting of mouse event processing',
    throttleMousePros: 'Reduces lag during fast movement',
    throttleMouseCons: 'Creates micro-delay in response',
    
    batchRAF: 'Batch RAF updates',
    batchRAFDesc: 'Grouping changes in requestAnimationFrame',
    batchRAFPros: 'Reduces number of page repaints',
    batchRAFCons: 'Updates are not instant',
    
    cacheHeight: 'Height cache',
    cacheHeightDesc: 'Caching calculated node heights',
    cacheHeightPros: 'Speeds up positioning calculations',
    cacheHeightCons: 'Requires cache invalidation on changes',
    
    willChange: 'will-change',
    willChangeDesc: 'Hinting browser about upcoming changes',
    willChangePros: 'Speeds up animations and transforms',
    willChangeCons: 'Consumes more RAM',
    
    passiveEvents: 'Passive events',
    passiveEventsDesc: 'Optimizing scroll/touch events',
    passiveEventsPros: 'Provides smooth page scrolling',
    passiveEventsCons: 'Not supported in older browsers',
    
    simplifyShadows: 'Simplify shadows',
    simplifyShadowsDesc: 'Disabling shadows while dragging',
    simplifyShadowsPros: 'Reduces repaint load',
    simplifyShadowsCons: 'Visual shadows disappear during drag',
    
    deferredEdges: 'Deferred edges',
    deferredEdgesDesc: 'Low priority edge rendering',
    deferredEdgesPros: 'Speeds up node movement',
    deferredEdgesCons: 'Lines may lag behind nodes',
    
    cssContainment: 'CSS containment',
    cssContainmentDesc: 'Using contain:layout',
    cssContainmentPros: 'Isolates node layout from page',
    cssContainmentCons: 'May clip node content',
    
    debounceRender: 'Debounce render',
    debounceRenderDesc: 'Delayed rendering on changes',
    debounceRenderPros: 'Saves CPU resources during rapid changes',
    debounceRenderCons: 'Creates noticeable update delay',
    
    cacheBoundingRect: 'Cache getBoundingClientRect',
    cacheBoundingRectDesc: 'Caching element positions',
    cacheBoundingRectPros: 'Speeds up position calculations',
    cacheBoundingRectCons: 'Requires cache updates during movement',
    
    pointerEventsLines: 'Pointer-events lines',
    pointerEventsLinesDesc: 'Configuring line click areas',
    pointerEventsLinesPros: 'Speeds up click processing',
    pointerEventsLinesCons: 'Performance impact is minor',
    
    lazyComputations: 'Lazy computations',
    lazyComputationsDesc: 'Offloading computations to setTimeout',
    lazyComputationsPros: 'UI remains responsive',
    lazyComputationsCons: 'Results appear with delay',
    
    typedArrays: 'Typed arrays',
    typedArraysDesc: 'Using Float32Array for data',
    typedArraysPros: 'Instant memory access',
    typedArraysCons: 'Makes code more complex and harder to debug',
    
    limitHistory: 'Limit history',
    limitHistoryDesc: 'Reducing history depth (50->20 steps)',
    limitHistoryPros: 'Reduces memory consumption',
    limitHistoryCons: 'Fewer undo/redo steps available',
    
    cacheText: 'Text cache',
    cacheTextDesc: 'Caching string values',
    cacheTextPros: 'Speeds up search and comparison',
    cacheTextCons: 'Requires cache invalidation',
    
    webglInstancing: 'WebGL instancing',
    webglInstancingDesc: 'Rendering thousands of nodes via GPU',
    webglInstancingPros: 'Provides 60 FPS for 5000+ nodes',
    webglInstancingCons: 'Requires WebGL support',
    
    designQuality: 'Design quality',
    designQualityDesc: 'Reducing visual quality',
    designQualityPros: 'Increases FPS up to +300%',
    designQualityCons: 'Visual appearance degrades',
    
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
    invalidValue: 'Invalid value',
    requireTwoInputs: 'Exactly 2 inputs required',
    missingUncertaintyOrNumber: 'Need one uncertainty and one number',
    maxTwoInputs: 'Confidence interval can have at most 2 inputs'
  },

  status: {
    noConnections: 'No connections',
    benchmarking: 'Benchmarking optimizations...',
    measuringBaseline: 'Measuring baseline performance...',
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
    language: 'Language',
    addNode: 'Add node'
  },

  nodeMenu: {
    title: 'Nodes'
  },

  nodeDescriptions: {
    number: 'A single numeric value that can be edited inline',
    constant: 'A constant value that never changes',
    group: 'A collection of named numeric values',
    calc: 'Uncertainty calculation node (measurement, rounding, combined)',
    output: 'Displays the results of connected nodes in a table',
    map: 'Maps input values to output values using X→Y rules',
    confidenceInterval: 'Calculates confidence interval by multiplying uncertainty with a multiplier'
  }
};
