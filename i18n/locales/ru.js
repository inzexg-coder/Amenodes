export const ru = {
  common: {
    ok: 'OK',
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    add: 'Добавить',
    edit: 'Редактировать',
    loading: 'Загрузка...',
    error: 'Ошибка',
    warning: 'Предупреждение',
    info: 'Информация',
    value: 'Значение',
    parameter: 'Параметр'
  },

  nodes: {
    number: 'Число',
    constant: 'Константа',
    group: 'Группа чисел',
    calc: 'Погрешность',
    output: 'Вывод',
    map: 'Карта преобразований'
  },
  
  calcTypes: {
    div3: 'Погрешность измерения',
    div_sqrt12: 'Погрешность округления',
    sqrt_sum_sq: 'Суммарная погрешность',
    result: 'Результат',
    inputs: 'входов'
  },
  
  map: {
    title: 'Карта',
    xCol: 'x',
    yCol: 'y',
    addRule: '+ Добавить правило',
    passThrough: 'Сквозной проход',
    separateOutput: 'Отдельный голубой выход'
  },

  group: {
    addValue: '+ Добавить значение'
  },

  output: {
    title: 'Вывод',
    noConnections: 'Нет связей',
    valueCount: 'знач.'
  },

  toolbar: {
    undo: 'Отменить',
    redo: 'Повторить',
    number: 'Число',
    constant: 'Константа',
    group: 'Группа',
    output: 'Вывод',
    export: 'Экспорт',
    import: 'Импорт',
    clearStorage: 'Очистить сохр.',
    language: 'Язык'
  },
  
  contextMenu: {
    outputAndConnect: 'Вывод + связь',
    errors: 'Погрешности',
    measurementError: 'Погрешность измерения',
    roundingError: 'Погрешность округления',
    totalError: 'Суммарная погрешность',
    mapTransform: 'Карта преобразований',
    markImportant: 'Выделить ВАЖНЫЙ нод',
    unmarkImportant: 'Снять выделение ВАЖНОГО'
  },

  optimizations: {
    virtualization: 'Виртуализация',
    virtualizationDesc: 'Отсечение невидимых нод',
    virtualizationPros: 'Снижает DOM-элементы',
    virtualizationCons: 'Может заметна подгрузка',
    
    gpuTransforms: 'GPU-трансформации',
    gpuTransformsDesc: 'translate3d',
    gpuTransformsPros: 'Плавное 60 FPS',
    gpuTransformsCons: 'Артефакты',
    
    throttleMouse: 'Throttle мыши',
    throttleMouseDesc: 'Ограничение частоты',
    throttleMousePros: 'Меньше лагов',
    throttleMouseCons: 'Микро-задержка',
    
    batchRAF: 'Batch-обновление RAF',
    batchRAFDesc: 'Группировка изменений',
    batchRAFPros: 'Меньше перерисовок',
    batchRAFCons: 'Не мгновенный',
    
    cacheHeight: 'Кэш высоты',
    cacheHeightDesc: 'Сохранение высоты нод',
    cacheHeightPros: 'Ускоряет расчёты',
    cacheHeightCons: 'Инвалидация',
    
    willChange: 'will-change',
    willChangeDesc: 'Предупреждение браузеру',
    willChangePros: 'Ускоряет анимации',
    willChangeCons: 'Больше памяти',
    
    passiveEvents: 'Пассивные события',
    passiveEventsDesc: 'scroll/touch оптимизация',
    passiveEventsPros: 'Плавный скролл',
    passiveEventsCons: 'Старые браузеры',
    
    simplifyShadows: 'Упрощение теней',
    simplifyShadowsDesc: 'Без теней при драге',
    simplifyShadowsPros: 'Меньше перерисовка',
    simplifyShadowsCons: 'Пропадают тени',
    
    deferredEdges: 'Отложенные связи',
    deferredEdgesDesc: 'Связи с низким приоритетом',
    deferredEdgesPros: 'Быстрее перемещение',
    deferredEdgesCons: 'Линии отстают',
    
    cssContainment: 'CSS containment',
    cssContainmentDesc: 'contain:layout',
    cssContainmentPros: 'Изоляция макета',
    cssContainmentCons: 'Обрезание контента',
    
    debounceRender: 'Debounce рендера',
    debounceRenderDesc: 'Задержка рендера',
    debounceRenderPros: 'Экономия ресурсов',
    debounceRenderCons: 'Задержка',
    
    cacheBoundingRect: 'Кэш getBoundingClientRect',
    cacheBoundingRectDesc: 'Сохранение позиций',
    cacheBoundingRectPros: 'Быстрее расчёты',
    cacheBoundingRectCons: 'Обновление кэша',
    
    pointerEventsLines: 'Pointer-events линий',
    pointerEventsLinesDesc: 'Настройка области линий',
    pointerEventsLinesPros: 'Быстрее клики',
    pointerEventsLinesCons: 'Незначительно',
    
    lazyComputations: 'Ленивые вычисления',
    lazyComputationsDesc: 'setTimeout фоновые',
    lazyComputationsPros: 'UI отзывчив',
    lazyComputationsCons: 'Задержка',
    
    typedArrays: 'Типизированные массивы',
    typedArraysDesc: 'Float32Array',
    typedArraysPros: 'Мгновенный доступ',
    typedArraysCons: 'Сложно',
    
    limitHistory: 'Ограничение истории',
    limitHistoryDesc: '50->20 шагов',
    limitHistoryPros: 'Меньше памяти',
    limitHistoryCons: 'Меньше истории',
    
    cacheText: 'Кэш текста',
    cacheTextDesc: 'Строки в кэше',
    cacheTextPros: 'Ускоряет поиск',
    cacheTextCons: 'Инвалидация',
    
    webglInstancing: 'WebGL-инстансинг',
    webglInstancingDesc: 'Тысячи нод через GPU',
    webglInstancingPros: '5000+ нод 60 FPS',
    webglInstancingCons: 'Требует WebGL',
    
    designQuality: 'Качество дизайна',
    designQualityDesc: 'Снижение визуала',
    designQualityPros: 'FPS до +300%',
    designQualityCons: 'Визуал страдает',
    
    fpsGain: 'Прирост FPS',
    notMeasured: 'не измерено',
    currentQuality: 'Текущее качество',
    extreme: 'ЭКСТРЕМАЛЬНЫЙ',
    low: 'Низкое',
    medium: 'Среднее',
    high: 'Высокое',
    simplifiedBy: 'Упрощён на'
  },

  modal: {
    notification: 'Уведомление',
    confirm: 'Подтверждение',
    enterValue: 'Введите значение',
    enterNewValue: 'Введите новое значение:',
    clearStorageConfirm: 'Очистить все сохраненные данные?'
  },

  errors: {
    cannotConnect: 'Невозможно соединить',
    cyclicDependency: 'Циклическая зависимость!',
    invalidValue: 'Неверное значение'
  },

  status: {
    noConnections: 'Нет связей',
    benchmarking: 'Тестирование оптимизаций...',
    measuringBaseline: 'Измерение базовой...',
    baselineFPS: 'Базовый FPS',
    testing: 'Тест',
    completed: 'Тест завершён',
    saved: 'Сохранено'
  },
  
  dataTypes: {
    num: 'Число',
    array: 'Группа',
    auto: 'Вывод',
    uncert: 'Погрешность',
    list: 'Карта (список)',
    wlist: 'Карта (весовая)'
  },

  operations: {
    nodeDeleted: 'Нод удалён',
    edgeDeleted: 'Связь удалена',
    graphCleared: 'Граф очищен'
  }
};
