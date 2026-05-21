# `BenchmarkService`

## ОПИСАНИЕ

`BenchmarkService` – сервис для измерения производительности и оценки эффективности отдельных оптимизаций в приложении Amenodes.
Класс выполняет автоматическое бенчмаркирование, измеряя FPS (кадры в секунду) при включении и выключении каждой оптимизации, после чего вычисляет процентный прирост производительности относительно базовой линии.

**Назначение:**

- измерение базовой производительности графа без включённых оптимизаций;
- последовательное включение каждой оптимизации и измерение FPS;
- вычисление процентного прироста FPS для каждой оптимизации;
- восстановление исходного состояния после завершения тестирования.

**Важно:** бенчмаркинг является деструктивной операцией – он временно изменяет состояние рендерера и графа. Перед запуском тестирования сохраняется полный снимок состояния, который восстанавливается по завершении.

## ЗАВИСИМОСТИ

Класс не импортирует внешние модули, но взаимодействует со следующими глобальными объектами и свойствами:

| Глобальный объект | Назначение |
|------------------|------------|
| `window._renderer` | Рендерер DOM (для управления виртуализацией и другими оптимизациями) |
| `window._rendererVirtual` | Флаг состояния виртуализации |
| `window._rendererWillChange` | Флаг состояния will-change |
| `window._rendererContain` | Флаг состояния CSS containment |
| `window._rendererPointerEvents` | Флаг состояния pointer-events линий |
| `window._historyMaxSize` | Размер истории для undo/redo |
| `window._history` | Объект истории (для изменения максимального размера) |
| `document.getElementById('canvasContainer')` | Контейнер для управления GPU-трансформациями |

# КЛАСС BENCHMARKSERVICE

## Конструктор

```javascript
constructor(graph: Graph, fpsCounter: FPSCounter, optimizations: Array<Object>)
```

Создаёт экземпляр сервиса бенчмаркинга.

| Параметр | Тип | Описание |
|----------|-----|----------|
| `graph` | `Graph` | Экземпляр графа, производительность которого измеряется |
| `fpsCounter` | `FPSCounter` | Объект для измерения FPS (предоставляет метод `measure(durationMs)`) |
| `optimizations` | `Array<Object>` | Массив определений оптимизаций из `config/Optimizations.js` |

**Инициализируемые свойства:**

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.graph` | `Graph` | параметр `graph` | Ссылка на граф |
| `this.fpsCounter` | `FPSCounter` | параметр `fpsCounter` | Счётчик FPS |
| `this.optimizations` | `Array<Object>` | параметр `optimizations` | Массив оптимизаций |
| `this.benchmarking` | `boolean` | `false` | Флаг выполнения бенчмаркинга (блокирует повторный запуск) |
| `this.realGains` | `Array<number>` | `new Array(optimizations.length).fill(0)` | Массив вычисленных приростов FPS для каждой оптимизации |
| `this.baselineFPS` | `number` | `0` | Базовое значение FPS (при отключённых оптимизациях) |

# МЕТОДЫ

## runBenchmark(notify)

```javascript
async runBenchmark(notify: boolean = true): Promise<Object>
```

Запускает полный цикл бенчмаркинга:

1. Сохраняет текущее состояние графа и настроек оптимизаций.
2. Сбрасывает все оптимизации в состояние "выключено".
3. Измеряет базовый FPS (`baselineFPS`).
4. Последовательно для каждой оптимизации (пропуская слайдеры `type === 'slider'`):
   - включает оптимизацию;
   - измеряет FPS;
   - вычисляет процентный прирост: `((fps - baselineFPS) / baselineFPS) * 100`;
   - сохраняет результат в `this.realGains[i]`;
   - выключает оптимизацию.
5. Восстанавливает сохранённое состояние.
6. Возвращает результаты.

**Параметры:**

- `notify` – если `true`, отображает статус в элементе `#benchmarkStatus` и обновляет его содержимое.

**Возвращает:** `Promise<Object>` с объектом:

```javascript
{
  gains: Array<number>,   // массив приростов FPS для каждой оптимизации
  baseline: number        // измеренный базовый FPS
}
```

**Блокировка:** если бенчмаркинг уже выполняется (`this.benchmarking === true`), метод немедленно возвращает текущие результаты без повторного запуска.

**Пример:**

```javascript
const benchmarkService = new BenchmarkService(graph, fpsCounter, OPTIMIZATIONS);
const { gains, baseline } = await benchmarkService.runBenchmark(true);
console.log(`Базовый FPS: ${baseline}`);
console.log(`Прирост от виртуализации: +${gains[0]}%`);
```

## captureState()

```javascript
captureState(): Object
```

Сохраняет текущее состояние всех управляемых оптимизаций и рендерера. Вызывается перед началом бенчмаркинга.

**Возвращает:** объект со следующей структурой:

```javascript
{
  virtual: boolean,           // состояние виртуализации (window._rendererVirtual)
  willChange: boolean,        // состояние will-change (window._rendererWillChange)
  contain: boolean,           // состояние CSS containment (window._rendererContain)
  pointerEvents: boolean,     // состояние pointer-events (window._rendererPointerEvents)
  historyMax: number,         // размер истории (window._historyMaxSize)
  transform: string           // CSS transform контейнера canvasContainer
// другие
}
```

## resetToBaseline()

```javascript
resetToBaseline(): void
```

Сбрасывает все оптимизации в состояние "выключено", соответствующее базовой линии производительности:

## restoreState(state)

```javascript
restoreState(state: Object): void
```

Восстанавливает состояние оптимизаций из ранее сохранённого объекта.

**Параметры:**

- `state` – объект, полученный от `captureState()`.

**Действия:**

- Восстанавливает шаблоны оптимизации через соответствующие методы `set*`.
- Восстанавливает CSS transform контейнера.
- Вызывает `window._renderer.render()` для применения изменений.

## applyOptimizationByIndex(index, enable)

```javascript
applyOptimizationByIndex(index: number, enable: boolean): void
```

Включает или выключает конкретную оптимизацию по её индексу в массиве `OPTIMIZATIONS`. Использует жёстко заданное сопоставление индексов с оптимизациями.

**Параметры:**

- `index` – индекс оптимизации в массиве `this.optimizations`.
- `enable` – `true` для включения, `false` для выключения.

## setVirtual(enabled)

```javascript
setVirtual(enabled: boolean): void
```

Управляет оптимизацией виртуализации.

**Параметры:**

- `enabled` – `true` для включения, `false` для выключения.

**Действия:**

- Устанавливает `window._rendererVirtual = enabled`.
- Вызывает `window._renderer.setVirtual(enabled)`.

## setGpuTransform(enabled)

```javascript
setGpuTransform(enabled: boolean): void
```

Управляет оптимизацией GPU-трансформаций (использование `translate3d`).

**Параметры:**

- `enabled` – `true` для включения, `false` для выключения.

**Действия:**

- Получает элемент `canvasContainer` через `document.getElementById`.
- При `enabled === true` устанавливает `container.style.transform = 'translate3d(0,0,0)'`.
- При `enabled === false` устанавливает `container.style.transform = ''`.

## setWillChange(enabled)

```javascript
setWillChange(enabled: boolean): void
```

Управляет оптимизацией `will-change` CSS.

**Параметры:**

- `enabled` – `true` для включения, `false` для выключения.

**Действия:**

- Устанавливает `window._rendererWillChange = enabled`.
- Если рендерер доступен, устанавливает `window._renderer.opts.willChange = enabled`.

## setContain(enabled)

```javascript
setContain(enabled: boolean): void
```

Управляет оптимизацией CSS containment (`contain:layout`).

**Параметры:**

- `enabled` – `true` для включения, `false` для выключения.

**Действия:**

- Устанавливает `window._rendererContain = enabled`.
- Если рендерер доступен, устанавливает `window._renderer.opts.contain = enabled`.

## setPointerEvents(enabled)

```javascript
setPointerEvents(enabled: boolean): void
```

Управляет оптимизацией pointer-events для линий.

**Параметры:**

- `enabled` – `true` для включения, `false` для выключения.

**Действия:**

- Устанавливает `window._rendererPointerEvents = enabled`.
- Если рендерер доступен, устанавливает `window._renderer.opts.pointerEvents = enabled`.

## setHistoryMax(max)

```javascript
setHistoryMax(max: number): void
```

Управляет максимальным размером истории (количеством шагов undo/redo).

**Параметры:**

- `max` – новое максимальное количество шагов (50 для базовой линии, 20 для оптимизации).

**Действия:**

- Устанавливает `window._historyMaxSize = max`.
- Если объект истории доступен (`window._history`), устанавливает `window._history.maxSize = max`.

## sleep(ms)

```javascript
sleep(ms: number): Promise<void>
```

Вспомогательный метод для создания задержки между измерениями.

**Параметры:**

- `ms` – длительность задержки в миллисекундах.

**Возвращает:** `Promise`, который разрешается через указанное время.

**Пример:**

```javascript
await benchmarkService.sleep(500); // пауза 500 мс
```

## getGains()

```javascript
getGains(): Array<number>
```

Возвращает массив вычисленных приростов FPS.

**Возвращает:** массив `this.realGains` (длина равна `this.optimizations.length`).

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Запуск бенчмаркинга с отображением статуса

```javascript
import { OPTIMIZATIONS } from './config/Optimizations.js';
import { BenchmarkService } from './services/BenchmarkService.js';
import { FPSCounter } from './utils/FPSCounter.js';

const fpsCounter = new FPSCounter('fpsMeter');
const benchmarkService = new BenchmarkService(graph, fpsCounter, OPTIMIZATIONS);

// Запуск с уведомлениями
const result = await benchmarkService.runBenchmark(true);
console.log(`Базовая производительность: ${result.baseline} FPS`);
console.log(`Лучший прирост: +${Math.max(...result.gains)}%`);
```

### Использование без отображения статуса

```javascript
// Тихий режим (без обновления UI)
const { gains } = await benchmarkService.runBenchmark(false);

// Применение результатов к панели оптимизаций
optimizationPanel.updateGains(gains);
```

### Ручное управление отдельными оптимизациями

```javascript
// Включение виртуализации без запуска полного бенчмаркинга
benchmarkService.setVirtual(true);

// Измерение FPS после включения
const fpsAfterVirtual = await fpsCounter.measure(1000);

// Возврат к базовой линии
benchmarkService.resetToBaseline();
```

# ЗАМЕЧАНИЯ

- **Деструктивность:** бенчмаркинг временно изменяет состояние приложения.
- **Длительность:** полный цикл бенчмаркинга для всех оптимизаций занимает значительное время (примерно `(оптимизаций + 1) * 1500 мс`). При 18 оптимизациях это около 28 секунд.
- **Слайдеры:** оптимизации с типом `slider` (например, "Качество дизайна") пропускаются при бенчмаркинге, так как они не имеют двоичного состояния.
- **Глобальные зависимости:** сервис полагается на глобальные объекты `window._renderer` и `window._history`. При их отсутствии вызовы методов игнорируются.
- **Одновременный запуск:** флаг `this.benchmarking` предотвращает параллельный запуск бенчмаркинга. При повторном вызове `runBenchmark()` возвращаются предыдущие результаты.
