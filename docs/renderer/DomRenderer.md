# `DomRenderer`

## ОПИСАНИЕ

`DomRenderer` – основной рендерер приложения Amenodes, отвечающий за визуализацию графа в DOM. 
Класс управляет отображением узлов, связей, обработкой перетаскивания, созданием временных линий при создании соединений, а также применяет оптимизации производительности (виртуализация, will-change, CSS containment, прилипание к сетке).

**Ключевые особенности:**
- отрисовка узлов через вызов `node.createDOM()`;
- отрисовка связей через `EdgeRenderer`;
- перетаскивание узлов мышью с поддержкой прилипания к сетке;
- создание новых связей через перетаскивание с хендлов;
- кэширование DOM-элементов и высоты узлов;
- виртуализация (отсечение невидимых узлов);
- применение стилей оптимизации к каждому узлу;
- **защита от отсутствующих методов узлов** – graceful fallback при ошибках.

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

Создаёт экземпляр рендерера для указанного графа и DOM-элемента.

**Параметры:**
- `graph` – экземпляр класса `Graph`.
- `layer` – DOM-элемент (обычно `nodes-layer`), в который добавляются узлы.
- `viewportElement` – элемент-контейнер вьюпорта (обычно `viewport`).
- `eventBus` – экземпляр `EventBus` для межкомпонентного взаимодействия.

**Инициализируемые поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| `graph` | `Graph` | Ссылка на граф. |
| `layer` | `HTMLElement` | Контейнер узлов. |
| `viewportElement` | `HTMLElement` | Контейнер вьюпорта. |
| `viewport` | `Viewport \| null` | Устанавливается через `setViewport()`. |
| `history` | `History \| null` | Устанавливается через `setHistory()`. |
| `virtual` | `boolean` | Флаг виртуализации. |
| `_edgeRafPending` | `number \| null` | Идентификатор ожидающего rAF для отложенного обновления рёбер. |
| `heightCache` | `Map<number, number>` | Кэш высоты узлов. |
| `elementCache` | `Map<number, HTMLElement>` | Кэш DOM-элементов узлов. |
| `opts` | `object` | Флаги оптимизаций (`willChange`, `contain`, `pointerEvents`). |
| `edgeRenderer` | `EdgeRenderer` | Рендерер связей. |
| `contextMenu` | `ContextMenu \| null` | Контекстное меню. |

# Методы

## setViewport(viewport)

```javascript
setViewport(viewport: Viewport): void
```

Устанавливает экземпляр вьюпорта.

## setHistory(history)

```javascript
setHistory(history: History): void
```

Устанавливает экземпляр истории.

## setSnapToGrid(getSnapEnabled, getGridSize)

```javascript
setSnapToGrid(getSnapEnabled: () => boolean, getGridSize: () => number): void
```

Устанавливает функции для получения состояния прилипания к сетке.

## save()

```javascript
save(): void
```

Сохраняет текущее состояние в историю.

## invalidateCache(nodeId)

```javascript
invalidateCache(nodeId: number): void
```

Очищает кэшированные значения для указанного узла.

## getNodeHeight(node)

```javascript
getNodeHeight(node: Node): number
```

Возвращает высоту узла, используя кэш.

**Защита:** если у узла отсутствует метод `getMinHeight`, возвращает значение по умолчанию (80px) и выводит предупреждение в консоль.

## isNodeVisible(node, viewportRect, offset)

```javascript
isNodeVisible(node: Node, viewportRect: object, offset: object): boolean
```

Проверяет, попадает ли узел в видимую область вьюпорта.

**Защита:** если узел не существует, возвращает `false`.

## clearTemp()

```javascript
clearTemp(): void
```

Удаляет все временные SVG-элементы.

## updateNodeClass(node)

```javascript
updateNodeClass(node: Node): void
```

Обновляет CSS-класс узла в зависимости от флага `important`.

## applyOptStyles(element)

```javascript
applyOptStyles(element: HTMLElement): void
```

Применяет стили оптимизации (will-change, contain).

## renderEdges(visibleNodes)

```javascript
renderEdges(visibleNodes: Array<Node>): void
```

Отрисовывает рёбра для видимых узлов.

## render()

```javascript
render(): void
```

Основной метод отрисовки. В зависимости от флага `virtual` выполняет виртуализированную или полную отрисовку.

## renderAll()

```javascript
renderAll(): void
```

Полная отрисовка графа.

**Защита:** перед вызовом `node.createDOM()` проверяет существование метода. При отсутствии метода создаёт элемент-заглушку с сообщением об ошибке.

```javascript
if (typeof node.createDOM !== 'function') {
  console.error('Node missing createDOM method:', node);
  // Создаём заглушку вместо узла
  const errorDiv = document.createElement('div');
  errorDiv.className = 'node';
  errorDiv.style.left = node.x + 'px';
  errorDiv.style.top = node.y + 'px';
  errorDiv.style.background = '#8b3a3a';
  errorDiv.innerHTML = `<strong>ERROR: ${node.type}</strong><br>Node class not loaded correctly`;
  this.layer.appendChild(errorDiv);
  continue;
}
```

## addHandles(container, nodeId, unmappedPort)

```javascript
addHandles(container: HTMLElement, nodeId: number, unmappedPort: string | null): void
```

Добавляет хендлы для создания связей.

## onHandleDown(event)

```javascript
onHandleDown(event: MouseEvent): void
```

Обработчик нажатия на хендл.

## startDragEdge(sourceId, port, clientX, clientY)

```javascript
startDragEdge(sourceId: number, port: string, clientX: number, clientY: number): void
```

Начинает процесс создания нового ребра.

## onGlobalMoveEdge(event)

```javascript
onGlobalMoveEdge(event: MouseEvent): void
```

Глобальный обработчик движения мыши для временной линии.

## onGlobalUpEdge(event)

```javascript
onGlobalUpEdge(event: MouseEvent): void
```

Глобальный обработчик отпускания мыши при создании ребра.

## showMenu(x, y, sourceId)

```javascript
showMenu(x: number, y: number, sourceId: number): void
```

Показывает контекстное меню для узла-источника.

## getCanvasCoords(clientX, clientY)

```javascript
getCanvasCoords(clientX: number, clientY: number): { x: number, y: number }
```

Преобразует клиентские координаты в мировые координаты холста.

## attachDragEvents()

```javascript
attachDragEvents(): void
```

Привязывает обработчики перетаскивания к заголовкам узлов.

## onNodeDown(event)

```javascript
onNodeDown(event: MouseEvent): void
```

Обработчик нажатия на заголовок узла для начала перетаскивания.

**Алгоритм:**
1. Определяет элемент узла через `event.target.closest('.node')`.
2. Извлекает `data-id` узла и находит экземпляр нода в графе.
3. Сохраняет начальные координаты мыши и позицию узла.
4. **Отключает CSS-анимацию на перетаскиваемом узле** (`element.style.transition = 'none'`) — это обеспечивает мгновенное перемещение узла за курсором без задержки анимации, что синхронизирует позицию узла и рёбер.

## onGlobalMove(event)

```javascript
onGlobalMove(event: MouseEvent): void
```

Глобальный обработчик движения мыши при перетаскивании узла.

**Алгоритм:**
1. Вычисляет смещение мыши и пересчитывает мировые координаты узла с учётом зума.
2. Если включено прилипание к сетке — округляет позицию до шага сетки.
3. Обновляет `node.x` / `node.y` и DOM-позицию узла (`element.style.left/top`).
4. **Обновляет позиции рёбер через rAF-трейтлинг** — `updateEdgePositions()` вызывается не чаще одного раза за кадр анимации (через `requestAnimationFrame`). Это предотвращает «обрыв» ребра при слишком частых вызовах (резкие дёргания мыши). Если rAF уже запланирован, новый не создаётся — последний mousemove обновит ребро в ближайшем кадре.
5. Помечает граф как «грязный» для индикации несохранённых изменений.

## onGlobalUp()

```javascript
onGlobalUp(): void
```

Глобальный обработчик отпускания мыши после перетаскивания.

**Алгоритм:**
1. **Восстанавливает CSS-анимацию** на перетаскиваемом узле (удаляет inline `transition: none`, возвращая управление CSS-классу).
2. **Отменяет** ожидающий rAF-вызов `updateEdgePositions()` (если был запланирован) и **синхронно обновляет** позиции рёбер в финальную позицию узла.
3. Сохраняет состояние в истории (undo/redo).
4. Сбрасывает курсор и `this.dragNode`.

## setVirtual(enabled)

```javascript
setVirtual(enabled: boolean): void
```

Включает или выключает режим виртуализации.

## attachTouchFeedback()

Вызывается из конструктора. Добавляет делегированные touch-обработчики на слой узлов (`this.layer`):
- `touchstart` — добавляет CSS-класс `.node-touch-active` (scale 1.02 + glow)
- `touchend` — удаляет класс через 150ms (чтобы эффект был заметен)
- `touchcancel` — удаляет класс сразу

Использует `{ passive: true }` для оптимальной производительности на мобильных устройствах.

## closeMenu()

```javascript
closeMenu(): void
```

Закрывает контекстное меню.

## Перетаскивание связей (edge dragging)

### startDragEdge(sourceId, port, clientX, clientY)

Создаёт временную SVG-линию (`tempLine`) от порта-источника. Координаты старта (`x1`, `y1`) передаются в Canvas-координатах, конвертированных из клиентских через `getCanvasCoords()`. 

> **Важно:** Стартовая точка всегда вычисляется от центра хендла порта (`handle.getBoundingClientRect()`), а не от клиентских координат мыши. Это гарантирует правильное положение линии независимо от CSS-трансформации узла (scale при ховере).

### onGlobalMoveEdge(event)

Вызывается из глобальных обработчиков `mousemove`/`touchmove`. Обновляет `x2`/`y2` временной линии. Если включена премиум-функция `magneticNodesEnabled`, вызывает `updateMagneticPreview()` вместо обычного обновления.

### updateMagneticPreview(clientX, clientY, fallbackPoint)

Премиум-функция. При перетаскивании связи проверяет ближайший узел (40px зона):

- **Совместимый тип данных** — линия становится сплошной + рисуется стрелка-треугольник (`_addTempArrow`) в середине + узел подсвечивается сиреневым (класс `node-magnetic-snap`)
- **Несовместимый тип** — линия остаётся пунктирной, узел подсвечивается красноватым (класс `node-magnetic-glow`)
- **Нет узла рядом** — обычное поведение

Проверка совместимости выполнена через `window.typeSystem` по дататипу (игнорируя флаги `canHaveIncomingEdges`/`canHaveOutgoingEdges`): если `allowedInputTypes` цели пуст — любой тип совместим, иначе проверяется вхождение source-типа в список.

### _addTempArrow(fromPoint, toPoint)

Создаёт SVG-`polygon` (стрелку) на временной SVG-прослойке (`tempSvg`). Стрелка позиционируется на середине линии, цвет — `window.__premiumAccent()` (оранжевый или сиреневый). Обновляется при каждом движении мыши через `_updateTempArrow`.

### _removeTempArrow()

Удаляет стрелку из временной SVG и обнуляет ссылку `_tempArrow`. Вызывается при очистке линии или при уходе из магнитной зоны.

## Инерция узлов (overshoot bounce)

Премиум-функция, управляемая `localStorage('premium_overshoot_bounce')`. В `onGlobalUp()` при отпускании узла после перетаскивания:

1. Рассчитывается velocity на основе истории последних 5 позиций (`_dragHistory`)
2. Если скорость превышает порог (5px), узел продолжает движение по инерции с затуханием (коэффициент 0.95) до 60px максимум
3. Пружинит обратно с `cubic-bezier(0.22, 2.2, 0.4, 1)` за 450ms

Контролируется через `this.inertiaEnabled` (функция, возвращающая boolean).

### Particle Trail (частицы при драге)

Премиум-функция, управляемая `localStorage('premium_particle_trail')`. При перетаскивании узла за ним тянется шлейф светящихся частиц:

1. Canvas-оверлей (`#particleTrailCanvas`) поверх вьюпорта (`z-index: 10000`, `pointer-events: none`)
2. 2 частицы за фрейм, случайное направление (0.3–1.5 px/фрейм), размер 2–6px
3. Частицы затухают (`life -= decay`), замедляются (`vx *= 0.98`, `vy *= 0.98`)
4. Цвет — динамический `var(--accent)` темы (жёлтый/сиреневый)
5. Лимит: макс 200 частиц
6. При отпускании драга частицы перестают спавниться, оставшиеся доживают и затухают

Гейтинг: `_isPremium() && localStorage.getItem('premium_particle_trail') === 'true'`

**Добавленные поля:**

| Поле | Тип | Описание |
|---|---|---|
| `_particles` | `Array<object>` | Массив частиц (`worldX, worldY, vx, vy, life, decay, size`) |
| `_particleSpawnActive` | `boolean` | Флаг активности спавна частиц |
| `_particleAnimId` | `number\|null` | ID rAF для анимации частиц |
| `_particleCanvas` | `HTMLCanvasElement\|null` | Canvas-оверлей для рендера частиц |
| `_particleCtx` | `CanvasRenderingContext2D\|null` | 2D-контекст канваса |

### Блокировка ховеров при инерции

При активации инерции на `document.body` добавляется класс `inertia-active`, а в CSS — правило:

```css
body.inertia-active .node {
  pointer-events: none !important;
}
```

Это предотвращает мигание hover-эффектов на других узлах, когда инертный узел пролетает над ними.

## Ошибка соединения (connect error flash)

Когда `this.graph.addEdge()` возвращает `null` (неудачное соединение), `onGlobalUpEdge()` находит оба узла через `document.querySelector('.node[data-id="..."]')` и применяет inline-стиль:

```javascript
el.style.setProperty('box-shadow', '0 0 0 4px #ff4444, 0 0 35px rgba(255,68,68,0.6)', 'important');
```

Через 600мс стиль удаляется. CSS-анимация `connect-error-flash` (pulsing red border) также добавляется через класс `node-connect-error` как резерв.

## Свойства

| Свойство | Тип | Описание |
|---|---|---|
| `inertiaEnabled` | `function(): boolean` | Включена ли инерция (чтение localStorage) |
| `magneticNodesEnabled` | `function(): boolean` | Включены ли магнитные узлы (чтение localStorage + premium check) |
| `magneticNode` | `HTMLElement|null` | Текущий магнитный узел под курсором |
| `_tempArrow` | `SVGPolygonElement|null` | Стрелка на временной линии |
| `_dragHistory` | `Array<{x,y,t}>` | История позиций для расчёта velocity инерции |
| `_inertiaAnimId` | `number|null` | ID анимационного фрейма инерции |
| `isDraggingEdge` | `boolean` | Флаг перетаскивания связи |
| `edgeSourceId` | `number|null` | ID узла-источника при перетаскивании |
| `edgeSourcePort` | `string` | Тип порта ('main' или 'unmapped') |

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Создание и настройка рендерера

```javascript
const renderer = new DomRenderer(graph, nodesLayer, viewportEl, eventBus);
renderer.setViewport(viewport);
renderer.setSnapToGrid(() => this.snapToGrid, () => this.gridSize);
renderer.render();
```

### Защита от ошибок при отрисовке

```javascript
// Рендерер автоматически обрабатывает узлы без метода createDOM
// Вместо падения приложения показывается красная заглушка с сообщением об ошибке
renderer.renderAll();
```

## ЗАМЕЧАНИЯ

- **Защита от отсутствующих методов:** Рендерер устойчив к ошибкам, когда узлы имеют некорректную структуру (например, созданные при несовместимых соединениях). Вместо падения приложения создаётся визуальная заглушка.
- **Виртуализация:** При включённой виртуализации рендерятся только видимые узлы, что значительно улучшает производительность на больших графах.
- **Кэширование:** `elementCache` и `heightCache` ускоряют повторную отрисовку. При изменении узла необходимо вызывать `invalidateCache(node.id)`.
- **Прилипание к сетке:** Работает только при перетаскивании узлов, не при программном изменении координат.
- **Глобальные обработчики:** Должны быть привязаны на уровне `window` в родительском приложении (`main.js`).
