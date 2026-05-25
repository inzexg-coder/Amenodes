# DomRenderer

## ОПИСАНИЕ

`DomRenderer` – основной рендерер приложения Amenodes, отвечающий за визуализацию графа в DOM. 
Класс управляет отображением узлов, связей, обработкой перетаскивания, созданием временных линий при создании соединений, а также применяет оптимизации производительности (виртуализация, will-change, CSS containment, прилипание к сетке).

**Основные возможности:**
- отрисовка узлов через вызов `node.createDOM()`;
- отрисовка связей через `EdgeRenderer`;
- перетаскивание узлов мышью с поддержкой прилипания к сетке;
- создание новых связей через перетаскивание с хендлов;
- кэширование DOM-элементов и высоты узлов;
- виртуализация (отсечение невидимых узлов);
- применение стилей оптимизации к каждому узлу;
- прилипание (snap) к сетке при перемещении узлов.

## ЗАВИСИМОСТИ

```javascript
import { EdgeRenderer } from './EdgeRenderer.js';
import { ContextMenu } from '../ui/ContextMenu.js';
```

# КЛАСС DOMRENDERER

## Конструктор

```javascript
constructor(graph: Graph, layer: HTMLElement, viewportElement: HTMLElement, eventBus: EventBus)
```

Создаёт экземпляр рендерера для указанного графа и DOM-элемента, в котором будут размещаться узлы.

**Параметры:**
- `graph` – экземпляр класса `Graph`, содержащий узлы и связи для отображения.
- `layer` – DOM-элемент (обычно с классом `nodes-layer`), в который будут добавляться узлы.
- `viewportElement` – элемент-контейнер вьюпорта (обычно с классом `viewport`), используемый для вычисления координат.
- `eventBus` – экземпляр `EventBus` для межкомпонентного взаимодействия.

**Инициализируемые поля:**

| Поле | Тип | Значение по умолчанию | Описание |
|------|-----|----------------------|----------|
| `graph` | `Graph` | переданный | Ссылка на граф. |
| `layer` | `HTMLElement` | переданный | Контейнер узлов. |
| `viewportElement` | `HTMLElement` | переданный | Контейнер вьюпорта. |
| `viewport` | `Viewport \| null` | `null` | Устанавливается через `setViewport()`. |
| `history` | `History \| null` | `null` | Устанавливается через `setHistory()`. |
| `eventBus` | `EventBus` | переданный | Шина событий. |
| `dragNode` | `Node \| null` | `null` | Перетаскиваемый узел. |
| `dragStartX` | `number` | `0` | Начальная координата X курсора при драге. |
| `dragStartY` | `number` | `0` | Начальная координата Y курсора при драге. |
| `dragNodeStartX` | `number` | `0` | Начальная координата X узла при драге. |
| `dragNodeStartY` | `number` | `0` | Начальная координата Y узла при драге. |
| `isDraggingEdge` | `boolean` | `false` | Флаг создания нового ребра. |
| `edgeSourceId` | `number \| null` | `null` | ID узла-источника при создании ребра. |
| `edgeSourcePort` | `string \| null` | `null` | Порт источника при создании ребра. |
| `tempLine` | `SVGLineElement \| null` | `null` | Временная линия при создании ребра. |
| `tempSvg` | `SVGSVGElement \| null` | `null` | SVG-контейнер для временной линии. |
| `virtual` | `boolean` | `false` | Флаг виртуализации. |
| `heightCache` | `Map<number, number>` | `new Map()` | Кэш высоты узлов по ID. |
| `elementCache` | `Map<number, HTMLElement>` | `new Map()` | Кэш DOM-элементов узлов по ID. |
| `getSnapEnabled` | `(() => boolean) \| null` | `null` | Функция, возвращающая статус прилипания к сетке. |
| `getGridSize` | `(() => number) \| null` | `null` | Функция, возвращающая текущий размер сетки. |
| `opts` | `object` | `{ willChange: false, contain: false, pointerEvents: false }` | Флаги оптимизаций. |
| `edgeRenderer` | `EdgeRenderer` | новый экземпляр | Рендерер связей. |
| `contextMenu` | `ContextMenu \| null` | `null` | Контекстное меню. |

# Методы

## setViewport(viewport)

```javascript
setViewport(viewport: Viewport): void
```

Устанавливает экземпляр вьюпорта и сохраняет его в глобальную переменную `window._viewport`.

**Параметры:**
- `viewport` – экземпляр класса `Viewport`.

## setHistory(history)

```javascript
setHistory(history: History): void
```

Устанавливает экземпляр истории и сохраняет его в глобальную переменную `window._history`.

**Параметры:**
- `history` – экземпляр класса `History`.

## setSnapToGrid(getSnapEnabled, getGridSize)

```javascript
setSnapToGrid(getSnapEnabled: () => boolean, getGridSize: () => number): void
```

Устанавливает функции для получения текущего состояния прилипания к сетке и размера сетки. Эти функции вызываются при перетаскивании узлов для определения необходимости корректировки позиции.

**Параметры:**
- `getSnapEnabled` – функция, возвращающая `true`, если прилипание к сетке активно.
- `getGridSize` – функция, возвращающая размер ячейки сетки в пикселях.

**Пример:**
```javascript
renderer.setSnapToGrid(
  () => this.snapToGrid,
  () => this.gridSize
);
```

## save()

```javascript
save(): void
```

Сохраняет текущее состояние графа в историю, если история установлена. Вызывает `this.history.save()`.

## invalidateCache(nodeId)

```javascript
invalidateCache(nodeId: number): void
```

Очищает кэшированные значения для указанного узла – удаляет запись о высоте и DOM-элементе.

**Параметры:**
- `nodeId` – идентификатор узла.

- Удаляет запись из `this.heightCache` по ключу `nodeId`.
- Удаляет запись из `this.elementCache` по ключу `nodeId`.

## getNodeHeight(node)

```javascript
getNodeHeight(node: Node): number
```

Возвращает высоту узла, используя кэш. При первом вызове для узла вызывает `node.getMinHeight()` и сохраняет результат в кэш.

**Параметры:**
- `node` – экземпляр узла.

**Возвращает:** числовое значение высоты в пикселях.

## isNodeVisible(node, viewportRect, offset)

```javascript
isNodeVisible(node: Node, viewportRect: { x: number, y: number, w: number, h: number }, offset: { x: number, y: number }): boolean
```

Проверяет, попадает ли узел в видимую область вьюпорта с учётом отступа в 300 пикселей с каждой стороны.

**Параметры:**
- `node` – проверяемый узел.
- `viewportRect` – прямоугольник вьюпорта с полями `x`, `y`, `w`, `h`.
- `offset` – смещение вьюпорта с полями `x`, `y`.

**Возвращает:** `true`, если узел видим (или находится в пределах 300 пикселей от границы), иначе `false`.

## clearTemp()

```javascript
clearTemp(): void
```

Удаляет все временные SVG-элементы из слоя узлов. Ищет и удаляет элементы с классами `temp` и `edge-layer`.

## updateNodeClass(node)

```javascript
updateNodeClass(node: Node): void
```

Обновляет CSS-класс DOM-элемента узла в зависимости от флага `node.important`. Если узел помечен как важный, добавляет класс `node-important`, иначе удаляет его.

**Параметры:**
- `node` – узел, для которого обновляется класс.

## applyOptStyles(element)

```javascript
applyOptStyles(element: HTMLElement): void
```

Применяет к DOM-элементу стили оптимизации на основе текущих настроек `this.opts`.

**Параметры:**
- `element` – целевой DOM-элемент.

**Логика:**
- Если `this.opts.willChange === true`, устанавливает `element.style.willChange = 'left, top'`, иначе сбрасывает в пустую строку.
- Если `this.opts.contain === true`, устанавливает `element.style.contain = 'layout paint'`, иначе сбрасывает.

## renderEdges(visibleNodes)

```javascript
renderEdges(visibleNodes: Array<Node>): void
```

Отрисовывает только те рёбра, у которых и источник, и цель входят в массив видимых узлов.

**Параметры:**
- `visibleNodes` – массив узлов, которые в данный момент видимы.

- Создаёт кэш прямоугольников для видимых узлов (каждый узел имеет размеры 280×высота).
- Вызывает `this.edgeRenderer.renderEdges()` с отфильтрованными рёбрами.

## render()

```javascript
render(): void
```

Основной метод отрисовки. В зависимости от флага `this.virtual` выполняет либо виртуализированную отрисовку (только видимые узлы), либо полную отрисовку всех узлов.

**Алгоритм при `virtual === true`:**
1. Получает текущий прямоугольник вьюпорта и смещение через `this.viewport`.
2. Фильтрует узлы: видимые (`isNodeVisible`) и скрытые.
3. Удаляет DOM-элементы скрытых узлов.
4. Для видимых узлов создаёт DOM через `node.createDOM()`, если элемент отсутствует в кэше.
5. Обновляет позиции существующих элементов.
6. Вызывает `renderEdges()` только для видимых узлов.

**Алгоритм при `virtual === false`:**
1. Вызывает `renderAll()`.

## renderAll()

```javascript
renderAll(): void
```

Полная отрисовка графа. Очищает слой, создаёт DOM для всех узлов заново и отрисовывает все рёбра.

- `this.layer.innerHTML = ''` – полная очистка контейнера.
- `this.elementCache.clear()` – очистка кэша элементов.
- Для каждого узла создаётся DOM через `node.createDOM()`.
- Вычисляются прямоугольники всех узлов.
- Вызывается `renderEdges()` для всех узлов.
- Вызывается `attachDragEvents()` для привязки обработчиков перетаскивания.

## addHandles(container, nodeId, unmappedPort)

```javascript
addHandles(container: HTMLElement, nodeId: number, unmappedPort: string | null): void
```

Добавляет к контейнеру узла визуальные хендлы (маленькие кружки) для создания связей. Удаляет все существующие хендлы перед добавлением.

**Параметры:**
- `container` – DOM-элемент узла.
- `nodeId` – идентификатор узла.
- `unmappedPort` – если передан, добавляет дополнительный синий хендл для порта `unmapped`.

**Добавляемые хендлы:**
- Всегда добавляет хендлы на четырёх сторонах: `top`, `right`, `bottom`, `left` (порт `'main'`).
- Если `unmappedPort === 'unmapped'`, добавляет синий хендл справа со смещением вниз на 20px.

**Примечание:** каждый хендл получает атрибуты `data-source-id` и `data-port`, а также обработчик `mousedown`.

## onHandleDown(event)

```javascript
onHandleDown(event: MouseEvent): void
```

Обработчик нажатия на хендл. Реализует детектор короткого нажатия против перетаскивания:
- При нажатии запоминает начальные координаты.
- При движении мыши более чем на 5px начинает создание ребра.
- При отпускании без движения показывает контекстное меню для узла.

**Параметры:**
- `event` – событие мыши.

**Побочные эффекты:**
- При начале драга вызывает `startDragEdge()`.
- При клике вызывает `showMenu()`.

## startDragEdge(sourceId, port, clientX, clientY)

```javascript
startDragEdge(sourceId: number, port: string, clientX: number, clientY: number): void
```

Начинает процесс создания нового ребра. Создаёт временную линию от хендла до текущей позиции курсора.

**Параметры:**
- `sourceId` – идентификатор узла-источника.
- `port` – порт источника.
- `clientX`, `clientY` – текущие координаты курсора.

**Побочные эффекты:**
- Устанавливает `this.isDraggingEdge = true`.
- Создаёт временный SVG-слой с пунктирной линией.
- Меняет курсор на `'crosshair'`.

## onGlobalMoveEdge(event)

```javascript
onGlobalMoveEdge(event: MouseEvent): void
```

Глобальный обработчик движения мыши для временной линии при создании ребра. Обновляет координаты конечной точки линии.

**Параметры:**
- `event` – событие мыши.

## onGlobalUpEdge(event)

```javascript
onGlobalUpEdge(event: MouseEvent): void
```

Глобальный обработчик отпускания мыши при создании ребра. Завершает процесс: удаляет временную линию и, если курсор находится над узлом, создаёт ребро через `graph.addEdge()`.

**Параметры:**
- `event` – событие мыши.

**Алгоритм:**
1. Удаляет временные SVG-элементы.
2. Находит DOM-элемент под курсором с классом `node` и извлекает его `data-id`.
3. Если целевой узел существует и отличается от источника, вызывает `graph.addEdge()`.
4. При успешном создании вызывает `graph.reevaluateAll()`, `graph.updateAllOutputs()`, `this.render()` и `this.save()`.
5. Сбрасывает флаги и курсор.

## showMenu(x, y, sourceId)

```javascript
showMenu(x: number, y: number, sourceId: number): void
```

Показывает контекстное меню для узла-источника.

**Параметры:**
- `x`, `y` – координаты для отображения меню.
- `sourceId` – идентификатор узла.

- Создаёт экземпляр `ContextMenu`, если он ещё не создан.
- Вызывает `this.contextMenu.show(x, y, sourceId)`.

## getCanvasCoords(clientX, clientY)

```javascript
getCanvasCoords(clientX: number, clientY: number): { x: number, y: number }
```

Преобразует клиентские координаты (относительно окна браузера) в мировые координаты на холсте с учётом смещения и масштаба вьюпорта.

**Параметры:**
- `clientX`, `clientY` – координаты относительно окна браузера.

**Возвращает:** объект с полями `x` и `y` – координаты относительно холста.

**Формула:**
```
worldX = (clientX - rect.left - offset.x) / zoom
worldY = (clientY - rect.top - offset.y) / zoom
```

## attachDragEvents()

```javascript
attachDragEvents(): void
```

Привязывает обработчики перетаскивания к заголовкам узлов. Ищет элементы с классами `.node-header`, `.output-header`, `.calc-header`, `.map-header`, `.group-header` и добавляет им обработчик `mousedown`.

## onNodeDown(event)

```javascript
onNodeDown(event: MouseEvent): void
```

Обработчик нажатия на заголовок узла для начала перетаскивания.

**Параметры:**
- `event` – событие мыши.

**Игнорируемые цели (перетаскивание не начинается):**
- Элементы с классом `.node-handle` (хендлы связей).
- Элементы с классом `.node-actions` (кнопки действий).
- Элементы `input` или `button`.
- Элементы с классом `.title-editable` (редактируемые заголовки).

**Действия:**
- Сохраняет узел в `this.dragNode`.
- Запоминает начальные координаты курсора и узла.
- Меняет курсор на `'grabbing'`.
- Вызывает `event.preventDefault()`.

## onGlobalMove(event)

```javascript
onGlobalMove(event: MouseEvent): void
```

Глобальный обработчик движения мыши при перетаскивании узла. Обновляет позицию перетаскиваемого узла с учётом прилипания к сетке.

**Параметры:**
- `event` – событие мыши.

**Алгоритм:**
1. Вычисляет базовое смещение:
   ```
   deltaX = (clientX - dragStartX) / zoom
   deltaY = (clientY - dragStartY) / zoom
   newX = dragNodeStartX + deltaX
   newY = dragNodeStartY + deltaY
   ```
2. Если прилипание к сетке включено (`getSnapEnabled` и `getSnapEnabled()` возвращают `true`):
   ```
   gridSize = getGridSize ? getGridSize() : 20
   newX = Math.round(newX / gridSize) * gridSize
   newY = Math.round(newY / gridSize) * gridSize
   ```
3. Обновляет координаты узла и его DOM-элемента.
4. Вызывает `this.render()` для обновления отображения (включая линии).

## onGlobalUp()

```javascript
onGlobalUp(): void
```

Глобальный обработчик отпускания мыши после перетаскивания узла. Сохраняет состояние в историю и сбрасывает флаги.

- Вызывает `this.save()`.
- Сбрасывает `this.dragNode` в `null`.
- Восстанавливает курсор.

## setVirtual(enabled)

```javascript
setVirtual(enabled: boolean): void
```

Включает или выключает режим виртуализации (отрисовка только видимых узлов). При изменении состояния очищает кэш элементов и вызывает перерисовку.

**Параметры:**
- `enabled` – новое состояние флага виртуализации.

## closeMenu()

```javascript
closeMenu(): void
```

Закрывает контекстное меню, если оно открыто. Вызывает `this.contextMenu.close()`.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Создание и настройка рендерера

```javascript
import { DomRenderer } from './renderer/DomRenderer.js';
import { Viewport } from './renderer/Viewport.js';

const graph = new Graph();
const nodesLayer = document.getElementById('nodesLayer');
const viewportEl = document.getElementById('viewport');
const eventBus = new EventBus();

const renderer = new DomRenderer(graph, nodesLayer, viewportEl, eventBus);
const viewport = new Viewport(viewportEl, document.getElementById('canvasContainer'));
renderer.setViewport(viewport);
renderer.setSnapToGrid(
  () => this.snapToGrid,
  () => this.gridSize
);
renderer.render();
```

### Включение виртуализации

```javascript
renderer.setVirtual(true);
renderer.render(); // Теперь отрисовываются только видимые узлы
```

### Применение оптимизаций

```javascript
renderer.opts.willChange = true;
renderer.opts.contain = true;
renderer.render(); // Все узлы получат will-change и contain
```

### Инвалидация кэша после изменения узла

```javascript
const nodeId = 5;
renderer.invalidateCache(nodeId); // Сбрасывает кэш высоты и DOM-элемента
renderer.render(); // Узел будет пересоздан
```

# ЗАМЕЧАНИЯ

- Метод `render()` может вызываться часто (каждый кадр анимации). В режиме виртуализации он выполняет минимальную работу – обновляет позиции и создаёт только новые узлы.
- `elementCache` хранит ссылки на DOM-элементы узлов. При полной перерисовке (`renderAll()`) кэш очищается.
- `heightCache` используется для быстрого доступа к высоте узлов при расчётах видимости и позиционировании линий.
- Прилипание к сетке работает только при перетаскивании узлов, но не при программном изменении координат.
- Временные линии при создании рёбер создаются в отдельном SVG-слое с высоким `z-index` (100), чтобы быть поверх всех узлов.
- Глобальные обработчики событий (`onGlobalMove`, `onGlobalUp`, `onGlobalMoveEdge`, `onGlobalUpEdge`) должны быть привязаны на уровне `window` в родительском приложении.
- Метод `applyOptStyles` переопределяется при применении оптимизаций через `OptimizationPanel`.
