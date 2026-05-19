# `EdgeRenderer`

`EdgeRenderer` – специализированный класс для отрисовки связей (линий) между узлами графа. Он создаёт SVG-элементы, вычисляет точки пересечения линий с границами узлов, добавляет стрелки для указания направления и обеспечивает интерактивность (удаление связи по правому клику). Класс полностью изолирован от остальной логики графа и занимается только визуализацией.

**Путь в проекте:** `src/renderer/EdgeRenderer.js`

**Импорт:**
```javascript
import { EdgeRenderer } from './renderer/EdgeRenderer.js';
```

## Конструктор

```javascript
const edgeRenderer = new EdgeRenderer(layer);
```

**Параметры:**
- `layer` (HTMLElement) – DOM-элемент, в который будут добавляться SVG с линиями. Обычно это `nodesLayer`.

**Внутренние свойства:**
- `layer: HTMLElement` – контейнер для SVG
- `onEdgeRemoved: Function | null` – колбэк, вызываемый после удаления ребра

## Основные методы

### `renderEdges(edges, graph, rectCache)`

Главный метод, отрисовывающий все переданные связи. Удаляет предыдущий слой линий и создаёт новый.

```javascript
const edges = graph.edges;
const rectCache = new Map();

// Подготовка кэша позиций узлов
graph.nodes.forEach(node => {
  rectCache.set(node.id, {
    x: node.x,
    y: node.y,
    w: 280,        // фиксированная ширина узла
    h: nodeHeight  // высота, полученная из DomRenderer.getNodeHeight()
  });
});

edgeRenderer.renderEdges(edges, graph, rectCache);
```

**Алгоритм:**
1. Удаляет старый SVG-слой с классом `edge-layer`
2. Создаёт новый SVG через `createSvgLayer()`
3. Для каждого ребра:
   - Получает исходный и целевой узлы из графа
   - Извлекает их прямоугольники из `rectCache`
   - Вычисляет точки прикрепления линии к границам через `getBorderPoint()`
   - Определяет цвет (оранжевый для `main`, голубой для `unmapped`)
   - Создаёт линию через `createLine()`
   - Создаёт стрелку через `createArrow()`
   - Добавляет обработчик `contextmenu` для удаления ребра
   - Добавляет линию и стрелку в SVG
4. Добавляет SVG в `layer`

**Важно:** метод не вызывает перерисовку узлов – только линии. `DomRenderer` управляет порядком вызова.

### `setOnEdgeRemoved(callback)`

Устанавливает колбэк, который будет вызван после удаления ребра (через контекстное меню). Обычно используется для запуска пересчёта графа и сохранения состояния.

```javascript
edgeRenderer.setOnEdgeRemoved(() => {
  graph.reevaluateAll();
  graph.updateAllOutputs();
  renderer.save();
});
```

## Методы создания SVG-элементов

### `createSvgLayer()`

Создаёт пустой SVG-элемент для слоя линий.

**Возвращает:** `SVGSVGElement`

**Стили:**
- `position: absolute` – позиционирование поверх узлов
- `top: 0; left: 0` – выравнивание по родителю
- `pointer-events: none` – линии не блокируют клики по узлам (кроме области strokes)
- `overflow: visible` – линии не обрезаются за пределами SVG

```javascript
const svg = edgeRenderer.createSvgLayer();
svg.classList.add('my-custom-class');
```

### `createLine(p1, p2, color, edgeId)`

Создаёт линию между двумя точками.

**Параметры:**
- `p1: { x: number, y: number }` – начальная точка (на границе исходного узла)
- `p2: { x: number, y: number }` – конечная точка (на границе целевого узла)
- `color: string` – цвет линии (HEX или CSS-цвет)
- `edgeId: number` – идентификатор ребра (для отладки)

**Возвращает:** `SVGLineElement`

**Стили:**
- `stroke-width: 3` – толщина линии
- `stroke-linecap: round` – скруглённые концы
- `pointer-events: visibleStroke` – линия реагирует на клик только по видимой части (не по прозрачной области)
- `data-edge-id` – атрибут с ID ребра

**Пример:**
```javascript
const line = edgeRenderer.createLine(
  { x: 150, y: 200 },
  { x: 450, y: 200 },
  '#ffb347',
  42
);
svg.appendChild(line);
```

### `createArrow(p1, p2, color)`

Создаёт стрелку (треугольник) в средней точке линии, указывающую направление от источника к цели.

**Параметры:**
- `p1: { x: number, y: number }` – начальная точка (источник)
- `p2: { x: number, y: number }` – конечная точка (цель)
- `color: string` – цвет стрелки (обычно совпадает с цветом линии)

**Возвращает:** `SVGPolygonElement`

**Алгоритм построения стрелки:**
1. Вычисляет среднюю точку `mid = ((p1.x+p2.x)/2, (p1.y+p2.y)/2)`
2. Вычисляет угол линии: `angle = atan2(p2.y - p1.y, p2.x - p1.x)`
3. Определяет точку острия: `tip = (mid.x + cos(angle)*6, mid.y + sin(angle)*6)`
4. Определяет основание: `back = (mid.x - cos(angle)*8, mid.y - sin(angle)*8)`
5. Определяет перпендикулярные крылья: `perp = (-sin(angle)*5, cos(angle)*5)`
6. Строит треугольник: `tip → back+perp → back-perp`

**Размеры:**
- Длина стрелки: 14 пикселей (6 + 8)
- Ширина стрелки: 10 пикселей (5+5)

```javascript
const arrow = edgeRenderer.createArrow(
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  '#ffb347'
);
```

## Геометрические вычисления

### `getBorderPoint(fromRect, toRect)`

Вычисляет точку на границе прямоугольника `fromRect`, через которую проходит линия к центру `toRect`. Это ключевой метод для точного прикрепления линий к узлам.

**Параметры:**
- `fromRect: { x: number, y: number, w: number, h: number }` – прямоугольник исходного узла
- `toRect: { x: number, y: number, w: number, h: number }` – прямоугольник целевого узла

**Возвращает:** `{ x: number, y: number }` – точка на границе `fromRect`

**Алгоритм:**
1. Вычисляет центры обоих прямоугольников
2. Вычисляет вектор от центра `from` к центру `to`
3. Перебирает 4 возможных пересечения луча с границами (левая, правая, верхняя, нижняя)
4. Выбирает пересечение с наименьшим положительным параметром `t` (ближайшее к центру)
5. Если пересечений нет (например, прямоугольники совпадают), возвращает нижнюю границу

**Пример работы:**
```javascript
const sourceRect = { x: 100, y: 100, w: 280, h: 200 };
const targetRect = { x: 500, y: 150, w: 280, h: 180 };

const point = edgeRenderer.getBorderPoint(sourceRect, targetRect);
// { x: 380, y: 180 } – правая граница sourceRect
```

## Примеры использования

### Базовая отрисовка всех связей

```javascript
import { EdgeRenderer } from './renderer/EdgeRenderer.js';
import { Graph } from './core/Graph.js';

const graph = new Graph();
// ... добавление узлов и связей

const nodesLayer = document.getElementById('nodesLayer');
const edgeRenderer = new EdgeRenderer(nodesLayer);

// Подготовка кэша высот
const rectCache = new Map();
for (const node of graph.nodes) {
  rectCache.set(node.id, {
    x: node.x,
    y: node.y,
    w: 280,
    h: node.getMinHeight()
  });
}

// Отрисовка
edgeRenderer.renderEdges(graph.edges, graph, rectCache);
```

### Интеграция с DomRenderer

Внутри `DomRenderer.renderEdges()` метод используется так:

```javascript
renderEdges(visibleNodes) {
  const nodeIds = new Set(visibleNodes.map(n => n.id));
  const filteredEdges = this.graph.edges.filter(e => 
    nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)
  );
  
  const rectCache = new Map();
  for (const node of visibleNodes) {
    rectCache.set(node.id, {
      x: node.x,
      y: node.y,
      w: 280,
      h: this.getNodeHeight(node)
    });
  }
  
  this.edgeRenderer.renderEdges(filteredEdges, this.graph, rectCache);
}
```

### Удаление связи с подтверждением

```javascript
// В EdgeRenderer.createLine() устанавливается обработчик
line.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  
  // Подтверждение удаления (можно добавить модальное окно)
  if (confirm('Delete this connection?')) {
    graph.removeEdge(edge.id);
    graph.reevaluateAll();
    graph.updateAllOutputs();
    
    if (this.onEdgeRemoved) {
      this.onEdgeRemoved(); // вызывает перерисовку
    }
  }
});
```

### Кастомные цвета для разных типов портов

```javascript
// В EdgeRenderer.renderEdges()
for (const edge of edges) {
  const isBlue = edge.sourcePort === 'unmapped';
  const color = isBlue ? "#44aaff" : "#ffb347";
  
  const line = this.createLine(point1, point2, color, edge.id);
  const arrow = this.createArrow(point1, point2, color);
  
  svg.appendChild(line);
  svg.appendChild(arrow);
}
```

## Наследование и расширение

`EdgeRenderer` не предназначен для наследования, но вы можете создать наследника для кастомной отрисовки:

```javascript
class CustomEdgeRenderer extends EdgeRenderer {
  createArrow(p1, p2, color) {
    // Использовать другую форму стрелки
    const arrow = super.createArrow(p1, p2, color);
    arrow.setAttribute('stroke-width', '2');
    return arrow;
  }
  
  createLine(p1, p2, color, edgeId) {
    const line = super.createLine(p1, p2, color, edgeId);
    // Добавить анимацию или пунктир
    line.setAttribute('stroke-dasharray', '10,5');
    return line;
  }
}
```

## Внутренние зависимости

Класс не импортирует другие модули проекта – он полностью самодостаточен. Использует только:
- `SVGElement` API браузера
- `graph.getNode()` для доступа к узлам (получает граф как параметр)
- `edge.sourcePort` для определения цвета

## Исключения и ошибки

- Если в `rectCache` отсутствует запись для узла, линия не рисуется (пропускается)
- Если `sourcePort` не `'main'` и не `'unmapped'`, цвет по умолчанию – `#ffb347`
- При удалении ребра обработчик должен сам вызывать обновление графа – `EdgeRenderer` не знает о `Graph`

## Производительность

- **Кэширование прямоугольников:** `rectCache` передаётся из `DomRenderer`, что избегает повторных вызовов `getBoundingClientRect()`.
- **Пересоздание всего слоя:** при каждом вызове `renderEdges()` старый SVG полностью удаляется и создаётся новый. Для сотен связей это может быть затратно.
- **Pointer-events:** `pointer-events: visibleStroke` минимизирует область клика, ускоряя обработку событий.
- **Оптимизация видимости:** в `DomRenderer` используется фильтрация `filteredEdges`, чтобы рисовать только связи между видимыми узлами.

## Совместимость с оптимизациями

`EdgeRenderer` поддерживает следующие оптимизации из `Optimizations.js`:
- **#12 Pointer-events линий** – использует `visibleStroke` по умолчанию

При включении **виртуализации** (`#0`) `EdgeRenderer` получает только связи между видимыми узлами через `filteredEdges`, что значительно ускоряет отрисовку при 100+ узлах.

## Пример полного цикла: создание, отрисовка, удаление

```javascript
// 1. Создание связи
const edge = graph.addEdge(1, 2);
if (edge) {
  // 2. Пересчёт графа
  graph.reevaluateAll();
  graph.updateAllOutputs();
  
  // 3. Отрисовка через DomRenderer (который вызывает EdgeRenderer)
  domRenderer.render();
}

// 4. Пользователь кликает правой кнопкой на линии
// Обработчик внутри EdgeRenderer:
// - graph.removeEdge(edge.id)
// - вызывает onEdgeRemoved()
// - onEdgeRemoved запускает пересчёт и перерисовку
```
