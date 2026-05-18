# `Edge.md`
`Edge` – класс, представляющий соединение (связь) между выходным портом одного узла и узлом-приёмником. Ребро определяет направление потока данных в графе: от источника к цели. Каждое ребро имеет уникальный идентификатор, ссылки на ID узлов и указание, какой именно выходной порт источника используется.

**Путь в проекте:** `src/core/Edge.js`

**Импорт:**
```javascript
import { Edge } from './core/Edge.js';
```

## Конструктор

```javascript
const edge = new Edge(id, sourceId, targetId, port = 'main');
```

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `number` | Уникальный идентификатор ребра (обычно из `graph.nextEdgeId`) |
| `sourceId` | `number` | ID узла-источника (откуда идут данные) |
| `targetId` | `number` | ID узла-приёмника (куда идут данные) |
| `port` | `string` | Выходной порт источника: `'main'` (оранжевый) или `'unmapped'` (голубой) |

**Пример:**
```javascript
// Стандартное соединение через основной порт
const edge1 = new Edge(1, 5, 10, 'main');

// Соединение через специальный голубой порт
const edge2 = new Edge(2, 7, 12, 'unmapped');
```

**Внутренние свойства:**
- `this.id: number` – идентификатор ребра
- `this.sourceId: number` – ID источника
- `this.targetId: number` – ID приёмника
- `this.sourcePort: string` – используемый порт источника

## Методы

### `toJSON()`

Возвращает объект для сериализации ребра. Используется при сохранении схемы в файл `.amnk` или `localStorage`.

```javascript
const edge = new Edge(1, 5, 10, 'main');
const json = edge.toJSON();
// Результат:
// {
//   id: 1,
//   sourceId: 5,
//   targetId: 10,
//   sourcePort: "main"
// }
```

**Возвращает:** `{ id: number, sourceId: number, targetId: number, sourcePort: string }`

**Использование в Graph:**
```javascript
// При сохранении графа
const serializedGraph = {
  nodes: this.nodes.map(n => n.toJSON()),
  edges: this.edges.map(e => e.toJSON()), // ← здесь используется Edge.toJSON()
  nextId: this.nextId,
  nextEdgeId: this.nextEdgeId
};
```

## Примеры использования

### Создание ребра вручную (не рекомендуется)

Хотя можно создать ребро напрямую, правильный способ – использовать `graph.addEdge()`:

```javascript
import { Graph } from './core/Graph.js';
import { Edge } from './core/Edge.js';

const graph = new Graph();
// ... добавление узлов ...

// Ручное создание (без проверок!)
const edge = new Edge(1, 5, 10, 'main');
graph.edges.push(edge);
```

### Создание ребра через Graph (рекомендуемый способ)

```javascript
const graph = new Graph();
const sourceNode = new NumberNode(null, 100, 100, 'Input', 42);
const targetNode = new OutputNode(null, 400, 100, 'Output', []);

graph.addNode(sourceNode);
graph.addNode(targetNode);

// Graph.addEdge() создаёт Edge внутри себя
const edge = graph.addEdge(sourceNode.id, targetNode.id, 'main');

console.log(edge.id);          // 1
console.log(edge.sourceId);    // id источника
console.log(edge.targetId);    // id приёмника
console.log(edge.sourcePort);  // 'main'
```

### Обработка порта 'unmapped' (на примере MapNode)

```javascript
import { MapNode } from './nodes/MapNode.js';

const mapNode = new MapNode(null, 200, 200, 'Converter', []);
mapNode.unmappedMode = 'separate'; // Включаем отдельный голубой выход

graph.addNode(mapNode);
graph.addNode(outputNode);

// Подключаемся к голубому порту карты
const edge = graph.addEdge(mapNode.id, outputNode.id, 'unmapped');

console.log(edge.sourcePort); // 'unmapped'
```

### Итерация по рёбрам графа

```javascript
// Получить все рёбра, входящие в узел
const incomingEdges = graph.edges.filter(e => e.targetId === nodeId);

// Получить все рёбра, исходящие из узла
const outgoingEdges = graph.edges.filter(e => e.sourceId === nodeId);

// Для каждого ребра получить порт источника
for (const edge of outgoingEdges) {
  const portType = edge.sourcePort; // 'main' или 'unmapped'
  console.log(`Connection uses port: ${portType}`);
}
```

### Сериализация и десериализация

```javascript
// Сохранение графа
const serialized = {
  edges: graph.edges.map(edge => edge.toJSON())
};

// Восстановление рёбер из сохранённых данных
function restoreEdges(graph, savedEdges) {
  for (const edgeData of savedEdges) {
    const edge = new Edge(
      edgeData.id,
      edgeData.sourceId,
      edgeData.targetId,
      edgeData.sourcePort || 'main' // обратная совместимость
    );
    graph.edges.push(edge);
  }
  graph.nextEdgeId = Math.max(...savedEdges.map(e => e.id), 0) + 1;
}
```

## Наследование и расширение

Класс `Edge` является **финальным** (не предназначен для наследования). Он представляет простую структуру данных без логики. Все операции с рёбрами (создание, удаление, проверки) выполняются через класс `Graph`.

Если требуется расширить функциональность ребра (например, добавить метаданные или цвет), можно:

1. **Создать класс-наследник** (не рекомендуется, так как Graph ожидает именно Edge):
```javascript
class CustomEdge extends Edge {
  constructor(id, sourceId, targetId, port, metadata) {
    super(id, sourceId, targetId, port);
    this.metadata = metadata;
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      metadata: this.metadata
    };
  }
}
```

2. **Расширить Graph** для работы с кастомными рёбрами:
```javascript
class CustomGraph extends Graph {
  addEdge(sourceId, targetId, port = 'main', metadata = {}) {
    // ... проверки как в оригинале ...
    const edge = new CustomEdge(this.nextEdgeId++, sourceId, targetId, port, metadata);
    this.edges.push(edge);
    return edge;
  }
}
```

## Пример: создание сложного графа с рёбрами

```javascript
import { Graph } from './core/Graph.js';
import { NumberNode } from './nodes/NumberNode.js';
import { CalcNode } from './nodes/CalcNode.js';
import { OutputNode } from './nodes/OutputNode.js';
import { MapNode } from './nodes/MapNode.js';

const graph = new Graph();

// Создаём узлы
const temp = new NumberNode(null, 100, 100, 'Temperature', 25.5);
const pressure = new NumberNode(null, 100, 200, 'Pressure', 1013.25);
const calc = new CalcNode(null, 400, 150, 'Uncertainty', 'div3');
const map = new MapNode(null, 700, 150, 'Correction', []);
const output = new OutputNode(null, 1000, 150, 'Result', []);

// Включаем отдельный порт для карты
map.unmappedMode = 'separate';

// Добавляем узлы в граф
[temp, pressure, calc, map, output].forEach(node => graph.addNode(node));

// Создаём рёбра
graph.addEdge(temp.id, calc.id, 'main');
graph.addEdge(pressure.id, calc.id, 'main');
graph.addEdge(calc.id, map.id, 'main');
graph.addEdge(map.id, output.id, 'main');      // основной порт
graph.addEdge(map.id, output.id, 'unmapped');  // голубой порт – теперь у output два входа

// Проверяем созданные рёбра
console.log('Total edges:', graph.edges.length); // 5
console.log('Edges from map:', graph.edges.filter(e => e.sourceId === map.id).length); // 2
console.log('Edges to output:', graph.edges.filter(e => e.targetId === output.id).length); // 2

// Получаем детали рёбер
for (const edge of graph.edges) {
  console.log(`Edge ${edge.id}: ${edge.sourceId} → ${edge.targetId} via ${edge.sourcePort}`);
}
```

## Система типов и рёбра

Тип порта (`sourcePort`) влияет на то, какие данные передаются:

| `sourcePort` | Узел-источник | Передаваемые данные |
|--------------|---------------|---------------------|
| `'main'` | Любой | Основной выход узла |
| `'unmapped'` | Отдельный | Должен быть назначен |

```javascript
// Проверка порта при получении значений в Graph.getSourceValue()
if (source instanceof MapNode && port === 'unmapped') {
  return source.getUnmapped(); // специальный метод
}
```

## Ограничения и правила

1. **Уникальность пары (sourceId, targetId, sourcePort)** – Graph не позволяет создать два одинаковых ребра.
2. **Направленность** – ребро всегда направлено от источника к приёмнику. Обратные соединения требуют отдельного ребра.
3. **Порты приёмника** – узел-приёмник не различает порты; все входящие рёбра одинаково обрабатываются через `getMergedInput()`.
4. **Удаление при удалении узла** – при вызове `graph.removeNode()` все рёбра с участием этого узла автоматически удаляются.
5. **Сериализация порта** – для обратной совместимости при загрузке старых файлов отсутствие `sourcePort` интерпретируется как `'main'`.

## Производительность

- Хранение рёбер в плоском массиве (`graph.edges`) оптимально для графов с количеством рёбер до нескольких тысяч.
- Поиск рёбер для узла выполняется линейным проходом (`O(E)`). При необходимости частых запросов можно добавить индексы:
```javascript
class OptimizedGraph extends Graph {
  getIncomingEdges(targetId) {
    if (!this.incomingIndex) this.buildIndex();
    return this.incomingIndex.get(targetId) || [];
  }
  
  buildIndex() {
    this.incomingIndex = new Map();
    for (const edge of this.edges) {
      if (!this.incomingIndex.has(edge.targetId)) {
        this.incomingIndex.set(edge.targetId, []);
      }
      this.incomingIndex.get(edge.targetId).push(edge);
    }
  }
}
```

## Исключения и ошибки

При прямом использовании `Edge` (без Graph) исключения не выбрасываются – это просто контейнер данных. Все ошибки возникают на уровне `Graph.addEdge()`:

```javascript
const edge = new Edge(1, 2, 3, 'main'); // всегда успешно

// Но при попытке использовать в графе:
const result = graph.addEdge(2, 3); // может вернуть null при ошибке
if (result === null) {
  console.log('Edge creation failed: cycle or type mismatch');
}
```
