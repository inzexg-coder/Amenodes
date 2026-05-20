# `Graph`

## ОПИСАНИЕ

`Graph` – центральный класс приложения Amenodes, реализующий хранение, модификацию и вычисление графа, состоящего из узлов (`Node`) и рёбер (`Edge`). Класс отвечает за:

- добавление и удаление узлов;
- создание и удаление связей;
- проверку циклов и совместимости типов данных;
- вычисление значений, передаваемых по графу;
- сериализацию и десериализацию состояния графа;
- уведомление узлов об их присоединении/отсоединении.

**Важно:** все изменения графа должны выполняться через методы `Graph`. Прямое изменение массивов `nodes` или `edges` не допускается.

## ЗАВИСИМОСТИ

```javascript
import { Edge } from './Edge.js';
import { typeSystem } from './DataType.js';
import { NodeFactory } from '../nodes/NodeFactory.js';
import { modal } from '../ui/CustomModal.js';
import { i18n, t } from '../i18n/LanguageManager.js';
```

# КЛАСС GRAPH

## Конструктор

```javascript
constructor()
```

Создаёт новый пустой граф. Инициализирует:

| Свойство | Тип | Начальное значение | Описание |
|----------|-----|--------------------|----------|
| `this.nodes` | `Array<Node>` | `[]` | Массив всех узлов графа. |
| `this.edges` | `Array<Edge>` | `[]` | Массив всех связей графа. |
| `this.nextId` | `number` | `1` | Следующий доступный числовой идентификатор для нового узла. |
| `this.nextEdgeId` | `number` | `1` | Следующий доступный числовой идентификатор для нового ребра. |
| `this.map` | `Map<number, Node>` | `new Map()` | Карта для быстрого доступа к узлам по их `id`. |

### Публичные свойства

| Свойство | Тип | Доступ | Описание |
|----------|-----|--------|----------|
| `nodes` | `Array<Node>` | чтение/запись (только через методы) | Массив узлов. Не рекомендуется изменять напрямую. |
| `edges` | `Array<Edge>` | чтение/запись (только через методы) | Массив связей. Не рекомендуется изменять напрямую. |
| `nextId` | `number` | чтение | Счётчик для генерации ID новых узлов. |
| `nextEdgeId` | `number` | чтение | Счётчик для генерации ID новых рёбер. |

# Методы

## addNode(node)

```javascript
addNode(node: Node): Node
```

Добавляет узел в граф. Если у переданного узла отсутствует свойство `id`, оно автоматически присваивается из `this.nextId` с последующим инкрементом.

**Параметры:**

- `node` – экземпляр класса, производного от `Node`.

**Возвращает:** тот же экземпляр `node` (для цепочки вызовов).

- Узел добавляется в `this.nodes` и `this.map`.
- Если у узла определён метод `onAttach`, он вызывается с текущим графом в качестве аргумента.
- Увеличивается `this.nextId`, если узел не имел собственного `id`.

**Пример:**

```javascript
const graph = new Graph();
const outputNode = new OutputNode(null, 100, 100, 'Output');
graph.addNode(outputNode);
// outputNode.id теперь 1 (если не был задан)
```

## removeNode(id)

```javascript
removeNode(id: number): void
```

Удаляет узел по его идентификатору, а также все связанные с ним рёбра (как входящие, так и исходящие).

**Параметры:**

- `id` – числовой идентификатор удаляемого узла.

- Если у узла есть метод `onDetach`, он вызывается.
- Узел удаляется из `this.nodes` и `this.map`.
- Из `this.edges` удаляются все рёбра, у которых `sourceId === id` или `targetId === id`.

**Пример:**

```javascript
const nodeId = 2;
graph.removeNode(nodeId); // удаляет узел 2 и все его связи
```

## addEdge(sourceId, targetId, port)

```javascript
addEdge(sourceId: number, targetId: number, port: string = 'main'): Edge | null
```

Создаёт связь между двумя узлами после выполнения набора проверок:

1. Существование обоих узлов в графе.
2. Если у целевого узла определён метод `canAcceptEdge`, он вызывается для проверки допустимости связи.
3. Совместимость типов через `typeSystem.canConnect`.
4. Отсутствие цикла (вызов `hasCycle`).
5. Отсутствие дублирующей связи (одинаковые `sourceId`, `targetId`, `port`).

В случае неудачи любой проверки пользователю показывается модальное окно с сообщением об ошибке (через `modal.alert`), и связь не создаётся.

**Параметры:**

- `sourceId` – идентификатор узла-источника.
- `targetId` – идентификатор узла-приёмника.
- `port` – имя порта (по умолчанию `'main'`; используется для различения нескольких выходов).

**Возвращает:** созданный объект `Edge` или `null`, если связь не была добавлена.

**Пример:**

```javascript
const edge = graph.addEdge(1, 2, 'main');
if (edge) {
  console.log(`Создано ребро ${edge.id}`);
}
```

## removeEdge(id)

```javascript
removeEdge(id: number): void
```

Удаляет ребро по его идентификатору.

**Параметры:**

- `id` – числовой идентификатор ребра.

**Пример:**

```javascript
graph.removeEdge(5);
```

## getNode(id)

```javascript
getNode(id: number): Node | undefined
```

Возвращает узел по идентификатору или `undefined`, если узел не найден.

**Параметры:**

- `id` – идентификатор узла.

**Возвращает:** узел или `undefined`.

## getIncomingEdges(targetId)

```javascript
getIncomingEdges(targetId: number): Array<Edge>
```

Возвращает массив рёбер, для которых указанный узел является целью (`edge.targetId === targetId`).

## getOutgoingEdges(sourceId)

```javascript
getOutgoingEdges(sourceId: number): Array<Edge>
```

Возвращает массив рёбер, для которых указанный узел является источником (`edge.sourceId === sourceId`).

## hasCycle(source, target)

```javascript
hasCycle(source: number, target: number): boolean
```

Проверяет, создаст ли добавление ребра от `source` к `target` цикл в ориентированном графе. Использует поиск в глубину (DFS) по существующим рёбрам.

**Параметры:**

- `source` – идентификатор узла-источника.
- `target` – идентификатор узла-приёмника.

**Возвращает:** `true`, если существует путь от `target` к `source` (т.е. добавление ребра замкнёт цикл), иначе `false`.

**Примечание:** прямой цикл (`source === target`) также возвращает `true`.

## canConnect(sourceId, targetId, port)

```javascript
canConnect(sourceId: number, targetId: number, port: string = 'main'): boolean
```

Проверяет возможность соединения двух узлов на основе их типов данных, используя глобальную систему типов `typeSystem`. Не учитывает остальные проверки (существование узлов, циклы, дублирование).

**Параметры:**

- `sourceId` – идентификатор источника.
- `targetId` – идентификатор приёмника.
- `port` – порт (по умолчанию `'main'`).

**Возвращает:** `true`, если `typeSystem.canConnect` возвращает `true`, иначе `false`.

## getSourceValue(source, port, visited)

```javascript
getSourceValue(source: Node, port: string = 'main', visited: Set<number> = new Set()): Array<any>
```

Рекурсивно получает выходное значение узла, обходя возможные зависимости. Метод учитывает возможность циклических зависимостей через параметр `visited`.

**Параметры:**

- `source` – узел-источник.
- `port` – порт, для которого запрашивается значение.
- `visited` – набор идентификаторов уже посещённых узлов (используется для предотвращения бесконечной рекурсии).

**Алгоритм:**

- Если `visited` уже содержит `source.id`, возвращает пустой массив (защита от цикла).
- Иначе добавляет `source.id` в `visited`.
- Если у узла определён метод `getOutputValue`, вызывает его.
- Иначе вызывает `getValue()` узла.
- Результат приводится к массиву: если `null` или `undefined` → `[]`, если не массив → оборачивается в массив.

**Возвращает:** массив значений (может быть пустым).

## getMergedInput(nodeId)

```javascript
getMergedInput(nodeId: number): Array<any>
```

Вычисляет объединённое входное значение для узла на основе всех входящих рёбер. Для каждого входящего ребра вызывает `getSourceValue` и объединяет полученные массивы в один плоский массив.

**Параметры:**

- `nodeId` – идентификатор узла, для которого собираются входные данные.

**Возвращает:** массив значений со всех входящих соединений.

## reevaluateAll()

```javascript
reevaluateAll(): void
```

Вызывает метод `reevaluate` у всех узлов графа, которые его реализуют. Обычно это приводит к пересчёту внутренних значений узлов на основе текущих входных данных. 

## updateAllOutputs()

```javascript
updateAllOutputs(): void
```

Вызывает метод `updateDisplay` у всех узлов, которые его реализуют. Метод предназначен для обновления отображаемых данных без полного пересчёта логики.

## toSerial()

```javascript
toSerial(): object
```

Сериализует текущее состояние графа в простой JavaScript-объект, пригодный для сохранения в JSON.

**Возвращает:** объект со следующей структурой:

```javascript
{
  nodes: Array<object>,      // результат вызова node.toJSON() для каждого узла
  edges: Array<object>,      // результат вызова edge.toJSON() для каждого ребра
  nextId: number,            // текущее значение счётчика узлов
  nextEdgeId: number,        // текущее значение счётчика рёбер
  designQuality: number      // значение из window._designQualitySaved (или 100)
}
```

## loadFrom(data)

```javascript
loadFrom(data: object): void
```

Загружает состояние графа из ранее сохранённого объекта. Полностью заменяет текущий граф. Восстанавливает узлы, восстанавливает связи, вызывает `onAttach` для всех узлов, а затем выполняет `reevaluateAll()` и `updateAllOutputs()`.

**Параметры:**

- `data` – объект, содержащий поля `nodes`, `edges`, `nextId`, `nextEdgeId`, `designQuality` (опционально).

- Очищаются текущие `nodes`, `edges`, `map`.
- Устанавливаются `this.nextId` и `this.nextEdgeId` из `data`.
- Для каждого узла из `data.nodes` создаётся экземпляр через `NodeFactory`.
- Для каждого ребра создаётся объект `Edge`.
- После восстановления вызывается `reevaluateAll()` и `updateAllOutputs()`.
- Если передан `designQuality`, сохраняется в `window._designQualitySaved`.

**Пример:**

```javascript
const serialized = graph.toSerial();
const newGraph = new Graph();
newGraph.loadFrom(serialized);
```

## getTypeDisplayName(typeKey)

```javascript
getTypeDisplayName(typeKey: string): string
```

Возвращает локализованное имя типа данных, используя систему i18n. Если перевод для ключа `dataTypes.${typeKey}` отсутствует, возвращает строку с заглавной первой буквой `typeKey`.

**Параметры:**

- `typeKey` – строковый идентификатор типа.

**Возвращает:** локализованное имя типа.

# ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Создание графа и добавление узлов

```javascript
import { Graph } from './core/Graph.js';
import { NumberNode } from './nodes/NumberNode.js';
import { OutputNode } from './nodes/OutputNode.js';

const graph = new Graph();
const numNode = new NumberNode(null, 100, 200, 'Value', { val: 42 });
const outNode = new OutputNode(null, 400, 200, 'Result');

graph.addNode(numNode);
graph.addNode(outNode);
graph.addEdge(numNode.id, outNode.id);
graph.reevaluateAll();
console.log(outNode.rows); // [{ param: 'Value 1', value: '42.000000' }]
```

### Сериализация и десериализация

```javascript
const snapshot = graph.toSerial();
localStorage.setItem('myGraph', JSON.stringify(snapshot));

// Позже:
const restored = JSON.parse(localStorage.getItem('myGraph'));
graph.loadFrom(restored);
```

### Проверка возможности соединения

```javascript
const sourceId = 1, targetId = 2;
if (graph.canConnect(sourceId, targetId)) {
  graph.addEdge(sourceId, targetId);
} else {
  console.warn('Типы несовместимы');
}
```

## ЗАМЕЧАНИЯ

- Все методы, изменяющие граф (`addNode`, `removeNode`, `addEdge`, `removeEdge`), **не вызывают автоматически** перерисовку.
- Система типов (`typeSystem`) инициализируется отдельно через `typeSystem.initFromNodeRegistry`.
- Метод `getSourceValue` рекурсивно обходит зависимости, но не кэширует результаты – повторные вызовы могут быть затратными.
- При загрузке через `loadFrom` не проверяется совместимость типов восстановленных связей – предполагается, что сохранённый граф уже корректен.
- Глобальные переменные `window._designQualitySaved`, `window._viewportX` и другие используются для взаимодействия с другими подсистемами.
