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
    map: 'Карта',
    confidenceInterval: 'Доверительный интервал'
  },

  calcTypes: {
    div3: 'Погрешность измерения',
    div_sqrt12: 'Погрешность округления',
    sqrt_sum_sq: 'Суммарная погрешность',
    result: 'Результат',
    inputs: 'входов'
  },

  map: {
    title: 'Карта преобразований',
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
    title: 'Вывод результатов',
    noConnections: 'Нет связей',
    valueCount: 'знач.'
  },

  confidence: {
    uncertaintyInputs: 'Входов с погрешностью',
    multiplierInputs: 'Входов-множителей'
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
    virtualizationPros: 'Снижает количество DOM-элементов, ускоряет рендеринг',
    virtualizationCons: 'Может быть заметна подгрузка при скролле',
    
    gpuTransforms: 'GPU-трансформации',
    gpuTransformsDesc: 'Использование translate3d для аппаратного ускорения',
    gpuTransformsPros: 'Обеспечивает плавную анимацию 60 FPS',
    gpuTransformsCons: 'Могут возникать графические артефакты на некоторых видеокартах',
    
    throttleMouse: 'Throttle мыши',
    throttleMouseDesc: 'Ограничение частоты обработки событий мыши',
    throttleMousePros: 'Снижает количество лагов при быстром перемещении',
    throttleMouseCons: 'Создаёт микро-задержку в отклике',
    
    batchRAF: 'Batch-обновление RAF',
    batchRAFDesc: 'Группировка изменений в requestAnimationFrame',
    batchRAFPros: 'Уменьшает количество перерисовок страницы',
    batchRAFCons: 'Обновление происходит не мгновенно',
    
    cacheHeight: 'Кэш высоты',
    cacheHeightDesc: 'Сохранение вычисленной высоты нод',
    cacheHeightPros: 'Ускоряет расчёты позиционирования',
    cacheHeightCons: 'Требует инвалидации кэша при изменении',
    
    willChange: 'will-change',
    willChangeDesc: 'Предупреждение браузеру об изменениях',
    willChangePros: 'Ускоряет анимации и трансформации',
    willChangeCons: 'Потребляет больше оперативной памяти',
    
    passiveEvents: 'Пассивные события',
    passiveEventsDesc: 'Оптимизация scroll/touch событий',
    passiveEventsPros: 'Обеспечивает плавный скролл страницы',
    passiveEventsCons: 'Не поддерживается в старых браузерах',
    
    simplifyShadows: 'Упрощение теней',
    simplifyShadowsDesc: 'Отключение теней при перетаскивании',
    simplifyShadowsPros: 'Снижает нагрузку на перерисовку',
    simplifyShadowsCons: 'Визуальные тени пропадают во время драга',
    
    deferredEdges: 'Отложенные связи',
    deferredEdgesDesc: 'Отрисовка связей с низким приоритетом',
    deferredEdgesPros: 'Ускоряет перемещение нод',
    deferredEdgesCons: 'Линии могут отставать от нод',
    
    cssContainment: 'CSS containment',
    cssContainmentDesc: 'Использование contain:layout',
    cssContainmentPros: 'Изолирует макет ноды от страницы',
    cssContainmentCons: 'Может обрезать содержимое ноды',
    
    debounceRender: 'Debounce рендера',
    debounceRenderDesc: 'Задержка рендеринга при изменениях',
    debounceRenderPros: 'Экономит ресурсы CPU при быстрых изменениях',
    debounceRenderCons: 'Создаёт заметную задержку обновлений',
    
    cacheBoundingRect: 'Кэш getBoundingClientRect',
    cacheBoundingRectDesc: 'Сохранение позиций элементов',
    cacheBoundingRectPros: 'Ускоряет вычисления позиций',
    cacheBoundingRectCons: 'Требует обновления кэша при движении',
    
    pointerEventsLines: 'Pointer-events линий',
    pointerEventsLinesDesc: 'Настройка области клика по линиям',
    pointerEventsLinesPros: 'Ускоряет обработку кликов',
    pointerEventsLinesCons: 'Влияние на производительность незначительно',
    
    lazyComputations: 'Ленивые вычисления',
    lazyComputationsDesc: 'Вынос вычислений в setTimeout',
    lazyComputationsPros: 'UI остаётся отзывчивым',
    lazyComputationsCons: 'Результаты появляются с задержкой',
    
    typedArrays: 'Типизированные массивы',
    typedArraysDesc: 'Использование Float32Array для данных',
    typedArraysPros: 'Мгновенный доступ к памяти',
    typedArraysCons: 'Усложняет код и отладку',
    
    limitHistory: 'Ограничение истории',
    limitHistoryDesc: 'Уменьшение глубины истории (50->20 шагов)',
    limitHistoryPros: 'Снижает потребление памяти',
    limitHistoryCons: 'Меньше шагов для отмены/повтора',
    
    cacheText: 'Кэш текста',
    cacheTextDesc: 'Кэширование строковых значений',
    cacheTextPros: 'Ускоряет поиск и сравнение',
    cacheTextCons: 'Требует инвалидации кэша',
    
    webglInstancing: 'WebGL-инстансинг',
    webglInstancingDesc: 'Отрисовка тысяч нод через GPU',
    webglInstancingPros: 'Обеспечивает 60 FPS для 5000+ нод',
    webglInstancingCons: 'Требует поддержки WebGL',
    
    designQuality: 'Качество дизайна',
    designQualityDesc: 'Снижение визуального качества',
    designQualityPros: 'Увеличение FPS до +300%',
    designQualityCons: 'Визуальное оформление ухудшается',
    
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
    invalidValue: 'Неверное значение',
    requireTwoInputs: 'Требуется ровно 2 входа',
    missingUncertaintyOrNumber: 'Необходима погрешность и число' 
  },

  status: {
    noConnections: 'Нет связей',
    benchmarking: 'Тестирование оптимизаций...',
    measuringBaseline: 'Измерение базовой производительности...',
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
