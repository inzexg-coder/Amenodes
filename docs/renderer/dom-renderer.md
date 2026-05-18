# `DomRenderer`

`DomRenderer` – основной класс визуализации графа, отвечающий за создание DOM-элементов узлов, 
управление их позиционированием, обработку перетаскивания, отрисовку временных линий при создании соединений, кэширование высоты узлов и виртуализацию (отсечение невидимых узлов). 
Интегрируется с `EdgeRenderer` для отображения связей.

**Путь в проекте:** `src/renderer/DomRenderer.js`

**Импорт:**
```javascript
import { DomRenderer } from './renderer/DomRenderer.js';
```

## Конструктор

```javascript
const renderer = new DomRenderer(graph, layer, viewportElement, eventBus);
```

**Параметры:**
- `graph: Graph` – экземпляр графа для отрисовки
- `layer: HTMLElement` – DOM-элемент (обычно `#nodesLayer`), в который будут помещены узлы
- `viewportElement: HTMLElement` – элемент области просмотра (обычно `#viewport`)
- `eventBus: EventBus` – шина событий для межкомпонентного взаимодействия

**Внутренние свойства:**
- `layer` – контейнер для узлов
- `viewportElement` – элемент области просмотра
- `viewport: Viewport` – ссылка на контроллер панорамирования (устанавливается через `setViewport`)
- `history: History` – ссылка для сохранения состояния (устанавливается через `setHistory`)
- `dragNode: Node | null` – перетаскиваемый узел
- `dragStartX, dragStartY` – координаты начала перетаскивания в экранных пикселях
- `dragNodeStartX, dragNodeStartY` – начальные координаты узла в мировых координатах
- `isDraggingEdge: boolean` – флаг создания соединения
- `edgeSourceId: number | null` – ID узла-источника при создании соединения
- `edgeSourcePort: string | null` – порт источника (`'main'` или `'unmapped'`)
- `tempLine: SVGLineElement | null` – временная линия для визуализации создания связи
- `tempSvg: SVGSVGElement | null` – контейнер для временной линии
- `virtual: boolean` – флаг виртуализации (отсечение невидимых узлов)
- `heightCache: Map<number, number>` – кэш высот узлов
- `elementCache: Map<number, HTMLElement>` – кэш DOM-элементов узлов
- `opts: Object` – настройки оптимизаций (`willChange`, `contain`, `pointerEvents`)
- `edgeRenderer: EdgeRenderer` – экземпляр для отрисовки связей

## Настройка зависимостей

### `setViewport(viewport)`

Устанавливает экземпляр `Viewport` для координации панорамирования и масштабирования.

```javascript
import { Viewport } from './Viewport.js';
const viewport = new Viewport(viewportElement, canvasContainer);
renderer.setViewport(viewport);
```

Также сохраняет глобальную ссылку `window._viewport`.

### `setHistory(history)`

Устанавливает экземпляр `History` для сохранения состояния после изменений.

```javascript
import { History } from '../core/History.js';
const history = new History(graph);
renderer.setHistory(history);
window._history = history; // устанавливается автоматически
```

### `save()`

Вызывает `history.save()` для сохранения текущего состояния графа. Используется после любых изменений, которые должны быть отменяемы.

```javascript
renderer.save(); // после перемещения узла, удаления связи и т.д.
```

## Кэширование и инвалидация

### `invalidateCache(nodeId)`

Удаляет из кэша высоту и DOM-элемент для указанного узла. Вызывается при изменении содержимого узла (добавление/удаление строк в группе, изменение правил карты и т.д.).

```javascript
renderer.invalidateCache(5);
renderer.render(); // после инвалидации рендер создаст новый DOM
```

### `getNodeHeight(node)`

Возвращает вычисленную высоту узла в пикселях с использованием кэша.

```javascript
const height = renderer.getNodeHeight(someNode);
console.log(`Node height: ${height}px`);
```

**Логика:**
1. Если есть в кэше – возвращает из `heightCache`
2. Иначе получает базовую высоту через `node.getMinHeight()`
3. Для специальных типов добавляет высоту на основе количества элементов, НАПРИМЕР:
   - `GroupNode`: `80 + values.length * 40`
   - `MapNode`: `80 + maps.length * 45`
   - `OutputNode`: `80 + rows.length * 35`
4. Сохраняет в кэш и возвращает значение

### `isNodeVisible(node, viewportRect, offset)`

Проверяет, попадает ли узел в видимую область с учётом отступа (margin = 300px).

```javascript
const viewportRect = { x: 0, y: 0, w: 1920, h: 1080 };
const offset = { x: -500, y: -200 };
const visible = renderer.isNodeVisible(node, viewportRect, offset); // boolean
```

## Управление DOM-элементами

### `updateNodeClass(node)`

Обновляет CSS-класс узла в зависимости от флага `important`.

```javascript
node.important = true;
renderer.updateNodeClass(node); // добавляет класс 'node-important'
```

### `applyOptStyles(element)`

Применяет к элементу оптимизационные CSS-свойства на основе текущих настроек `opts`.

```javascript
renderer.opts.willChange = true;
renderer.opts.contain = true;
renderer.applyOptStyles(nodeElement);
// element.style.willChange = 'left, top';
// element.style.contain = 'layout paint';
```

### `addHandles(container, nodeId, unmappedPort)`

Добавляет к узлу порты (маленькие кружки) для создания соединений.

```javascript
const nodeDiv = document.createElement('div');
renderer.addHandles(nodeDiv, 5, null); // стандартные 4 порта
renderer.addHandles(nodeDiv, 5, 'unmapped'); // + голубой порт
```

**Порты:**
- `top`, `right`, `bottom`, `left` – стандартные оранжевые порты
- Если `unmappedPort === 'unmapped'` – добавляется дополнительный голубой порт справа со смещением 20px вниз

## Рендеринг

### `render()`

Главный метод отрисовки. В зависимости от флага `virtual` вызывает либо виртуализированный рендер, либо полный.

```javascript
renderer.render(); // обновляет отображение графа
```

**Алгоритм (виртуализация включена):**
1. Вычисляет видимую область через `viewport.getRect()` и смещение
2. Фильтрует узлы: `visibleNodes` и `hiddenNodes`
3. Удаляет из DOM скрытые узлы (если они были в кэше)
4. Для видимых узлов:
   - Если нет в `elementCache` – вызывает `node.createDOM()` и сохраняет
   - Добавляет в `layer`, если ещё не добавлен
   - Обновляет позицию: `left: node.x + 'px'`, `top: node.y + 'px'`
   - Обновляет класс важности и оптимизационные стили
5. Вызывает `renderEdges()` только для видимых узлов

### `renderAll()`

Полный рендер без виртуализации. Очищает `layer`, пересоздаёт все DOM-элементы и рендерит все связи.

```javascript
renderer.renderAll();
```

### `clearTemp()`

Удаляет из `layer` все временные SVG-элементы (классы `temp` и `edge-layer`). Вызывается перед каждым рендером.

## Работа со связями (Drag & Drop)

### `onHandleDown(event)`

Обработчик нажатия на порт узла. Реализует детекцию перетаскивания:

- Если пользователь просто кликнул – через 5px движения считается кликом и открывается контекстное меню
- Если переместил мышь более чем на 5px – начинает создание связи

```javascript
// Внутри createDOM узла:
const handle = document.createElement('div');
handle.addEventListener('mousedown', renderer.onHandleDown.bind(renderer));
```

### `startDragEdge(sourceId, port, clientX, clientY)`

Инициализирует создание временной линии для новой связи.

```javascript
renderer.startDragEdge(1, 'main', 500, 300);
```

**Создаёт:**
- SVG-контейнер с классом `temp`
- Линию со штриховкой `stroke-dasharray="6,4"`
- Цвет: для обычного порта `#ffaa55`, для голубого `#44aaff`

### `onGlobalMoveEdge(event)`

Обновляет координаты временной линии при движении мыши. Вызывается глобальным обработчиком в `main.js`.

### `onGlobalUpEdge(event)`

Завершает создание связи:
1. Находит элемент под курсором с классом `node`
2. Получает его ID
3. Если целевой ID существует и не равен источнику – вызывает `graph.addEdge()`
4. В случае успеха – пересчитывает граф, обновляет выводы, рендерит и сохраняет состояние

## Перетаскивание узлов

### `attachDragEvents()`

Находит все DOM-элементы с классами заголовков (`node-header`, `(нод)-header`) и добавляет обработчик `mousedown`.

**Вызывается:**
- Автоматически в `renderAll()`
- В виртуализированном режиме – после добавления новых узлов в DOM

### `onNodeDown(event)`

Начинает перетаскивание узла. Игнорирует клики по:
- Портам (`.node-handle`)
- Кнопкам действий (`.node-actions`)
- Полям ввода (`input`)
- Кнопкам (`button`)
- Редактируемым заголовкам (`.title-editable`)

```javascript
// Условия для игнорирования:
if (event.target.closest('.node-handle')) return;
if (event.target.closest('.node-actions')) return;
// ... и т.д.
```

Сохраняет начальные координаты узла и позицию курсора.

### `onGlobalMove(event)`

Обрабатывает перемещение узла при зажатой левой кнопке:
1. Вычисляет дельту с учётом масштаба (`/ window.currentZoom`)
2. Обновляет `node.x` и `node.y`
3. Синхронизирует позицию DOM-элемента
4. Вызывает `render()` для обновления связей

### `onGlobalUp(event)`

Завершает перетаскивание и сохраняет состояние через `save()`.

## Контекстное меню

### `showMenu(x, y, sourceId)`

Открывает контекстное меню для порта узла.

```javascript
// Вызывается из onHandleDown при клике без перетаскивания
renderer.showMenu(500, 300, 1);
```

Создаёт экземпляр `ContextMenu` (ленивая инициализация) и вызывает его метод `show()`.

### `closeMenu()`

Закрывает открытое контекстное меню.

```javascript
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    renderer.closeMenu();
  }
});
```

## Управление виртуализацией

### `setVirtual(enabled)`

Включает или выключает режим виртуализации.

```javascript
renderer.setVirtual(true);  // включает отсечение невидимых узлов
renderer.setVirtual(false); // отключает, рендерит все узлы
```

**Эффекты:**
- `virtual = true` – рендерятся только видимые узлы, что улучшает производительность при 50+ узлах
- При изменении состояния очищается `elementCache` и вызывается `render()`

## Работа с глобальными координатами

### `getCanvasCoords(clientX, clientY)`

Преобразует экранные координаты в мировые с учётом панорамирования и масштаба.

```javascript
const worldPoint = renderer.getCanvasCoords(800, 600);
console.log(`World: ${worldPoint.x}, ${worldPoint.y}`);
```

**Формула:**
```javascript
worldX = (clientX - rect.left - offset.x) / zoom
worldY = (clientY - rect.top - offset.y) / zoom
```

## Примеры использования

### Базовый рендеринг графа

```javascript
import { Graph } from '../core/Graph.js';
import { DomRenderer } from './DomRenderer.js';
import { NumberNode } from '../nodes/NumberNode.js';

const graph = new Graph();
const node = new NumberNode(null, 100, 100, 'Value', 42);
graph.addNode(node);

const layer = document.getElementById('nodesLayer');
const viewportEl = document.getElementById('viewport');
const renderer = new DomRenderer(graph, layer, viewportEl, eventBus);

renderer.render(); // отображает узел на странице
```

### Включение виртуализации для большого графа

```javascript
// При 100+ узлах
if (graph.nodes.length > 50) {
  renderer.setVirtual(true);
}
```

### Кастомная обработка перетаскивания узла

```javascript
// Отключение перетаскивания для определённого узла
const customNodeDiv = document.createElement('div');
const header = customNodeDiv.querySelector('.node-header');
if (header) {
  header.removeEventListener('mousedown', renderer.onNodeDown.bind(renderer));
  // Или добавляем свою логику
}
```

### Работа с кэшем высоты

```javascript
// Принудительное обновление высоты после изменения содержимого узла
function onGroupNodeChange(groupNode) {
  renderer.invalidateCache(groupNode.id);
  graph.reevaluateAll();
  renderer.render();
}
```

## Оптимизационные настройки

Объект `opts` управляет экспериментальными оптимизациями CSS:

```javascript
renderer.opts = {
  willChange: false,   // CSS will-change: left, top
  contain: false,      // CSS contain: layout paint
  pointerEvents: false // настройка pointer-events для линий
};
```

Эти флаги устанавливаются через `OptimizationPanel` и применяются при вызове `applyOptStyles()` для каждого узла.

## Взаимодействие с EdgeRenderer

```javascript
// EdgeRenderer создаётся внутри конструктора
this.edgeRenderer = new EdgeRenderer(this.layer);

// Установка колбэка на удаление связи
this.edgeRenderer.setOnEdgeRemoved(() => {
  this.graph.reevaluateAll();
  this.graph.updateAllOutputs();
  this.render();
  this.save();
});
```

## Наследование и расширение

Класс `DomRenderer` не предназначен для наследования, так как является конечной реализацией рендерера на DOM. Однако ключевые методы могут быть переопределены для создания кастомного поведения:

```javascript
class CustomRenderer extends DomRenderer {
  render() {
    // Кастомная логика
    super.render();
    // Дополнительные эффекты
  }
  
  getNodeHeight(node) {
    // Переопределение расчёта высоты
    return 200; // фиксированная высота
  }
}
```

## Исключения и ошибки

- При отсутствии `layer` или `viewportElement` в конструкторе – рендер не будет работать, но исключение не выбрасывается (DOM просто не обновится).
- Если `graph.getNode()` возвращает `undefined` при рендере связей – связь игнорируется.
- При попытке сохранить состояние без установленного `history` – метод `save()` ничего не делает.
- В виртуализированном режиме при быстром скролле может быть заметна подгрузка узлов (margin = 300px сглаживает этот эффект).

## Производительность

- **Кэш высоты** – значительно ускоряет расчёты позиционирования при виртуализации.
- **Кэш элементов** – предотвращает повторное создание DOM-узлов при скролле.
- **Виртуализация** – основная оптимизация для больших графов (100+ узлов).
- `will-change` и `contain` – улучшают производительность анимаций на современных браузерах.
- При 1000+ узлах рекомендуется включить все оптимизации и установить качество дизайна на 20–50%.
