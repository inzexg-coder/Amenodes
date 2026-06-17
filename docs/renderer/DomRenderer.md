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

## onGlobalMove(event)

```javascript
onGlobalMove(event: MouseEvent): void
```

Глобальный обработчик движения мыши при перетаскивании узла.

## onGlobalUp()

```javascript
onGlobalUp(): void
```

Глобальный обработчик отпускания мыши после перетаскивания.

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
