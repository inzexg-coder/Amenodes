# `Graph.md`

## Обзор

`Graph` – центральный класс, управляющий всей структурой вычислительной схемы: узлами, соединениями, пересчётами, сериализацией. 
Он реализует направленный ациклический граф (DAG) с поддержкой типов данных, проверкой циклов и автоматическим пересчётом значений.

**Путь в проекте:** `src/core/Graph.js`

**Импорт:**
```javascript
import { Graph } from './core/Graph.js';
```

## Конструктор

```javascript
const graph = new Graph();
```

Создаёт пустой граф с внутренними счётчиками идентификаторов.

**Внутренние свойства:**
- `nodes: Array<Node>` – массив всех узлов
- `edges: Array<Edge>` – массив соединений
- `nextId: number` – следующий доступный ID для узла
- `nextEdgeId: number` – следующий доступный ID для ребра
- `map: Map<number, Node>` – быстрый доступ к узлу по ID

## Методы управления узлами

### `addNode(node)`

Добавляет узел в граф. Автоматически присваивает ID.

```javascript
import { NumberNode } from '../nodes/NumberNode.js';

const numberNode = new NumberNode(null, 100, 200, "My Number", 42);
graph.addNode(numberNode);
console.log(numberNode.id); // 1
```

**Возвращает:** `Node` – тот же узел с заполненным `id`.

**Особенности:**
- Если узел имеет внутренние методы, устанавливается ссылка `node.graph = this` для доступа к методам графа внутри узла.

### `removeNode(id)`

Удаляет узел по ID, а также все связанные с ним рёбра (входящие и исходящие).

```javascript
graph.removeNode(1);
```

**Примечание:** Не вызывает автоматический пересчёт – вызывающий код должен сделать это сам (обычно через `graph.reevaluateAll()`).

## Методы управления соединениями

### `addEdge(sourceId, targetId, port = 'main')`

Создаёт соединение от выходного порта источника к узлу-приёмнику.

```javascript
const edge = graph.addEdge(1, 2, 'main');
if (edge) {
  console.log(`Edge created with id ${edge.id}`);
}
```

**Проверки:**
1. **Циклическая зависимость** – вызывает `hasCycle(sourceId, targetId)`. Если цикл обнаружен, показывает модальное окно и возвращает `null`.
2. **Совместимость типов** – вызывает `canConnect()`. Если типы несовместимы, показывает ошибку и возвращает `null`.
3. **Дубликаты** – если уже есть ребро между теми же портами, возвращает `null`.
4. **Отдельные проверки для типов**

**Возвращает:** `Edge | null`.

### `removeEdge(id)`

Удаляет ребро по ID.

```javascript
graph.removeEdge(5);
```

### `getIncomingEdges(targetId)`

Возвращает массив рёбер, входящих в узел.

```javascript
const incoming = graph.getIncomingEdges(2);
console.log(incoming.length);
```

### `getOutgoingEdges(sourceId)`

Возвращает массив рёбер, исходящих из узла.

## Проверки и валидация

### `hasCycle(source, target)`

Проверяет, создаст ли добавление ребра от `source` к `target` цикл.

```javascript
const willCreateCycle = graph.hasCycle(1, 2); // boolean
```

**Алгоритм:** обход в глубину (DFS) от `target` вниз по исходящим рёбрам. Если `source` встречается, то цикл есть.

### `canConnect(sourceId, targetId, port = 'main')`

Проверяет, допустимо ли соединение по системе типов.

```javascript
if (graph.canConnect(1, 2)) {
  // можно соединять
}
```

Использует `typeSystem.canConnect()` и `typeSystem.getNodeType()`.

## Получение данных и вычисления

### `getSourceValue(source, port = 'main', visited = new Set())`

Рекурсивно получает значения из узла-источника, обрабатывая специальные случаи (`MapNode` с отдельным портом, `OutputNode` и т.д.). Защита от циклов через `visited`.

**Возвращает:** `Array<number>` – всегда массив чисел (даже для скаляра).

```javascript
const sourceNode = graph.getNode(1);
const values = graph.getSourceValue(sourceNode, 'main');
console.log(values); // [42, 55, 10]
```

**Логика по основным типам узлов:**
- `NumberNode`, `ConstantNode`, `GroupNode` → их `getValue()`
- `MapNode` с портом `unmapped` → `getUnmapped()`
- `CalcNode` → если результат `null` – `[]`, иначе массив
- `OutputNode` → собирает значения со всех входящих рёбер рекурсивно
- По умолчанию – возвращает `[]`

### `getMergedInput(nodeId)`

Собирает все входные значения узла, объединяя массивы из всех входящих соединений.

```javascript
const inputArray = graph.getMergedInput(5);
console.log(inputArray); // [1, 2, 3, 100, 200]
```

**Порядок:** значения из рёбер добавляются в том порядке, в котором рёбра хранятся в `graph.edges`.

### `getPairedForSqrt(nodeId)`

Специальный метод для вычислительных узлов с поэлементными операциями. Реализует логику:
- Один вход → ожидает массив из двух чисел
- Два входа → поэлементное вычисление с расширением скаляров и дополнением нулями.

**Возвращает:** `{ ok: boolean, res: Array<number> }`.

```javascript
const paired = graph.getPairedForSqrt(calcNodeId);
if (paired.ok) {
  console.log('Result:', paired.res);
}
```

## Пересчёт и обновление

### `reevaluateCalc(calcNode)`

Пересчитывает значение узла типа `CalcNode` на основе его `calcType` и текущих входов.

**Поддерживаемые типы:**
- `'div3'` – деление на 3
- `'div_sqrt12'` – деление на √12
- `'sqrt_sum_sq'` – вызывает `getPairedForSqrt()`

Результат сохраняется в `calcNode.result` и `calcNode.resultStr`.

### `reevaluateAll()`

Запускает пересчёт всех узлов типа `CalcNode`, `ConfidenceIntervalNode`, а также обновляет ссылки `graph` для `MapNode` и `OutputNode`.

**Вызывать после любых изменений графа (добавление/удаление узлов/рёбер, изменение параметров).**

```javascript
graph.reevaluateAll();
```

### `updateOutput(outputNode)`

Обновляет таблицу узла `OutputNode` на основе входящих данных. Заполняет `outputNode.rows` и обновляет заголовок.

### `updateAllOutputs()`

Вызывает `updateOutput` для всех узлов типа `OutputNode` в графе.

## Сериализация и загрузка

### `toSerial()`

Возвращает объект для сохранения:

```javascript
const snapshot = graph.toSerial();
// {
//   nodes: [...],
//   edges: [...],
//   nextId: 10,
//   nextEdgeId: 15,
//   designQuality: 100
// }
```

### `loadFrom(data)`

Восстанавливает состояние графа из ранее сохранённого объекта. Очищает текущие узлы и рёбра, воссоздаёт их с правильными конструкторами на основе `nodeData.type`. После загрузки вызывает `reevaluateAll()` и `updateAllOutputs()`.

```javascript
const saved = JSON.parse(localStorage.getItem('backup'));
graph.loadFrom(saved);
```

## Примеры использования

### Создание графа с двумя узлами и связью

```javascript
import { Graph } from './core/Graph.js';
import { NumberNode } from './nodes/NumberNode.js';
import { OutputNode } from './nodes/OutputNode.js';

const graph = new Graph();

const num = new NumberNode(null, 100, 100, 'Value', 3.14);
const out = new OutputNode(null, 400, 100, 'Result', []);

graph.addNode(num);
graph.addNode(out);

const edge = graph.addEdge(num.id, out.id);
if (edge) {
  graph.reevaluateAll();
  graph.updateAllOutputs();
  console.log(out.rows); // [{ param: "Value 1", value: "3.140000" }]
}
```

### Работа с типами и проверка соединения

```javascript
import { typeSystem, DataType } from './DataType.js';

const sourceType = typeSystem.getNodeType(num); // 'num'
const targetType = typeSystem.getNodeType(out); // 'auto'
const can = graph.canConnect(num.id, out.id); // true
```

### Сохранение и восстановление

```javascript
const serial = graph.toSerial();
localStorage.setItem('myGraph', JSON.stringify(serial));

// Позже:
const restored = JSON.parse(localStorage.getItem('myGraph'));
graph.loadFrom(restored);
```

## Наследование и расширение

Класс `Graph` не предназначен для наследования. Он используется как синглтон в приложении. Однако вы можете создать несколько независимых графов, если нужно работать с разными схемами.

## Внутренние зависимости

- `NumberNode`, `GroupNode`, `CalcNode`, `OutputNode`, `ConstantNode`, `MapNode`, `ConfidenceIntervalNode` – для восстановления в `loadFrom`
- `Edge` – модель ребра
- `typeSystem`, `DataType` – проверка соединений
- `modal` – показ сообщений об ошибках
- `i18n` – локализация текстов ошибок и заголовков по умолчанию

## Исключения и ошибки

- При попытке создать цикл – модальное окно с текстом `errors.cyclicDependency` и возврат `null`.
- При несовместимости типов – модальное окно с сообщением `errors.cannotConnect` и возврат `null`.
- При попытке соединить узел с самим собой – `hasCycle` вернёт `true`, соединение заблокировано.
- Для `ConfidenceIntervalNode` попытка добавить третье ребро – модальное окно `errors.maxTwoInputs`.

## Производительность

- `getSourceValue` использует `visited` Set для предотвращения бесконечной рекурсии.
- При большом количестве узлов рекомендуется использовать кэширование и виртуализацию через `DomRenderer`.
- Пересчёт при каждом изменении – полный. Для сложных схем с сотнями узлов стоит рассмотреть оптимизации из панели Optimizations.
