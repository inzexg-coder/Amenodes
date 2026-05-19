export const ru = {
  common: {
    ok: 'ОК',
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

  toolbar: {
    undo: 'Отменить',
    redo: 'Повторить',
    export: 'Экспорт',
    import: 'Импорт',
    clearStorage: 'Очистить сохр.',
    addNode: 'Добавить узел'
  },

  nodeMenu: {
    title: 'Добавить узел',
    search: 'Поиск узлов...'
  },

  contextMenu: {
    markImportant: 'Выделить ВАЖНЫЙ узел',
    unmarkImportant: 'Снять выделение ВАЖНОГО',
    outputAndConnect: 'Создать связь с выводом'
  },

  optimizations: {
    virtualization: 'Виртуализация',
    virtualizationDesc: 'Отсечение невидимых узлов',
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
    cacheHeightDesc: 'Сохранение вычисленной высоты узлов',
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
    deferredEdgesPros: 'Ускоряет перемещение узлов',
    deferredEdgesCons: 'Линии могут отставать от узлов',
    
    cssContainment: 'CSS containment',
    cssContainmentDesc: 'Использование contain:layout',
    cssContainmentPros: 'Изолирует макет узла от страницы',
    cssContainmentCons: 'Может обрезать содержимое узла',
    
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
    lazyComputationsPros: 'Интерфейс остаётся отзывчивым',
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
    webglInstancingDesc: 'Отрисовка тысяч узлов через GPU',
    webglInstancingPros: 'Обеспечивает 60 FPS для 5000+ узлов',
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
    cyclicDependency: 'Циклическая зависимость!',
    cannotConnect: 'Невозможно соединить'
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

  operations: {
    nodeDeleted: 'Узел удалён',
    edgeDeleted: 'Связь удалена',
    graphCleared: 'Граф очищен'
  }
};
